import platform
import os
from flask import request

def detect_device(user_agent_string):
    """
    Detect device type based on user agent string
    Returns: 'phone', 'tablet', or 'desktop'
    """
    user_agent = user_agent_string.lower()
    
    # Check for mobile devices
    if 'mobile' in user_agent or 'android' in user_agent or 'iphone' in user_agent:
        # Differentiate between phones and tablets
        if 'ipad' in user_agent or 'tablet' in user_agent:
            return 'tablet'
        else:
            return 'phone'
    
    # Default to desktop
    return 'desktop'

def get_save_path(device_type, format_type):
    """
    Get appropriate save path based on device type and format type
    
    Args:
        device_type: 'phone', 'tablet', or 'desktop'
        format_type: 'video' or 'audio'
    
    Returns:
        Path string for saving files
    """
    # Base paths for different device types
    if device_type in ['phone', 'tablet']:
        # For mobile devices
        if platform.system() == 'Windows':
            base_path = os.path.join(os.path.expanduser('~'), 'Downloads', 'TasVID')
        elif platform.system() == 'Darwin':  # macOS
            base_path = os.path.join(os.path.expanduser('~'), 'Downloads', 'TasVID')
        else:  # Linux and others
            base_path = os.path.join(os.path.expanduser('~'), 'Downloads', 'TasVID')
    else:
        # For desktop
        if platform.system() == 'Windows':
            base_path = os.path.join(os.path.expanduser('~'), 'Desktop', 'TasVID')
        elif platform.system() == 'Darwin':  # macOS
            base_path = os.path.join(os.path.expanduser('~'), 'Desktop', 'TasVID')
        else:  # Linux and others
            base_path = os.path.join(os.path.expanduser('~'), 'Desktop', 'TasVID')
    
    # Add subdirectory based on format type
    if format_type == 'video':
        return os.path.join(base_path, 'videos')
    else:  # audio
        return os.path.join(base_path, 'audio')
