from flask import Flask
from flask_caching import Cache
from flask_login import LoginManager
from flask_mail import Mail
from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize extensions
cache = Cache()
login_manager = LoginManager()
mail = Mail()
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Configure app
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-tasvid')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasvid.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Configure cache
    app.config['CACHE_TYPE'] = 'simple'
    
    # Configure mail
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', 'salim.bin.yousuf2@gmail.com')
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', 'xwmt tpjj lvkr ndyw')
    app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', 'salim.bin.yousuf2@gmail.com')
    
    # Initialize extensions with app
    cache.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    mail.init_app(app)
    
    # Register blueprints
    from app.routes.main import main_bp
    from app.routes.auth import auth_bp
    from app.routes.downloader import downloader_bp
    
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(downloader_bp, url_prefix='/downloader')
    
    # Create database tables
    from app.models.user import User
    from app.models.download_history import DownloadHistory
    from app.models.user_settings import UserSettings
    
    with app.app_context():
        db.init_app(app)
        db.create_all()
    
    return app
