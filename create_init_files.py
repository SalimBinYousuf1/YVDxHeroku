from app.utils import device_detection
from app.utils import file_utils
import os

def create_init_files():
    """Create __init__.py files in all directories to ensure proper imports"""
    directories = [
        "app/utils",
        "app/models",
        "app/routes",
        "app/templates/includes",
        "app/templates/auth",
        "app/templates/downloader"
    ]
    
    for directory in directories:
        init_file = os.path.join("/home/ubuntu/TasVID", directory, "__init__.py")
        if not os.path.exists(init_file):
            with open(init_file, 'w') as f:
                f.write("# Initialize package\n")
            print(f"Created {init_file}")

if __name__ == "__main__":
    create_init_files()
