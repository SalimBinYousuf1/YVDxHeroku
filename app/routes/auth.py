from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash, current_app
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import random
import string
import os
from datetime import datetime, timedelta
from flask_mail import Message
from app import mail, db
from app.models.user import User
from app.models.user_settings import UserSettings

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

# OTP storage (in a real app, this would be in a database with expiration)
otps = {}

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False
        
        user = User.query.filter_by(email=email).first()
        
        # Check if user exists and password is correct
        if not user or not check_password_hash(user.password, password):
            flash('Please check your login details and try again.', 'error')
            return render_template('auth/login.html')
        
        # Log in the user
        login_user(user, remember=remember)
        
        # Redirect to the appropriate page
        next_page = request.args.get('next')
        if not next_page or not next_page.startswith('/'):
            next_page = url_for('downloader.main')
        
        return redirect(next_page)
    
    return render_template('auth/login.html')

@auth_bp.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # Check if passwords match
        if password != confirm_password:
            flash('Passwords do not match.', 'error')
            return render_template('auth/signup.html')
        
        # Check if user already exists
        user = User.query.filter_by(email=email).first()
        if user:
            flash('Email address already exists.', 'error')
            return render_template('auth/signup.html')
        
        # Generate OTP
        otp = ''.join(random.choices(string.digits, k=6))
        
        # Store OTP with expiration (30 minutes)
        otps[email] = {
            'otp': otp,
            'expires': datetime.now() + timedelta(minutes=30),
            'password': generate_password_hash(password)
        }
        
        # Send OTP email
        try:
            send_otp_email(email, otp)
            flash('OTP sent to your email. Please verify to complete registration.', 'success')
            return redirect(url_for('auth.verify_otp', email=email))
        except Exception as e:
            current_app.logger.error(f"Error sending OTP email: {str(e)}")
            flash('Error sending OTP. Please try again.', 'error')
            return render_template('auth/signup.html')
    
    return render_template('auth/signup.html')

@auth_bp.route('/verify-otp/<email>', methods=['GET', 'POST'])
def verify_otp(email):
    if email not in otps:
        flash('Invalid or expired OTP session. Please try again.', 'error')
        return redirect(url_for('auth.signup'))
    
    if datetime.now() > otps[email]['expires']:
        del otps[email]
        flash('OTP has expired. Please try again.', 'error')
        return redirect(url_for('auth.signup'))
    
    if request.method == 'POST':
        entered_otp = request.form.get('otp')
        
        if entered_otp == otps[email]['otp']:
            # Create new user
            new_user = User(
                email=email,
                password=otps[email]['password'],
                registered_on=datetime.now()
            )
            
            # Add user to database
            db.session.add(new_user)
            db.session.commit()
            
            # Create default user settings
            default_settings = UserSettings(
                user_id=new_user.id,
                theme='cream-theme',
                default_quality='720p',
                default_format='mp4',
                compression_level='medium',
                save_history=True
            )
            
            # Add settings to database
            db.session.add(default_settings)
            db.session.commit()
            
            # Remove OTP from storage
            del otps[email]
            
            # Log in the user
            login_user(new_user)
            
            flash('Registration successful!', 'success')
            return redirect(url_for('downloader.main'))
        else:
            flash('Invalid OTP. Please try again.', 'error')
    
    return render_template('auth/verify_otp.html', email=email)

@auth_bp.route('/resend-otp/<email>')
def resend_otp(email):
    if email not in otps:
        flash('Invalid or expired OTP session. Please try again.', 'error')
        return redirect(url_for('auth.signup'))
    
    # Generate new OTP
    otp = ''.join(random.choices(string.digits, k=6))
    
    # Update OTP and expiration
    otps[email]['otp'] = otp
    otps[email]['expires'] = datetime.now() + timedelta(minutes=30)
    
    # Send OTP email
    try:
        send_otp_email(email, otp)
        flash('New OTP sent to your email.', 'success')
    except Exception as e:
        current_app.logger.error(f"Error sending OTP email: {str(e)}")
        flash('Error sending OTP. Please try again.', 'error')
    
    return redirect(url_for('auth.verify_otp', email=email))

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'success')
    return redirect(url_for('main.index'))

@auth_bp.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    # Get user settings
    user_settings = UserSettings.query.filter_by(user_id=current_user.id).first()
    
    if not user_settings:
        # Create default settings if not exists
        user_settings = UserSettings(
            user_id=current_user.id,
            theme='cream-theme',
            default_quality='720p',
            default_format='mp4',
            compression_level='medium',
            save_history=True
        )
        db.session.add(user_settings)
        db.session.commit()
    
    if request.method == 'POST':
        # Update settings
        user_settings.theme = request.form.get('theme', 'cream-theme')
        user_settings.default_quality = request.form.get('default_quality', '720p')
        user_settings.default_format = request.form.get('default_format', 'mp4')
        user_settings.compression_level = request.form.get('compression_level', 'medium')
        user_settings.save_history = True if request.form.get('save_history') else False
        
        # Save changes
        db.session.commit()
        
        flash('Settings updated successfully.', 'success')
        return redirect(url_for('auth.settings'))
    
    return render_template('auth/settings.html', settings=user_settings)

@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')
    
    # Check if current password is correct
    if not check_password_hash(current_user.password, current_password):
        flash('Current password is incorrect.', 'error')
        return redirect(url_for('auth.settings'))
    
    # Check if new passwords match
    if new_password != confirm_password:
        flash('New passwords do not match.', 'error')
        return redirect(url_for('auth.settings'))
    
    # Update password
    current_user.password = generate_password_hash(new_password)
    db.session.commit()
    
    flash('Password updated successfully.', 'success')
    return redirect(url_for('auth.settings'))

@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')
        
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        if not user:
            flash('No account found with that email address.', 'error')
            return render_template('auth/forgot_password.html')
        
        # Generate OTP
        otp = ''.join(random.choices(string.digits, k=6))
        
        # Store OTP with expiration (30 minutes)
        otps[email] = {
            'otp': otp,
            'expires': datetime.now() + timedelta(minutes=30),
            'reset_password': True
        }
        
        # Send OTP email
        try:
            send_otp_email(email, otp, reset_password=True)
            flash('OTP sent to your email. Please verify to reset your password.', 'success')
            return redirect(url_for('auth.reset_password', email=email))
        except Exception as e:
            current_app.logger.error(f"Error sending OTP email: {str(e)}")
            flash('Error sending OTP. Please try again.', 'error')
            return render_template('auth/forgot_password.html')
    
    return render_template('auth/forgot_password.html')

@auth_bp.route('/reset-password/<email>', methods=['GET', 'POST'])
def reset_password(email):
    if email not in otps or not otps[email].get('reset_password'):
        flash('Invalid or expired reset session. Please try again.', 'error')
        return redirect(url_for('auth.forgot_password'))
    
    if datetime.now() > otps[email]['expires']:
        del otps[email]
        flash('OTP has expired. Please try again.', 'error')
        return redirect(url_for('auth.forgot_password'))
    
    if request.method == 'POST':
        entered_otp = request.form.get('otp')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        if entered_otp != otps[email]['otp']:
            flash('Invalid OTP. Please try again.', 'error')
            return render_template('auth/reset_password.html', email=email)
        
        if new_password != confirm_password:
            flash('Passwords do not match.', 'error')
            return render_template('auth/reset_password.html', email=email)
        
        # Update user password
        user = User.query.filter_by(email=email).first()
        user.password = generate_password_hash(new_password)
        db.session.commit()
        
        # Remove OTP from storage
        del otps[email]
        
        flash('Password reset successful. Please log in with your new password.', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('auth/reset_password.html', email=email)

def send_otp_email(email, otp, reset_password=False):
    subject = 'Password Reset OTP' if reset_password else 'Email Verification OTP'
    
    msg = Message(
        subject,
        recipients=[email],
        sender=current_app.config['MAIL_DEFAULT_SENDER']
    )
    
    # HTML email template
    msg.html = render_template(
        'auth/email/otp_email.html',
        otp=otp,
        reset_password=reset_password
    )
    
    mail.send(msg)
