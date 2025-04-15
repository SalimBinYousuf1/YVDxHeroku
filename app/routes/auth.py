from flask import Blueprint, render_template, redirect, url_for, request, flash, session
from flask_login import login_user, logout_user, login_required, current_user
from app.models.user import User, db
from app.models.user_settings import UserSettings
import random
import string
from flask_mail import Message
from app import mail
import os
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """User login route"""
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user)
            user.last_login = datetime.utcnow()
            db.session.commit()
            next_page = request.args.get('next')
            return redirect(next_page or url_for('downloader.main'))
        flash('Invalid email or password')
    
    return render_template('auth/login.html')

@auth_bp.route('/signup', methods=['GET', 'POST'])
def signup():
    """User signup route"""
    if request.method == 'POST':
        email = request.form.get('email')
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('Email already registered')
            return redirect(url_for('auth.login'))
        
        # Generate OTP
        otp = ''.join(random.choices(string.digits, k=6))
        session['signup_email'] = email
        session['signup_otp'] = otp
        
        # Send OTP email
        msg = Message('TasVID - Email Verification Code', recipients=[email])
        msg.html = render_template('auth/email/otp_email.html', otp=otp)
        mail.send(msg)
        
        return redirect(url_for('auth.verify_otp'))
    
    return render_template('auth/signup.html')

@auth_bp.route('/verify-otp', methods=['GET', 'POST'])
def verify_otp():
    """OTP verification route"""
    if 'signup_email' not in session or 'signup_otp' not in session:
        return redirect(url_for('auth.signup'))
    
    if request.method == 'POST':
        entered_otp = request.form.get('otp')
        if entered_otp == session['signup_otp']:
            # Create new user
            new_user = User(email=session['signup_email'])
            new_user.set_password(request.form.get('password'))
            db.session.add(new_user)
            db.session.flush()  # Get user ID before committing
            
            # Create default settings for user
            settings = UserSettings(user_id=new_user.id)
            db.session.add(settings)
            db.session.commit()
            
            # Clean up session
            session.pop('signup_email', None)
            session.pop('signup_otp', None)
            
            flash('Account created successfully! Please log in.')
            return redirect(url_for('auth.login'))
        else:
            flash('Invalid OTP. Please try again.')
    
    return render_template('auth/verify_otp.html', email=session['signup_email'])

@auth_bp.route('/logout')
@login_required
def logout():
    """User logout route"""
    logout_user()
    return redirect(url_for('main.index'))

@auth_bp.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    """User settings route"""
    if request.method == 'POST':
        settings = UserSettings.query.filter_by(user_id=current_user.id).first()
        if not settings:
            settings = UserSettings(user_id=current_user.id)
            db.session.add(settings)
        
        settings.theme = request.form.get('theme', 'cream')
        settings.default_quality = request.form.get('default_quality', '720p')
        settings.default_format = request.form.get('default_format', 'mp4')
        settings.save_location = request.form.get('save_location', '')
        
        db.session.commit()
        flash('Settings updated successfully')
        
    settings = UserSettings.query.filter_by(user_id=current_user.id).first()
    return render_template('auth/settings.html', settings=settings)
