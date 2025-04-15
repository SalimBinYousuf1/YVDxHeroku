from flask import Blueprint, render_template, request, jsonify, send_file, current_app, flash, redirect, url_for
from flask_login import login_required, current_user
import os
import yt_dlp
import validators
import uuid
import time
from moviepy.video.io.VideoFileClip import VideoFileClip
from datetime import datetime
from app.models.download_history import DownloadHistory, db
from app.models.user_settings import UserSettings
from app.utils.device_detection import detect_device
from app.utils.file_utils import clean_filename, get_file_size, create_qr_code
import platform
import shutil

downloader_bp = Blueprint('downloader', __name__)

@downloader_bp.route('/main')
def main():
    """Main downloader page"""
    # Get user settings if logged in
    settings = None
    if current_user.is_authenticated:
        settings = UserSettings.query.filter_by(user_id=current_user.id).first()
    
    return render_template('downloader/main.html', settings=settings)

@downloader_bp.route('/analyze', methods=['POST'])
def analyze():
    """Analyze YouTube URL and return available formats"""
    url = request.form.get('url')
    
    # Validate URL
    if not validators.url(url) or 'youtube.com' not in url and 'youtu.be' not in url:
        return jsonify({'error': 'Invalid YouTube URL'}), 400
    
    try:
        # YT-DLP options for fetching video info
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
            'format': 'best',
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Process formats
            formats = []
            for f in info.get('formats', []):
                if f.get('filesize'):
                    size_mb = round(f.get('filesize') / (1024 * 1024), 2)
                else:
                    size_mb = None
                
                format_info = {
                    'format_id': f.get('format_id'),
                    'ext': f.get('ext'),
                    'resolution': f.get('resolution', 'Audio only' if f.get('acodec') != 'none' and f.get('vcodec') == 'none' else 'Unknown'),
                    'filesize': size_mb,
                    'format_note': f.get('format_note', ''),
                    'vcodec': 'none' if f.get('vcodec') == 'none' else 'video',
                    'acodec': 'none' if f.get('acodec') == 'none' else 'audio',
                }
                formats.append(format_info)
            
            # Filter and sort formats
            video_formats = [f for f in formats if f['vcodec'] != 'none']
            audio_formats = [f for f in formats if f['acodec'] != 'none' and f['vcodec'] == 'none']
            
            # Sort by resolution (for video) and filesize
            video_formats.sort(key=lambda x: (x['resolution'], x['filesize'] or 0), reverse=True)
            audio_formats.sort(key=lambda x: x['filesize'] or 0, reverse=True)
            
            return jsonify({
                'title': info.get('title'),
                'thumbnail': info.get('thumbnail'),
                'duration': info.get('duration'),
                'video_formats': video_formats,
                'audio_formats': audio_formats,
                'video_id': info.get('id')
            })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@downloader_bp.route('/download', methods=['POST'])
def download():
    """Download video/audio in selected format"""
    url = request.form.get('url')
    format_id = request.form.get('format_id')
    title = request.form.get('title')
    video_id = request.form.get('video_id')
    thumbnail = request.form.get('thumbnail')
    format_type = request.form.get('format_type')  # 'video' or 'audio'
    compress = request.form.get('compress', 'false') == 'true'
    
    # Validate inputs
    if not url or not format_id or not title or not video_id or not format_type:
        return jsonify({'error': 'Missing required parameters'}), 400
    
    # Determine save location based on device and format type
    device_type = detect_device(request.user_agent.string)
    
    # Get user settings if logged in
    if current_user.is_authenticated:
        settings = UserSettings.query.filter_by(user_id=current_user.id).first()
        if settings and settings.save_location:
            base_path = settings.save_location
        else:
            base_path = get_default_save_path(device_type)
    else:
        base_path = get_default_save_path(device_type)
    
    # Create subdirectories
    if format_type == 'video':
        save_dir = os.path.join(base_path, 'videos')
    else:
        save_dir = os.path.join(base_path, 'audio')
    
    os.makedirs(save_dir, exist_ok=True)
    
    # Clean filename
    clean_title = clean_filename(title)
    filename = f"{clean_title}_{uuid.uuid4().hex[:8]}"
    
    try:
        # Set up yt-dlp options
        ydl_opts = {
            'format': format_id,
            'outtmpl': os.path.join(save_dir, f'{filename}.%(ext)s'),
            'quiet': False,
            'no_warnings': True,
            'progress_hooks': [lambda d: print(f"Downloaded {d['downloaded_bytes'] / d['total_bytes'] * 100:.1f}%")],
        }
        
        # Add postprocessors for audio extraction if needed
        if format_type == 'audio':
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }]
        
        # Download the file
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            downloaded_file = ydl.prepare_filename(info)
            
            # Handle extension changes from postprocessors
            if format_type == 'audio':
                base, _ = os.path.splitext(downloaded_file)
                downloaded_file = f"{base}.mp3"
            
            # Compress video if requested
            if compress and format_type == 'video':
                original_file = downloaded_file
                base, ext = os.path.splitext(downloaded_file)
                compressed_file = f"{base}_compressed{ext}"
                
                # Use moviepy for compression
                clip = mp.VideoFileClip(original_file)
                clip.write_videofile(compressed_file, codec='libx264', preset='slow', bitrate='1000k')
                clip.close()
                
                # Replace original with compressed
                os.remove(original_file)
                os.rename(compressed_file, original_file)
            
            # Add metadata tag
            # This would require additional processing with ffmpeg
            
            # Get file size
            file_size = get_file_size(downloaded_file)
            
            # Save to download history if user is logged in
            if current_user.is_authenticated:
                history = DownloadHistory(
                    user_id=current_user.id,
                    title=title,
                    video_id=video_id,
                    thumbnail_url=thumbnail,
                    format_type=format_type,
                    resolution=info.get('resolution', 'Unknown'),
                    file_size=file_size,
                    file_path=downloaded_file
                )
                db.session.add(history)
                db.session.commit()
            
            return jsonify({
                'success': True,
                'file_path': downloaded_file,
                'file_size': file_size,
                'message': f"Successfully downloaded to {downloaded_file}"
            })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@downloader_bp.route('/history')
@login_required
def history():
    """Show download history"""
    downloads = DownloadHistory.query.filter_by(user_id=current_user.id).order_by(DownloadHistory.download_date.desc()).all()
    return render_template('downloader/history.html', downloads=downloads)

@downloader_bp.route('/delete-history/<int:id>')
@login_required
def delete_history(id):
    """Delete history entry"""
    history = DownloadHistory.query.get_or_404(id)
    
    # Check if user owns this history entry
    if history.user_id != current_user.id:
        flash('Unauthorized access')
        return redirect(url_for('downloader.history'))
    
    # Delete file if it exists
    if history.file_path and os.path.exists(history.file_path):
        try:
            os.remove(history.file_path)
        except:
            pass
    
    # Delete history entry
    db.session.delete(history)
    db.session.commit()
    
    flash('History entry deleted')
    return redirect(url_for('downloader.history'))

@downloader_bp.route('/generate-qr/<int:id>')
@login_required
def generate_qr(id):
    """Generate QR code for sharing a file"""
    history = DownloadHistory.query.get_or_404(id)
    
    # Check if user owns this history entry
    if history.user_id != current_user.id:
        flash('Unauthorized access')
        return redirect(url_for('downloader.history'))
    
    # Generate QR code for file path
    qr_path = create_qr_code(history.file_path)
    
    return send_file(qr_path, mimetype='image/png')

def get_default_save_path(device_type):
    """Get default save path based on device type"""
    if device_type in ['phone', 'tablet']:
        # For mobile devices, use a more accessible location
        if platform.system() == 'Windows':
            return os.path.join(os.path.expanduser('~'), 'Downloads', 'TasVID')
        elif platform.system() == 'Darwin':  # macOS
            return os.path.join(os.path.expanduser('~'), 'Downloads', 'TasVID')
        else:  # Linux and others
            return os.path.join(os.path.expanduser('~'), 'Downloads', 'TasVID')
    else:
        # For desktop, use Desktop/TasVID
        if platform.system() == 'Windows':
            return os.path.join(os.path.expanduser('~'), 'Desktop', 'TasVID')
        elif platform.system() == 'Darwin':  # macOS
            return os.path.join(os.path.expanduser('~'), 'Desktop', 'TasVID')
        else:  # Linux and others
            return os.path.join(os.path.expanduser('~'), 'Desktop', 'TasVID')
