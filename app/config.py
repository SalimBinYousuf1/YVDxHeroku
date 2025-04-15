import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-for-tasvid')
    SQLALCHEMY_DATABASE_URI = 'sqlite:///tasvid.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Cache configuration
    CACHE_TYPE = 'simple'
    
    # Mail configuration
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME', 'salim.bin.yousuf2@gmail.com')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', 'xwmt tpjj lvkr ndyw')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'salim.bin.yousuf2@gmail.com')
    
    # Download paths
    DOWNLOAD_FOLDER = os.path.join(os.path.expanduser('~'), 'Desktop', 'TasVID')
    VIDEOS_FOLDER = os.path.join(DOWNLOAD_FOLDER, 'videos')
    AUDIO_FOLDER = os.path.join(DOWNLOAD_FOLDER, 'audio')
    
    # Ensure download directories exist
    @staticmethod
    def init_app(app):
        os.makedirs(Config.VIDEOS_FOLDER, exist_ok=True)
        os.makedirs(Config.AUDIO_FOLDER, exist_ok=True)


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False
    # Use environment variables in production
    SECRET_KEY = os.environ.get('SECRET_KEY')
    

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
