# TasVID - YouTube Video/Audio Downloader

TasVID is a modern, responsive web application for downloading YouTube videos and audio with a clean, beautiful UI and powerful backend.

## Features

- Full mobile, tablet, and desktop responsiveness
- Clean, modern UI with cream background and black text
- Multiple theme options (Cream, Dark, Neon, Dot)
- YouTube video analysis and metadata extraction
- Download videos in multiple formats and resolutions
- Audio extraction with MP3 conversion
- Video compression with ffmpeg
- Download history tracking
- User authentication with email OTP verification
- Smart device detection for appropriate file saving
- QR code sharing for downloaded files
- Persistent user settings

## Technology Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript
- **Database**: SQLite
- **Video Processing**: yt-dlp, ffmpeg
- **Authentication**: Flask-Login, Flask-Mail
- **Styling**: Custom CSS with responsive design

## Installation

1. Clone the repository:
```
git clone https://github.com/SalimBinYousuf1/YVDxHeroku.git
cd YVDxHeroku
```

2. Create and activate a virtual environment:
```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file with the following:
```
SECRET_KEY=your_secret_key
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_email_app_password
MAIL_DEFAULT_SENDER=your_email@gmail.com
```

5. Run the application:
```
python run.py
```

## Usage

1. Open your browser and navigate to `http://localhost:5000`
2. Enter a YouTube URL in the input field
3. Click "Analyze" to fetch video information
4. Select your preferred format and quality
5. Click "Download" to save the video/audio

## License

This project is open source and available under the MIT License.

## Acknowledgements

- yt-dlp for YouTube video extraction
- ffmpeg for video processing
- Flask and its extensions for the web framework
