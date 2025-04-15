from flask import Blueprint, render_template, redirect, url_for

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Landing page route"""
    return render_template('index.html')

@main_bp.route('/about')
def about():
    """About page route"""
    return render_template('about.html')

@main_bp.route('/contact')
def contact():
    """Contact page route"""
    return render_template('contact.html')
