from flask import Flask
from dotenv import load_dotenv
import os

# Create the main application file
def create_app():
    # Load environment variables
    load_dotenv()
    
    # Create Flask app
    app = Flask(__name__)
    
    # Import and register blueprints
    from app.routes.main import main_bp
    from app.routes.auth import auth_bp
    from app.routes.downloader import downloader_bp
    
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(downloader_bp, url_prefix='/downloader')
    
    # Configure app
    app.config.from_object('app.config.DevelopmentConfig')
    
    # Initialize extensions
    from app.models.user import db
    db.init_app(app)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app

# Create app instance for running
app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
