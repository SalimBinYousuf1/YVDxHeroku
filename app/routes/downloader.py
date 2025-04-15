from flask import Blueprint, render_template, request, jsonify, current_app, send_file, url_for, redirect, flash, session
from flask_login import login_required, current_user
import yt_dlp
import validators
import uuid
import time
import os
import json
import qrcode
from moviepy.video.io.VideoFileClip import VideoFileClip
from datetime import datetime
from app.models.download_history import DownloadHistory, db
from app.models.user_settings import UserSettings
from app.utils.device_detection import detect_device
from app.utils.file_utils import create_directory, clean_filename, get_file_size

downloader_bp = Blueprint('downloader', __name__, url_prefix='/downloader')

@downloader_bp.route('/')
def main():
    return render_template('downloader/main.html')

@downloader_bp.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    url = data.get('url')
    
    if not url or not validators.url(url):
        return jsonify({'success': False, 'error': 'Invalid URL provided'})
    
    try:
        # Configure yt-dlp options
        ydl_opts = {
            'format': 'best',
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
            'noplaylist': True,
        }
        
        # Extract video information
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Format the response
            formats = {
                'video': [],
                'audio': []
            }
            
            # Process video formats
            for format in info.get('formats', []):
                if format.get('vcodec') != 'none' and format.get('acodec') != 'none':
                    # This is a video with audio
                    resolution = format.get('height', 'unknown')
                    if resolution != 'unknown':
                        resolution = f"{resolution}p"
                    
                    # Calculate file size in MB
                    filesize = format.get('filesize')
                    if filesize:
                        filesize = f"{filesize / (1024 * 1024):.1f} MB"
                    else:
                        filesize = "Unknown"
                    
                    formats['video'].append({
                        'id': format.get('format_id'),
                        'resolution': resolution,
                        'size': filesize,
                        'format': format.get('ext', 'mp4')
                    })
                elif format.get('acodec') != 'none' and format.get('vcodec') == 'none':
                    # This is audio only
                    bitrate = format.get('abr', 'unknown')
                    if bitrate != 'unknown':
                        bitrate = f"{bitrate} kbps"
                    
                    # Calculate file size in MB
                    filesize = format.get('filesize')
                    if filesize:
                        filesize = f"{filesize / (1024 * 1024):.1f} MB"
                    else:
                        filesize = "Unknown"
                    
                    formats['audio'].append({
                        'id': format.get('format_id'),
                        'resolution': f"Audio ({bitrate})",
                        'size': filesize,
                        'format': format.get('ext', 'mp3')
                    })
            
            # Sort formats by resolution (for video) or bitrate (for audio)
            formats['video'] = sorted(formats['video'], 
                                     key=lambda x: int(x['resolution'].replace('p', '')) if x['resolution'] != 'unknown' else 0, 
                                     reverse=True)
            
            # Prepare response
            response = {
                'success': True,
                'title': info.get('title', 'Unknown Title'),
                'thumbnail': info.get('thumbnail', ''),
                'duration': str(int(info.get('duration', 0) // 60)) + ':' + str(int(info.get('duration', 0) % 60)).zfill(2),
                'author': info.get('uploader', 'Unknown'),
                'views': f"{info.get('view_count', 0):,}",
                'published': info.get('upload_date', 'Unknown'),
                'formats': formats,
                'video_id': info.get('id')
            }
            
            return jsonify(response)
    
    except Exception as e:
        current_app.logger.error(f"Error analyzing URL: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@downloader_bp.route('/download', methods=['POST'])
def download():
    data = request.get_json()
    url = data.get('url')
    format_id = data.get('format_id')
    compression_level = data.get('compression_level', 'medium')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    
    if not url or not validators.url(url) or not format_id:
        return jsonify({'success': False, 'error': 'Invalid parameters provided'})
    
    try:
        # Generate a unique download ID
        download_id = str(uuid.uuid4())
        
        # Determine save directory based on device
        device_type = detect_device(request.user_agent.string)
        
        if device_type == 'mobile':
            save_dir = os.path.join(os.path.expanduser('~'), 'Downloads', 'TasVID')
        else:
            save_dir = os.path.join(os.path.expanduser('~'), 'Desktop', 'TasVID')
        
        # Create directory if it doesn't exist
        create_directory(save_dir)
        
        # Configure yt-dlp options
        ydl_opts = {
            'format': format_id,
            'outtmpl': os.path.join(save_dir, '%(title)s.%(ext)s'),
            'quiet': False,
            'no_warnings': True,
            'noplaylist': True,
            'progress_hooks': [lambda d: update_progress(d, download_id)],
        }
        
        # Start download in a background thread
        import threading
        download_thread = threading.Thread(
            target=download_video,
            args=(url, ydl_opts, download_id, compression_level, start_time, end_time)
        )
        download_thread.daemon = True
        download_thread.start()
        
        # Store download info in session
        session['downloads'] = session.get('downloads', {})
        session['downloads'][download_id] = {
            'url': url,
            'format_id': format_id,
            'status': 'started',
            'progress': 0,
            'file_path': None,
            'start_time': datetime.now().isoformat()
        }
        session.modified = True
        
        return jsonify({
            'success': True,
            'download_id': download_id,
            'message': 'Download started'
        })
    
    except Exception as e:
        current_app.logger.error(f"Error starting download: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

def download_video(url, ydl_opts, download_id, compression_level, start_time, end_time):
    try:
        # Download the video
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            downloaded_file = ydl.prepare_filename(info)
        
        # Update session
        if 'downloads' in session and download_id in session['downloads']:
            session['downloads'][download_id]['status'] = 'downloaded'
            session['downloads'][download_id]['file_path'] = downloaded_file
            session.modified = True
        
        # Apply compression if needed
        if compression_level != 'none' and downloaded_file.endswith(('.mp4', '.webm', '.mkv')):
            compressed_file = apply_compression(downloaded_file, compression_level)
            
            # Update session with compressed file path
            if 'downloads' in session and download_id in session['downloads']:
                session['downloads'][download_id]['file_path'] = compressed_file
                session.modified = True
                
            downloaded_file = compressed_file
        
        # Apply trimming if needed
        if (start_time and end_time) and downloaded_file.endswith(('.mp4', '.webm', '.mkv')):
            trimmed_file = apply_trimming(downloaded_file, start_time, end_time)
            
            # Update session with trimmed file path
            if 'downloads' in session and download_id in session['downloads']:
                session['downloads'][download_id]['file_path'] = trimmed_file
                session.modified = True
                
            downloaded_file = trimmed_file
        
        # Add metadata tag
        add_metadata_tag(downloaded_file)
        
        # Save to download history if user is logged in
        if current_user.is_authenticated:
            save_to_history(url, info, downloaded_file)
        
        # Update session
        if 'downloads' in session and download_id in session['downloads']:
            session['downloads'][download_id]['status'] = 'completed'
            session['downloads'][download_id]['end_time'] = datetime.now().isoformat()
            session.modified = True
    
    except Exception as e:
        current_app.logger.error(f"Error in download thread: {str(e)}")
        
        # Update session with error
        if 'downloads' in session and download_id in session['downloads']:
            session['downloads'][download_id]['status'] = 'error'
            session['downloads'][download_id]['error'] = str(e)
            session.modified = True

def update_progress(d, download_id):
    if d['status'] == 'downloading':
        # Calculate progress percentage
        total_bytes = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
        if total_bytes > 0:
            progress = (d['downloaded_bytes'] / total_bytes) * 100
        else:
            progress = 0
        
        # Update session
        if 'downloads' in session and download_id in session['downloads']:
            session['downloads'][download_id]['progress'] = progress
            session.modified = True

def apply_compression(file_path, compression_level):
    try:
        # Define compression settings based on level
        crf_value = {
            'light': 20,
            'medium': 23,
            'heavy': 28
        }.get(compression_level, 23)
        
        # Create output filename
        filename, ext = os.path.splitext(file_path)
        output_file = f"{filename}_compressed{ext}"
        
        # Apply compression using moviepy
        video = VideoFileClip(file_path)
        video.write_videofile(
            output_file,
            codec='libx264',
            preset='medium',
            ffmpeg_params=['-crf', str(crf_value)]
        )
        
        # Close video to release resources
        video.close()
        
        return output_file
    
    except Exception as e:
        current_app.logger.error(f"Error applying compression: {str(e)}")
        return file_path  # Return original file if compression fails

def apply_trimming(file_path, start_time, end_time):
    try:
        # Parse start and end times (format: MM:SS)
        start_parts = start_time.split(':')
        end_parts = end_time.split(':')
        
        start_seconds = int(start_parts[0]) * 60 + int(start_parts[1])
        end_seconds = int(end_parts[0]) * 60 + int(end_parts[1])
        
        # Create output filename
        filename, ext = os.path.splitext(file_path)
        output_file = f"{filename}_trimmed{ext}"
        
        # Apply trimming using moviepy
        video = VideoFileClip(file_path)
        trimmed_video = video.subclip(start_seconds, end_seconds)
        trimmed_video.write_videofile(output_file)
        
        # Close videos to release resources
        video.close()
        trimmed_video.close()
        
        return output_file
    
    except Exception as e:
        current_app.logger.error(f"Error applying trimming: {str(e)}")
        return file_path  # Return original file if trimming fails

def add_metadata_tag(file_path):
    # This is a placeholder for adding metadata tags
    # In a real implementation, this would use a library like mutagen for audio files
    # or ffmpeg for video files to add metadata
    pass

def save_to_history(url, info, file_path):
    try:
        # Determine if it's video or audio
        is_video = file_path.endswith(('.mp4', '.webm', '.mkv', '.avi'))
        
        # Get file size
        file_size = get_file_size(file_path)
        
        # Create history entry
        history = DownloadHistory(
            user_id=current_user.id,
            title=info.get('title', 'Unknown Title'),
            url=url,
            thumbnail=info.get('thumbnail', ''),
            file_path=file_path,
            file_size=file_size,
            file_type='video' if is_video else 'audio',
            resolution=f"{info.get('height', 'unknown')}p" if is_video else 'Audio',
            download_date=datetime.now()
        )
        
        # Save to database
        db.session.add(history)
        db.session.commit()
    
    except Exception as e:
        current_app.logger.error(f"Error saving to history: {str(e)}")

@downloader_bp.route('/progress/<download_id>')
def get_progress(download_id):
    if 'downloads' not in session or download_id not in session['downloads']:
        return jsonify({'success': False, 'error': 'Download not found'})
    
    download_info = session['downloads'][download_id]
    
    return jsonify({
        'success': True,
        'status': download_info['status'],
        'progress': download_info['progress'],
        'file_path': download_info['file_path']
    })

@downloader_bp.route('/history')
@login_required
def history():
    # Get user's download history
    history_items = DownloadHistory.query.filter_by(user_id=current_user.id).order_by(DownloadHistory.download_date.desc()).all()
    
    return render_template('downloader/history.html', history_items=history_items)

@downloader_bp.route('/clear-history', methods=['POST'])
@login_required
def clear_history():
    try:
        # Delete all history items for current user
        DownloadHistory.query.filter_by(user_id=current_user.id).delete()
        db.session.commit()
        
        return jsonify({'success': True})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@downloader_bp.route('/delete-history-item/<int:item_id>', methods=['DELETE'])
@login_required
def delete_history_item(item_id):
    try:
        # Find history item
        history_item = DownloadHistory.query.filter_by(id=item_id, user_id=current_user.id).first()
        
        if not history_item:
            return jsonify({'success': False, 'error': 'Item not found'})
        
        # Delete from database
        db.session.delete(history_item)
        db.session.commit()
        
        return jsonify({'success': True})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@downloader_bp.route('/generate-qr/<download_id>')
def generate_qr(download_id):
    if 'downloads' not in session or download_id not in session['downloads']:
        return jsonify({'success': False, 'error': 'Download not found'})
    
    download_info = session['downloads'][download_id]
    file_path = download_info.get('file_path')
    
    if not file_path or not os.path.exists(file_path):
        return jsonify({'success': False, 'error': 'File not found'})
    
    try:
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        
        # Add file path data
        qr.add_data(file_path)
        qr.make(fit=True)
        
        # Create QR image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save QR code
        qr_path = os.path.join(os.path.dirname(file_path), f"{os.path.basename(file_path)}_qr.png")
        img.save(qr_path)
        
        return jsonify({
            'success': True,
            'qr_path': qr_path
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@downloader_bp.route('/batch-download', methods=['POST'])
def batch_download():
    data = request.get_json()
    batch_items = data.get('items', [])
    
    if not batch_items:
        return jsonify({'success': False, 'error': 'No items provided'})
    
    try:
        # Generate a unique batch ID
        batch_id = str(uuid.uuid4())
        
        # Store batch info in session
        session['batches'] = session.get('batches', {})
        session['batches'][batch_id] = {
            'items': batch_items,
            'status': 'queued',
            'current_item': 0,
            'completed': 0,
            'failed': 0,
            'start_time': datetime.now().isoformat()
        }
        session.modified = True
        
        # Start batch download in a background thread
        import threading
        batch_thread = threading.Thread(
            target=process_batch,
            args=(batch_id,)
        )
        batch_thread.daemon = True
        batch_thread.start()
        
        return jsonify({
            'success': True,
            'batch_id': batch_id,
            'message': 'Batch download started'
        })
    
    except Exception as e:
        current_app.logger.error(f"Error starting batch download: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

def process_batch(batch_id):
    if 'batches' not in session or batch_id not in session['batches']:
        return
    
    batch_info = session['batches'][batch_id]
    items = batch_info['items']
    
    # Update batch status
    batch_info['status'] = 'processing'
    session.modified = True
    
    for i, item in enumerate(items):
        try:
            # Update current item
            batch_info['current_item'] = i
            session.modified = True
            
            # Configure yt-dlp options
            ydl_opts = {
                'format': item['format_id'],
                'outtmpl': os.path.join(item['save_dir'], '%(title)s.%(ext)s'),
                'quiet': True,
                'no_warnings': True,
                'noplaylist': True,
            }
            
            # Download the video
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([item['url']])
            
            # Update completed count
            batch_info['completed'] += 1
            session.modified = True
        
        except Exception as e:
            current_app.logger.error(f"Error in batch download: {str(e)}")
            
            # Update failed count
            batch_info['failed'] += 1
            session.modified = True
    
    # Update batch status
    batch_info['status'] = 'completed'
    batch_info['end_time'] = datetime.now().isoformat()
    session.modified = True

@downloader_bp.route('/batch-status/<batch_id>')
def batch_status(batch_id):
    if 'batches' not in session or batch_id not in session['batches']:
        return jsonify({'success': False, 'error': 'Batch not found'})
    
    batch_info = session['batches'][batch_id]
    
    return jsonify({
        'success': True,
        'status': batch_info['status'],
        'total': len(batch_info['items']),
        'completed': batch_info['completed'],
        'failed': batch_info['failed'],
        'current_item': batch_info['current_item']
    })

@downloader_bp.route('/scheduled-download', methods=['POST'])
@login_required
def scheduled_download():
    data = request.get_json()
    url = data.get('url')
    format_id = data.get('format_id')
    schedule_time = data.get('schedule_time')  # Format: YYYY-MM-DD HH:MM
    
    if not url or not validators.url(url) or not format_id or not schedule_time:
        return jsonify({'success': False, 'error': 'Invalid parameters provided'})
    
    try:
        # Parse schedule time
        schedule_datetime = datetime.strptime(schedule_time, '%Y-%m-%d %H:%M')
        
        # Check if schedule time is in the future
        if schedule_datetime <= datetime.now():
            return jsonify({'success': False, 'error': 'Schedule time must be in the future'})
        
        # Generate a unique schedule ID
        schedule_id = str(uuid.uuid4())
        
        # Store schedule info in database or session
        # In a real implementation, this would be stored in a database
        session['schedules'] = session.get('schedules', {})
        session['schedules'][schedule_id] = {
            'url': url,
            'format_id': format_id,
            'schedule_time': schedule_time,
            'status': 'scheduled',
            'user_id': current_user.id
        }
        session.modified = True
        
        return jsonify({
            'success': True,
            'schedule_id': schedule_id,
            'message': f'Download scheduled for {schedule_time}'
        })
    
    except Exception as e:
        current_app.logger.error(f"Error scheduling download: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@downloader_bp.route('/preview-video', methods=['POST'])
def preview_video():
    data = request.get_json()
    url = data.get('url')
    
    if not url or not validators.url(url):
        return jsonify({'success': False, 'error': 'Invalid URL provided'})
    
    try:
        # Configure yt-dlp options for preview
        ydl_opts = {
            'format': 'best[height<=480]',  # Lower quality for preview
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
            'noplaylist': True,
        }
        
        # Extract video information
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Get preview URL (direct video URL)
            preview_url = None
            for format in info.get('formats', []):
                if format.get('vcodec') != 'none' and format.get('height', 0) <= 480:
                    preview_url = format.get('url')
                    break
            
            if not preview_url:
                return jsonify({'success': False, 'error': 'No suitable preview format found'})
            
            return jsonify({
                'success': True,
                'preview_url': preview_url
            })
    
    except Exception as e:
        current_app.logger.error(f"Error generating preview: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@downloader_bp.route('/estimate', methods=['POST'])
def estimate_download():
    data = request.get_json()
    url = data.get('url')
    format_id = data.get('format_id')
    
    if not url or not validators.url(url) or not format_id:
        return jsonify({'success': False, 'error': 'Invalid parameters provided'})
    
    try:
        # Configure yt-dlp options
        ydl_opts = {
            'format': format_id,
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
            'noplaylist': True,
        }
        
        # Extract video information
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Get format info
            format_info = None
            for format in info.get('formats', []):
                if format.get('format_id') == format_id:
                    format_info = format
                    break
            
            if not format_info:
                return jsonify({'success': False, 'error': 'Format not found'})
            
            # Calculate file size in MB
            filesize = format_info.get('filesize')
            if filesize:
                filesize_mb = filesize / (1024 * 1024)
            else:
                filesize_mb = None
            
            # Estimate download time based on average download speed
            # This is a very rough estimate and would be more accurate in a real implementation
            avg_speed_mbps = 5  # Assume 5 Mbps download speed
            
            if filesize_mb:
                # Convert MB to Mb (megabytes to megabits)
                filesize_mb_to_mb = filesize_mb * 8
                
                # Calculate time in seconds
                time_seconds = filesize_mb_to_mb / avg_speed_mbps
                
                # Format time
                if time_seconds < 60:
                    time_str = f"{int(time_seconds)} seconds"
                elif time_seconds < 3600:
                    time_str = f"{int(time_seconds / 60)} minutes {int(time_seconds % 60)} seconds"
                else:
                    time_str = f"{int(time_seconds / 3600)} hours {int((time_seconds % 3600) / 60)} minutes"
            else:
                time_str = "Unknown"
            
            return jsonify({
                'success': True,
                'filesize': f"{filesize_mb:.1f} MB" if filesize_mb else "Unknown",
                'estimated_time': time_str
            })
    
    except Exception as e:
        current_app.logger.error(f"Error estimating download: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@downloader_bp.route('/offline-queue', methods=['POST'])
@login_required
def offline_queue():
    data = request.get_json()
    url = data.get('url')
    format_id = data.get('format_id')
    
    if not url or not validators.url(url) or not format_id:
        return jsonify({'success': False, 'error': 'Invalid parameters provided'})
    
    try:
        # Generate a unique queue ID
        queue_id = str(uuid.uuid4())
        
        # Store queue info in session
        session['offline_queue'] = session.get('offline_queue', [])
        session['offline_queue'].append({
            'id': queue_id,
            'url': url,
            'format_id': format_id,
            'added_time': datetime.now().isoformat(),
            'status': 'queued',
            'user_id': current_user.id
        })
        session.modified = True
        
        return jsonify({
            'success': True,
            'queue_id': queue_id,
            'message': 'Added to offline queue'
        })
    
    except Exception as e:
        current_app.logger.error(f"Error adding to offline queue: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@downloader_bp.route('/offline-queue', methods=['GET'])
@login_required
def get_offline_queue():
    if 'offline_queue' not in session:
        return jsonify({'success': True, 'queue': []})
    
    # Filter queue for current user
    user_queue = [item for item in session['offline_queue'] if item.get('user_id') == current_user.id]
    
    return jsonify({
        'success': True,
        'queue': user_queue
    })

@downloader_bp.route('/process-offline-queue', methods=['POST'])
@login_required
def process_offline_queue():
    if 'offline_queue' not in session or not session['offline_queue']:
        return jsonify({'success': False, 'error': 'Offline queue is empty'})
    
    try:
        # Filter queue for current user
        user_queue = [item for item in session['offline_queue'] if item.get('user_id') == current_user.id]
        
        if not user_queue:
            return jsonify({'success': False, 'error': 'Your offline queue is empty'})
        
        # Start processing in a background thread
        import threading
        queue_thread = threading.Thread(
            target=process_queue,
            args=(user_queue,)
        )
        queue_thread.daemon = True
        queue_thread.start()
        
        return jsonify({
            'success': True,
            'message': f'Processing {len(user_queue)} items from offline queue'
        })
    
    except Exception as e:
        current_app.logger.error(f"Error processing offline queue: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

def process_queue(queue_items):
    for item in queue_items:
        try:
            # Update status
            item['status'] = 'processing'
            session.modified = True
            
            # Determine save directory
            save_dir = os.path.join(os.path.expanduser('~'), 'Downloads', 'TasVID')
            create_directory(save_dir)
            
            # Configure yt-dlp options
            ydl_opts = {
                'format': item['format_id'],
                'outtmpl': os.path.join(save_dir, '%(title)s.%(ext)s'),
                'quiet': True,
                'no_warnings': True,
                'noplaylist': True,
            }
            
            # Download the video
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([item['url']])
            
            # Update status
            item['status'] = 'completed'
            item['completed_time'] = datetime.now().isoformat()
            session.modified = True
        
        except Exception as e:
            current_app.logger.error(f"Error in queue processing: {str(e)}")
            
            # Update status
            item['status'] = 'error'
            item['error'] = str(e)
            session.modified = True
    
    # Remove completed items from queue
    session['offline_queue'] = [item for item in session['offline_queue'] if item['status'] not in ['completed', 'error']]
    session.modified = True
