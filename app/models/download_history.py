from app import db
from datetime import datetime

class DownloadHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    title = db.Column(db.String(255), nullable=False)
    video_id = db.Column(db.String(20), nullable=False)
    thumbnail_url = db.Column(db.String(255))
    format_type = db.Column(db.String(20), nullable=False)  # video or audio
    resolution = db.Column(db.String(10))
    file_size = db.Column(db.Float)  # Size in MB
    file_path = db.Column(db.String(255))
    download_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<DownloadHistory {self.title}>'
