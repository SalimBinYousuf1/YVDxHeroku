import os
import re
import qrcode
from PIL import Image

def clean_filename(filename):
    """
    Clean filename to make it safe for file systems
    
    Args:
        filename: Original filename
    
    Returns:
        Cleaned filename
    """
    # Replace invalid characters with underscore
    cleaned = re.sub(r'[\\/*?:"<>|]', '_', filename)
    # Remove extra spaces
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    # Limit length
    if len(cleaned) > 100:
        cleaned = cleaned[:97] + '...'
    return cleaned

def get_file_size(file_path):
    """
    Get file size in MB
    
    Args:
        file_path: Path to file
    
    Returns:
        File size in MB
    """
    if os.path.exists(file_path):
        size_bytes = os.path.getsize(file_path)
        size_mb = size_bytes / (1024 * 1024)
        return round(size_mb, 2)
    return 0

def create_qr_code(data, size=10):
    """
    Create QR code for sharing
    
    Args:
        data: Data to encode in QR code
        size: QR code size
    
    Returns:
        Path to generated QR code image
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=size,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Create directory if it doesn't exist
    qr_dir = os.path.join(os.path.expanduser('~'), 'TasVID', 'qrcodes')
    os.makedirs(qr_dir, exist_ok=True)
    
    # Save QR code
    qr_path = os.path.join(qr_dir, f"qr_{os.path.basename(data)}_{os.urandom(4).hex()}.png")
    img.save(qr_path)
    
    return qr_path

def add_metadata_tag(file_path, tag="Downloaded by TasVID"):
    """
    Add metadata tag to media file
    
    Args:
        file_path: Path to media file
        tag: Metadata tag to add
    
    Returns:
        Success status
    """
    # This would typically use ffmpeg directly
    # For now, we'll just return True as a placeholder
    return True
