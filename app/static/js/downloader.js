// Downloader JavaScript for TasVID

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const analyzeForm = document.getElementById('analyze-form');
    const youtubeUrlInput = document.getElementById('youtube-url');
    const loadingElement = document.getElementById('loading');
    const videoInfoElement = document.getElementById('video-info');
    const videoThumbnail = document.getElementById('video-thumbnail');
    const videoTitle = document.getElementById('video-title');
    const videoDuration = document.getElementById('video-duration');
    const videoFormatsElement = document.getElementById('video-formats');
    const audioFormatsElement = document.getElementById('audio-formats');
    const downloadProgressElement = document.getElementById('download-progress');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const downloadFilename = document.getElementById('download-filename');
    const downloadCompleteElement = document.getElementById('download-complete');
    const downloadPath = document.getElementById('download-path');
    const newDownloadButton = document.getElementById('new-download');
    const cancelDownloadButton = document.getElementById('cancel-download');
    
    // Variables
    let selectedFormat = null;
    let videoData = null;
    let downloadInterval = null;
    
    // Format duration
    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    // Analyze form submission
    if (analyzeForm) {
        analyzeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const url = youtubeUrlInput.value.trim();
            if (!url) return;
            
            // Show loading
            loadingElement.style.display = 'block';
            videoInfoElement.style.display = 'none';
            downloadProgressElement.style.display = 'none';
            downloadCompleteElement.style.display = 'none';
            
            // Send request to analyze endpoint
            fetch('/downloader/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `url=${encodeURIComponent(url)}`
            })
            .then(response => response.json())
            .then(data => {
                // Hide loading
                loadingElement.style.display = 'none';
                
                if (data.error) {
                    alert(data.error);
                    return;
                }
                
                // Store video data
                videoData = data;
                
                // Update video info
                videoThumbnail.src = data.thumbnail;
                videoTitle.textContent = data.title;
                videoDuration.textContent = data.duration ? formatDuration(data.duration) : '';
                
                // Populate video formats
                videoFormatsElement.innerHTML = '';
                data.video_formats.forEach(format => {
                    const formatItem = document.createElement('div');
                    formatItem.className = 'format-item';
                    formatItem.dataset.formatId = format.format_id;
                    formatItem.dataset.formatType = 'video';
                    
                    const formatInfo = document.createElement('div');
                    formatInfo.className = 'format-info';
                    
                    const formatResolution = document.createElement('div');
                    formatResolution.className = 'format-resolution';
                    formatResolution.textContent = format.resolution;
                    
                    const formatSize = document.createElement('div');
                    formatSize.className = 'format-size';
                    formatSize.textContent = format.filesize ? `${format.filesize} MB` : 'Unknown size';
                    
                    formatInfo.appendChild(formatResolution);
                    formatInfo.appendChild(formatSize);
                    
                    const downloadButton = document.createElement('button');
                    downloadButton.className = 'btn btn-primary btn-sm';
                    downloadButton.innerHTML = '<i class="fas fa-download"></i> Download';
                    
                    formatItem.appendChild(formatInfo);
                    formatItem.appendChild(downloadButton);
                    
                    videoFormatsElement.appendChild(formatItem);
                    
                    // Add click event
                    formatItem.addEventListener('click', function() {
                        selectFormat(this);
                    });
                    
                    downloadButton.addEventListener('click', function(e) {
                        e.stopPropagation();
                        selectFormat(formatItem);
                        startDownload();
                    });
                });
                
                // Populate audio formats
                audioFormatsElement.innerHTML = '';
                data.audio_formats.forEach(format => {
                    const formatItem = document.createElement('div');
                    formatItem.className = 'format-item';
                    formatItem.dataset.formatId = format.format_id;
                    formatItem.dataset.formatType = 'audio';
                    
                    const formatInfo = document.createElement('div');
                    formatInfo.className = 'format-info';
                    
                    const formatResolution = document.createElement('div');
                    formatResolution.className = 'format-resolution';
                    formatResolution.textContent = `Audio (${format.ext})`;
                    
                    const formatSize = document.createElement('div');
                    formatSize.className = 'format-size';
                    formatSize.textContent = format.filesize ? `${format.filesize} MB` : 'Unknown size';
                    
                    formatInfo.appendChild(formatResolution);
                    formatInfo.appendChild(formatSize);
                    
                    const downloadButton = document.createElement('button');
                    downloadButton.className = 'btn btn-secondary btn-sm';
                    downloadButton.innerHTML = '<i class="fas fa-music"></i> Download';
                    
                    formatItem.appendChild(formatInfo);
                    formatItem.appendChild(downloadButton);
                    
                    audioFormatsElement.appendChild(formatItem);
                    
                    // Add click event
                    formatItem.addEventListener('click', function() {
                        selectFormat(this);
                    });
                    
                    downloadButton.addEventListener('click', function(e) {
                        e.stopPropagation();
                        selectFormat(formatItem);
                        startDownload();
                    });
                });
                
                // Show video info
                videoInfoElement.style.display = 'block';
            })
            .catch(error => {
                loadingElement.style.display = 'none';
                alert('Error analyzing video: ' + error.message);
            });
        });
    }
    
    // Select format
    function selectFormat(formatElement) {
        // Remove selected class from all format items
        document.querySelectorAll('.format-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add selected class to clicked format item
        formatElement.classList.add('selected');
        
        // Store selected format
        selectedFormat = {
            formatId: formatElement.dataset.formatId,
            formatType: formatElement.dataset.formatType
        };
    }
    
    // Start download
    function startDownload() {
        if (!selectedFormat || !videoData) return;
        
        // Show download progress
        videoInfoElement.style.display = 'none';
        downloadProgressElement.style.display = 'block';
        downloadFilename.textContent = videoData.title;
        
        // Reset progress
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        
        // Prepare form data
        const formData = new FormData();
        formData.append('url', youtubeUrlInput.value.trim());
        formData.append('format_id', selectedFormat.formatId);
        formData.append('format_type', selectedFormat.formatType);
        formData.append('title', videoData.title);
        formData.append('video_id', videoData.video_id);
        formData.append('thumbnail', videoData.thumbnail);
        formData.append('compress', 'true'); // Enable compression
        
        // Send download request
        fetch('/downloader/download', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            clearInterval(downloadInterval);
            
            if (data.error) {
                alert(data.error);
                downloadProgressElement.style.display = 'none';
                videoInfoElement.style.display = 'block';
                return;
            }
            
            // Show download complete
            downloadProgressElement.style.display = 'none';
            downloadCompleteElement.style.display = 'block';
            downloadPath.textContent = data.file_path;
            
            // Complete progress bar
            progressBar.style.width = '100%';
            progressText.textContent = '100%';
        })
        .catch(error => {
            clearInterval(downloadInterval);
            alert('Error downloading: ' + error.message);
            downloadProgressElement.style.display = 'none';
            videoInfoElement.style.display = 'block';
        });
        
        // Simulate progress (since we can't get real-time progress easily)
        let progress = 0;
        downloadInterval = setInterval(() => {
            if (progress >= 95) {
                clearInterval(downloadInterval);
                return;
            }
            
            progress += Math.random() * 5;
            if (progress > 95) progress = 95;
            
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}%`;
        }, 500);
    }
    
    // New download button
    if (newDownloadButton) {
        newDownloadButton.addEventListener('click', function() {
            downloadCompleteElement.style.display = 'none';
            youtubeUrlInput.value = '';
            videoInfoElement.style.display = 'none';
            selectedFormat = null;
            videoData = null;
        });
    }
    
    // Cancel download button
    if (cancelDownloadButton) {
        cancelDownloadButton.addEventListener('click', function() {
            clearInterval(downloadInterval);
            downloadProgressElement.style.display = 'none';
            videoInfoElement.style.display = 'block';
        });
    }
});
