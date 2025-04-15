// Enhanced TasVID - Main JavaScript

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Theme Switcher
    initThemeSwitcher();
    
    // URL Input and Analysis
    initUrlAnalysis();
    
    // Format Selection
    initFormatSelection();
    
    // Download Progress
    initDownloadProgress();
    
    // Video Trimmer
    initVideoTrimmer();
    
    // Batch Download
    initBatchDownload();
    
    // QR Code Generation
    initQrCodeGenerator();
    
    // Mobile Menu
    initMobileMenu();
    
    // Copy to Clipboard
    initClipboardCopy();
    
    // Animations
    initAnimations();
});

// Theme Switcher
function initThemeSwitcher() {
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    const body = document.body;
    
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('tasvid-theme') || 'cream-theme';
    body.className = savedTheme;
    
    // Set the correct radio button
    if (themeRadios.length) {
        const themeRadio = document.querySelector(`input[value="${savedTheme}"]`);
        if (themeRadio) themeRadio.checked = true;
    }
    
    // Add event listeners to theme radios
    themeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            body.className = this.value;
            localStorage.setItem('tasvid-theme', this.value);
            
            // Trigger animation effect
            body.classList.add('theme-transition');
            setTimeout(() => {
                body.classList.remove('theme-transition');
            }, 500);
        });
    });
}

// URL Input and Analysis
function initUrlAnalysis() {
    const urlForm = document.getElementById('url-form');
    const urlInput = document.getElementById('url-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const loadingContainer = document.getElementById('loading-container');
    const videoInfoContainer = document.getElementById('video-info-container');
    
    if (!urlForm) return;
    
    urlForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const url = urlInput.value.trim();
        if (!url) {
            showToast('Please enter a valid YouTube URL', 'error');
            return;
        }
        
        // Show loading animation
        loadingContainer.classList.remove('d-none');
        videoInfoContainer.classList.add('d-none');
        
        // Analyze URL
        analyzeYoutubeUrl(url)
            .then(data => {
                // Hide loading, show video info
                loadingContainer.classList.add('d-none');
                videoInfoContainer.classList.remove('d-none');
                
                // Populate video info
                populateVideoInfo(data);
                
                // Add animation
                videoInfoContainer.classList.add('slide-in-right');
                setTimeout(() => {
                    videoInfoContainer.classList.remove('slide-in-right');
                }, 500);
            })
            .catch(error => {
                loadingContainer.classList.add('d-none');
                showToast('Error analyzing URL: ' + error.message, 'error');
            });
    });
    
    // URL validation on input
    urlInput.addEventListener('input', function() {
        const url = this.value.trim();
        const isValid = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.*/.test(url);
        
        if (isValid) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
            analyzeBtn.disabled = false;
        } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
            analyzeBtn.disabled = true;
        }
    });
}

// Analyze YouTube URL
async function analyzeYoutubeUrl(url) {
    // This would be an AJAX call to the backend
    // For now, we'll simulate a response
    return new Promise((resolve, reject) => {
        // Simulate network delay
        setTimeout(() => {
            try {
                // Simulate API response
                const response = {
                    title: 'Sample YouTube Video Title - This is a demonstration of the TasVID downloader',
                    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
                    duration: '3:45',
                    author: 'Sample Channel',
                    views: '1.2M',
                    published: '2023-05-15',
                    formats: {
                        video: [
                            { id: 'v1', resolution: '4K (2160p)', size: '850 MB', format: 'mp4' },
                            { id: 'v2', resolution: '1080p', size: '450 MB', format: 'mp4' },
                            { id: 'v3', resolution: '720p', size: '250 MB', format: 'mp4' },
                            { id: 'v4', resolution: '480p', size: '150 MB', format: 'mp4' },
                            { id: 'v5', resolution: '360p', size: '100 MB', format: 'mp4' },
                            { id: 'v6', resolution: '240p', size: '75 MB', format: 'mp4' },
                            { id: 'v7', resolution: '144p', size: '50 MB', format: 'mp4' }
                        ],
                        audio: [
                            { id: 'a1', resolution: 'High (320 kbps)', size: '45 MB', format: 'mp3' },
                            { id: 'a2', resolution: 'Medium (192 kbps)', size: '30 MB', format: 'mp3' },
                            { id: 'a3', resolution: 'Low (128 kbps)', size: '20 MB', format: 'mp3' }
                        ]
                    }
                };
                
                resolve(response);
            } catch (error) {
                reject(error);
            }
        }, 1500);
    });
}

// Populate Video Info
function populateVideoInfo(data) {
    const videoInfoContainer = document.getElementById('video-info-container');
    if (!videoInfoContainer) return;
    
    // Create video details HTML
    const videoDetailsHtml = `
        <div class="video-details">
            <img src="${data.thumbnail}" alt="${data.title}" class="video-thumbnail">
            <div class="video-metadata">
                <h2>${data.title}</h2>
                <div class="video-stats">
                    <div class="video-stat"><i class="fas fa-user"></i> ${data.author}</div>
                    <div class="video-stat"><i class="fas fa-clock"></i> ${data.duration}</div>
                    <div class="video-stat"><i class="fas fa-eye"></i> ${data.views} views</div>
                    <div class="video-stat"><i class="fas fa-calendar"></i> ${data.published}</div>
                </div>
            </div>
        </div>
    `;
    
    // Create formats HTML
    let formatsHtml = '<div class="formats-container">';
    
    // Video formats
    formatsHtml += `
        <div class="format-section">
            <h3><i class="fas fa-video"></i> Video Formats</h3>
            <div class="format-list">
    `;
    
    data.formats.video.forEach(format => {
        formatsHtml += `
            <div class="format-item" data-format-id="${format.id}">
                <div class="format-info">
                    <div class="format-resolution">${format.resolution}</div>
                    <div class="format-size"><i class="fas fa-file"></i> ${format.size} (${format.format})</div>
                </div>
                <button class="btn btn-primary btn-sm download-btn" data-format-id="${format.id}">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        `;
    });
    
    formatsHtml += `
            </div>
        </div>
    `;
    
    // Audio formats
    formatsHtml += `
        <div class="format-section">
            <h3><i class="fas fa-music"></i> Audio Formats</h3>
            <div class="format-list">
    `;
    
    data.formats.audio.forEach(format => {
        formatsHtml += `
            <div class="format-item" data-format-id="${format.id}">
                <div class="format-info">
                    <div class="format-resolution">${format.resolution}</div>
                    <div class="format-size"><i class="fas fa-file"></i> ${format.size} (${format.format})</div>
                </div>
                <button class="btn btn-primary btn-sm download-btn" data-format-id="${format.id}">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        `;
    });
    
    formatsHtml += `
            </div>
        </div>
    `;
    
    // Advanced options
    formatsHtml += `
        <div class="format-section">
            <h3><i class="fas fa-cogs"></i> Advanced Options</h3>
            <div class="form-group">
                <div class="input-group">
                    <select class="form-control" id="compression-level">
                        <option value="none">No Compression</option>
                        <option value="light">Light Compression</option>
                        <option value="medium" selected>Medium Compression</option>
                        <option value="heavy">Heavy Compression</option>
                    </select>
                    <button class="btn btn-secondary" id="trim-video-btn">
                        <i class="fas fa-cut"></i> Trim Video
                    </button>
                    <button class="btn btn-secondary" id="add-to-batch-btn">
                        <i class="fas fa-list"></i> Add to Batch
                    </button>
                </div>
            </div>
        </div>
    `;
    
    formatsHtml += '</div>';
    
    // Combine all HTML
    videoInfoContainer.innerHTML = videoDetailsHtml + formatsHtml;
    
    // Add event listeners to download buttons
    const downloadButtons = videoInfoContainer.querySelectorAll('.download-btn');
    downloadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const formatId = this.getAttribute('data-format-id');
            startDownload(formatId);
        });
    });
    
    // Add event listener to format items for selection
    const formatItems = videoInfoContainer.querySelectorAll('.format-item');
    formatItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Don't trigger if the download button was clicked
            if (e.target.classList.contains('download-btn') || e.target.closest('.download-btn')) {
                return;
            }
            
            // Toggle selection
            formatItems.forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Add event listener to trim button
    const trimButton = document.getElementById('trim-video-btn');
    if (trimButton) {
        trimButton.addEventListener('click', function() {
            showVideoTrimmer();
        });
    }
    
    // Add event listener to batch button
    const batchButton = document.getElementById('add-to-batch-btn');
    if (batchButton) {
        batchButton.addEventListener('click', function() {
            addToBatchDownload();
        });
    }
}

// Format Selection
function initFormatSelection() {
    // This is handled in the populateVideoInfo function
}

// Start Download
function startDownload(formatId) {
    // Get selected compression level
    const compressionLevel = document.getElementById('compression-level').value;
    
    // Create progress container if it doesn't exist
    let progressContainer = document.getElementById('progress-container');
    if (!progressContainer) {
        progressContainer = document.createElement('div');
        progressContainer.id = 'progress-container';
        progressContainer.className = 'progress-container';
        progressContainer.innerHTML = `
            <h3>Downloading...</h3>
            <div class="progress-details">
                <div class="progress-filename">sample_video.mp4</div>
                <div class="progress-percentage">0%</div>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: 0%"></div>
            </div>
            <div class="progress-details">
                <div class="progress-size">0 MB / 0 MB</div>
                <div class="progress-time">Estimating time remaining...</div>
            </div>
            <button class="btn btn-danger btn-sm" id="cancel-download-btn">
                <i class="fas fa-times"></i> Cancel Download
            </button>
        `;
        
        // Add to page
        const videoInfoContainer = document.getElementById('video-info-container');
        videoInfoContainer.parentNode.insertBefore(progressContainer, videoInfoContainer.nextSibling);
        
        // Add animation
        progressContainer.classList.add('slide-up');
        
        // Add event listener to cancel button
        const cancelButton = document.getElementById('cancel-download-btn');
        cancelButton.addEventListener('click', function() {
            cancelDownload();
        });
    }
    
    // Simulate download progress
    simulateDownloadProgress();
}

// Simulate Download Progress
function simulateDownloadProgress() {
    const progressBar = document.querySelector('.progress-bar');
    const progressPercentage = document.querySelector('.progress-percentage');
    const progressSize = document.querySelector('.progress-size');
    const progressTime = document.querySelector('.progress-time');
    
    let progress = 0;
    const totalSize = 450; // MB
    const interval = setInterval(() => {
        progress += 1;
        const currentSize = (progress / 100 * totalSize).toFixed(1);
        
        progressBar.style.width = `${progress}%`;
        progressPercentage.textContent = `${progress}%`;
        progressSize.textContent = `${currentSize} MB / ${totalSize} MB`;
        
        // Update time remaining
        const remaining = 100 - progress;
        const timeRemaining = Math.ceil(remaining * 0.5); // 0.5 seconds per 1%
        progressTime.textContent = `${timeRemaining} seconds remaining`;
        
        if (progress >= 100) {
            clearInterval(interval);
            downloadComplete();
        }
    }, 50); // Update every 50ms for smooth animation
    
    // Store interval ID for cancellation
    window.downloadInterval = interval;
}

// Cancel Download
function cancelDownload() {
    if (window.downloadInterval) {
        clearInterval(window.downloadInterval);
        
        // Remove progress container with animation
        const progressContainer = document.getElementById('progress-container');
        progressContainer.classList.add('slide-down');
        
        setTimeout(() => {
            progressContainer.remove();
        }, 500);
        
        showToast('Download cancelled', 'warning');
    }
}

// Download Complete
function downloadComplete() {
    const progressContainer = document.getElementById('progress-container');
    
    // Replace with completion message
    progressContainer.innerHTML = `
        <div class="complete-container">
            <i class="fas fa-check-circle success-icon"></i>
            <h3>Download Complete!</h3>
            <p>Your file has been successfully downloaded.</p>
            
            <div class="download-path">
                /home/user/Downloads/TasVID/sample_video.mp4
                <button class="copy-path" data-tooltip="Copy path">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
            
            <div class="action-buttons">
                <button class="btn btn-primary">
                    <i class="fas fa-folder-open"></i> Open Folder
                </button>
                <button class="btn btn-secondary">
                    <i class="fas fa-play"></i> Play Video
                </button>
                <button class="btn btn-outline">
                    <i class="fas fa-qrcode"></i> Generate QR Code
                </button>
            </div>
        </div>
    `;
    
    // Add animation
    const completeContainer = progressContainer.querySelector('.complete-container');
    completeContainer.classList.add('bounce');
    
    // Add event listener to copy button
    const copyButton = progressContainer.querySelector('.copy-path');
    copyButton.addEventListener('click', function() {
        const path = this.parentNode.textContent.trim();
        navigator.clipboard.writeText(path)
            .then(() => {
                showToast('Path copied to clipboard', 'success');
            })
            .catch(err => {
                showToast('Failed to copy path', 'error');
            });
    });
}

// Download Progress
function initDownloadProgress() {
    // This is handled in the startDownload function
}

// Video Trimmer
function initVideoTrimmer() {
    // This will be initialized when the trim button is clicked
}

// Show Video Trimmer
function showVideoTrimmer() {
    // Create trimmer container
    const trimmerContainer = document.createElement('div');
    trimmerContainer.className = 'trimmer-container';
    trimmerContainer.innerHTML = `
        <div class="trimmer-header">
            <h3><i class="fas fa-cut"></i> Video Trimmer</h3>
            <button class="btn btn-sm btn-danger" id="close-trimmer-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="trimmer-preview">
            <video id="trim-video-preview" controls>
                <source src="sample-video.mp4" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        </div>
        
        <div class="trimmer-controls">
            <div class="timeline-container">
                <div class="timeline-progress"></div>
                <div class="timeline-handle start"></div>
                <div class="timeline-handle end"></div>
            </div>
            
            <div class="time-display">
                <span class="start-time">00:00</span>
                <span class="end-time">03:45</span>
            </div>
            
            <div class="form-group">
                <label>Start Time:</label>
                <input type="text" class="form-control" id="start-time-input" value="00:00">
            </div>
            
            <div class="form-group">
                <label>End Time:</label>
                <input type="text" class="form-control" id="end-time-input" value="03:45">
            </div>
            
            <div class="trimmer-actions">
                <button class="btn btn-secondary" id="preview-trim-btn">
                    <i class="fas fa-play"></i> Preview
                </button>
                <button class="btn btn-primary" id="apply-trim-btn">
                    <i class="fas fa-check"></i> Apply Trim
                </button>
            </div>
        </div>
    `;
    
    // Add to page
    const videoInfoContainer = document.getElementById('video-info-container');
    videoInfoContainer.parentNode.insertBefore(trimmerContainer, videoInfoContainer.nextSibling);
    
    // Add animation
    trimmerContainer.classList.add('slide-in-right');
    
    // Add event listeners
    const closeButton = document.getElementById('close-trimmer-btn');
    closeButton.addEventListener('click', function() {
        closeTrimmer();
    });
    
    // Initialize timeline handles
    initTimelineHandles();
}

// Initialize Timeline Handles
function initTimelineHandles() {
    const timelineContainer = document.querySelector('.timeline-container');
    const startHandle = document.querySelector('.timeline-handle.start');
    const endHandle = document.querySelector('.timeline-handle.end');
    const timelineProgress = document.querySelector('.timeline-progress');
    const startTimeDisplay = document.querySelector('.start-time');
    const endTimeDisplay = document.querySelector('.end-time');
    const startTimeInput = document.getElementById('start-time-input');
    const endTimeInput = document.getElementById('end-time-input');
    
    // Set initial positions
    endHandle.style.left = '100%';
    timelineProgress.style.left = '0%';
    timelineProgress.style.width = '100%';
    
    // Make handles draggable
    let isDragging = false;
    let currentHandle = null;
    
    // Mouse down event
    [startHandle, endHandle].forEach(handle => {
        handle.addEventListener('mousedown', function(e) {
            isDragging = true;
            currentHandle = this;
            e.preventDefault();
        });
    });
    
    // Mouse move event
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const rect = timelineContainer.getBoundingClientRect();
        let position = (e.clientX - rect.left) / rect.width * 100;
        
        // Constrain position
        position = Math.max(0, Math.min(100, position));
        
        if (currentHandle === startHandle) {
            // Ensure start handle doesn't go past end handle
            const endPosition = parseFloat(endHandle.style.left);
            position = Math.min(position, endPosition - 5);
            
            startHandle.style.left = `${position}%`;
            timelineProgress.style.left = `${position}%`;
            timelineProgress.style.width = `${endPosition - position}%`;
            
            // Update time display
            const totalDuration = 225; // 3:45 in seconds
            const startTime = Math.floor(position / 100 * totalDuration);
            const startMinutes = Math.floor(startTime / 60);
            const startSeconds = startTime % 60;
            const startTimeFormatted = `${startMinutes.toString().padStart(2, '0')}:${startSeconds.toString().padStart(2, '0')}`;
            
            startTimeDisplay.textContent = startTimeFormatted;
            startTimeInput.value = startTimeFormatted;
        } else if (currentHandle === endHandle) {
            // Ensure end handle doesn't go before start handle
            const startPosition = parseFloat(startHandle.style.left) || 0;
            position = Math.max(position, startPosition + 5);
            
            endHandle.style.left = `${position}%`;
            timelineProgress.style.width = `${position - (parseFloat(timelineProgress.style.left) || 0)}%`;
            
            // Update time display
            const totalDuration = 225; // 3:45 in seconds
            const endTime = Math.floor(position / 100 * totalDuration);
            const endMinutes = Math.floor(endTime / 60);
            const endSeconds = endTime % 60;
            const endTimeFormatted = `${endMinutes.toString().padStart(2, '0')}:${endSeconds.toString().padStart(2, '0')}`;
            
            endTimeDisplay.textContent = endTimeFormatted;
            endTimeInput.value = endTimeFormatted;
        }
    });
    
    // Mouse up event
    document.addEventListener('mouseup', function() {
        isDragging = false;
        currentHandle = null;
    });
    
    // Time input events
    startTimeInput.addEventListener('change', function() {
        const timePattern = /^(\d{1,2}):(\d{2})$/;
        const match = this.value.match(timePattern);
        
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const totalSeconds = minutes * 60 + seconds;
            const totalDuration = 225; // 3:45 in seconds
            
            let position = totalSeconds / totalDuration * 100;
            position = Math.min(position, parseFloat(endHandle.style.left) - 5);
            
            startHandle.style.left = `${position}%`;
            timelineProgress.style.left = `${position}%`;
            timelineProgress.style.width = `${parseFloat(endHandle.style.left) - position}%`;
            
            startTimeDisplay.textContent = this.value;
        }
    });
    
    endTimeInput.addEventListener('change', function() {
        const timePattern = /^(\d{1,2}):(\d{2})$/;
        const match = this.value.match(timePattern);
        
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const totalSeconds = minutes * 60 + seconds;
            const totalDuration = 225; // 3:45 in seconds
            
            let position = totalSeconds / totalDuration * 100;
            position = Math.max(position, parseFloat(startHandle.style.left) + 5);
            
            endHandle.style.left = `${position}%`;
            timelineProgress.style.width = `${position - parseFloat(timelineProgress.style.left)}%`;
            
            endTimeDisplay.textContent = this.value;
        }
    });
}

// Close Trimmer
function closeTrimmer() {
    const trimmerContainer = document.querySelector('.trimmer-container');
    
    // Add animation
    trimmerContainer.classList.add('slide-out-right');
    
    // Remove after animation
    setTimeout(() => {
        trimmerContainer.remove();
    }, 500);
}

// Batch Download
function initBatchDownload() {
    // This will be initialized when needed
}

// Add to Batch Download
function addToBatchDownload() {
    // Check if batch container exists
    let batchContainer = document.getElementById('batch-container');
    
    if (!batchContainer) {
        // Create batch container
        batchContainer = document.createElement('div');
        batchContainer.id = 'batch-container';
        batchContainer.className = 'batch-container';
        batchContainer.innerHTML = `
            <div class="batch-header">
                <h3><i class="fas fa-list"></i> Batch Download Queue</h3>
                <div class="btn-group">
                    <button class="btn btn-primary" id="start-batch-btn">
                        <i class="fas fa-play"></i> Start All
                    </button>
                    <button class="btn btn-danger" id="clear-batch-btn">
                        <i class="fas fa-trash"></i> Clear All
                    </button>
                </div>
            </div>
            
            <div class="batch-list" id="batch-list">
                <!-- Batch items will be added here -->
            </div>
        `;
        
        // Add to page
        const mainContainer = document.querySelector('.downloader-container');
        mainContainer.appendChild(batchContainer);
        
        // Add animation
        batchContainer.classList.add('fade-in');
        
        // Add event listeners
        const startBatchBtn = document.getElementById('start-batch-btn');
        startBatchBtn.addEventListener('click', function() {
            startBatchDownload();
        });
        
        const clearBatchBtn = document.getElementById('clear-batch-btn');
        clearBatchBtn.addEventListener('click', function() {
            clearBatchDownload();
        });
    }
    
    // Get selected format
    const selectedFormat = document.querySelector('.format-item.selected');
    if (!selectedFormat) {
        showToast('Please select a format first', 'warning');
        return;
    }
    
    // Get video info
    const videoTitle = document.querySelector('.video-metadata h2').textContent;
    const videoThumbnail = document.querySelector('.video-thumbnail').src;
    const formatId = selectedFormat.getAttribute('data-format-id');
    const formatInfo = selectedFormat.querySelector('.format-resolution').textContent;
    const formatSize = selectedFormat.querySelector('.format-size').textContent;
    
    // Create batch item
    const batchItem = document.createElement('div');
    batchItem.className = 'batch-item';
    batchItem.innerHTML = `
        <div class="batch-thumbnail">
            <img src="${videoThumbnail}" alt="${videoTitle}">
        </div>
        <div class="batch-info">
            <div class="batch-title">${videoTitle}</div>
            <div class="batch-meta">
                <div class="batch-format">${formatInfo}</div>
                <div class="batch-size">${formatSize}</div>
            </div>
        </div>
        <div class="batch-status status-pending">Pending</div>
        <div class="batch-actions">
            <button class="btn btn-sm btn-danger batch-remove-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add to batch list
    const batchList = document.getElementById('batch-list');
    batchList.appendChild(batchItem);
    
    // Add animation
    batchItem.classList.add('slide-in-right');
    
    // Add event listener to remove button
    const removeBtn = batchItem.querySelector('.batch-remove-btn');
    removeBtn.addEventListener('click', function() {
        removeBatchItem(batchItem);
    });
    
    showToast('Added to batch download queue', 'success');
}

// Remove Batch Item
function removeBatchItem(item) {
    // Add animation
    item.classList.add('slide-out-right');
    
    // Remove after animation
    setTimeout(() => {
        item.remove();
        
        // Check if batch list is empty
        const batchList = document.getElementById('batch-list');
        if (batchList.children.length === 0) {
            const batchContainer = document.getElementById('batch-container');
            
            // Add animation
            batchContainer.classList.add('fade-out');
            
            // Remove after animation
            setTimeout(() => {
                batchContainer.remove();
            }, 500);
        }
    }, 500);
}

// Start Batch Download
function startBatchDownload() {
    const batchItems = document.querySelectorAll('.batch-item');
    
    if (batchItems.length === 0) {
        showToast('Batch download queue is empty', 'warning');
        return;
    }
    
    // Update status of all items
    batchItems.forEach((item, index) => {
        const statusElement = item.querySelector('.batch-status');
        
        // Simulate sequential downloading
        setTimeout(() => {
            statusElement.textContent = 'Downloading';
            statusElement.className = 'batch-status status-downloading';
            
            // Simulate download completion
            setTimeout(() => {
                statusElement.textContent = 'Complete';
                statusElement.className = 'batch-status status-complete';
                
                // Show toast when all downloads complete
                if (index === batchItems.length - 1) {
                    showToast('All batch downloads completed', 'success');
                }
            }, 3000);
        }, index * 1000);
    });
}

// Clear Batch Download
function clearBatchDownload() {
    const batchList = document.getElementById('batch-list');
    
    if (batchList.children.length === 0) {
        showToast('Batch download queue is already empty', 'info');
        return;
    }
    
    // Add animation to all items
    const batchItems = batchList.querySelectorAll('.batch-item');
    batchItems.forEach(item => {
        item.classList.add('fade-out');
    });
    
    // Clear after animation
    setTimeout(() => {
        batchList.innerHTML = '';
        showToast('Batch download queue cleared', 'info');
    }, 500);
}

// QR Code Generator
function initQrCodeGenerator() {
    // This will be initialized when needed
}

// Generate QR Code
function generateQrCode(data) {
    // Create QR container
    const qrContainer = document.createElement('div');
    qrContainer.className = 'qr-container';
    qrContainer.innerHTML = `
        <h3><i class="fas fa-qrcode"></i> QR Code</h3>
        <p>Scan this QR code to access your download</p>
        
        <div class="qr-image">
            <!-- QR code image would be generated here -->
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}" alt="QR Code">
        </div>
        
        <div class="qr-actions">
            <button class="btn btn-primary" id="download-qr-btn">
                <i class="fas fa-download"></i> Download QR
            </button>
            <button class="btn btn-secondary" id="close-qr-btn">
                <i class="fas fa-times"></i> Close
            </button>
        </div>
    `;
    
    // Add to page
    const mainContainer = document.querySelector('.downloader-container');
    mainContainer.appendChild(qrContainer);
    
    // Add animation
    qrContainer.classList.add('bounce');
    
    // Add event listeners
    const closeBtn = document.getElementById('close-qr-btn');
    closeBtn.addEventListener('click', function() {
        closeQrCode(qrContainer);
    });
}

// Close QR Code
function closeQrCode(container) {
    // Add animation
    container.classList.add('fade-out');
    
    // Remove after animation
    setTimeout(() => {
        container.remove();
    }, 500);
}

// Mobile Menu
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const header = document.querySelector('.main-header');
    
    if (!menuToggle) return;
    
    menuToggle.addEventListener('click', function() {
        header.classList.toggle('mobile-menu-open');
    });
}

// Copy to Clipboard
function initClipboardCopy() {
    // This is handled in specific functions
}

// Animations
function initAnimations() {
    // Add animation classes to elements when they come into view
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    if (animatedElements.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Toast Notification
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Set icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (type === 'error') icon = 'times-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Add animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Add event listener to close button
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', function() {
        closeToast(toast);
    });
    
    // Auto close after 5 seconds
    setTimeout(() => {
        closeToast(toast);
    }, 5000);
}

// Close Toast
function closeToast(toast) {
    toast.classList.remove('show');
    
    // Remove after animation
    setTimeout(() => {
        toast.remove();
        
        // Remove container if empty
        const toastContainer = document.getElementById('toast-container');
        if (toastContainer && toastContainer.children.length === 0) {
            toastContainer.remove();
        }
    }, 300);
}

// Device Detection
function detectDevice() {
    const ua = navigator.userAgent;
    let deviceType = 'desktop';
    
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
        deviceType = 'mobile';
        
        if (/iPad|tablet|Tablet/i.test(ua)) {
            deviceType = 'tablet';
        }
    }
    
    return deviceType;
}

// Save Settings
function saveSettings(settings) {
    localStorage.setItem('tasvid-settings', JSON.stringify(settings));
}

// Load Settings
function loadSettings() {
    const settings = localStorage.getItem('tasvid-settings');
    return settings ? JSON.parse(settings) : {
        theme: 'cream-theme',
        defaultQuality: '720p',
        defaultFormat: 'mp4',
        compressionLevel: 'medium',
        saveHistory: true
    };
}

// Apply Settings
function applySettings() {
    const settings = loadSettings();
    
    // Apply theme
    document.body.className = settings.theme;
    
    // Apply other settings
    // This would be expanded based on the settings available
}
