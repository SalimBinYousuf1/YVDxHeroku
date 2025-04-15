from app.utils import device_detection
from app.utils import file_utils

def test_imports():
    """Test that all imports are working correctly"""
    print("Testing imports...")
    print("Device detection module:", device_detection)
    print("File utils module:", file_utils)
    print("All imports working correctly!")

if __name__ == "__main__":
    test_imports()
