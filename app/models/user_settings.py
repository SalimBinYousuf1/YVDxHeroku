from app.models.user import db
from datetime import datetime

class UserSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    theme = db.Column(db.String(20), default='cream')  # cream, dark, neon, dot
    default_quality = db.Column(db.String(10), default='720p')
    default_format = db.Column(db.String(10), default='mp4')
    save_location = db.Column(db.String(255))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<UserSettings for user_id={self.user_id}>'
