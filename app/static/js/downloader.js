// Enhanced TasVID - Downloader Specific JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize video format selection
    initFormatSelection();
    
    // Initialize batch download functionality
    initBatchDownload();
    
    // Initialize video trimmer
    initVideoTrimmer();
    
    // Initialize advanced options
    initAdvancedOptions();
    
    // Check for URL parameter
    checkUrlParameter();
});

// Check for URL parameter
function checkUrlParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const youtubeUrl = urlParams.get('url');
    
    if (youtubeUrl) {
        const urlInput = document.getElementById('url-input');
        if (urlInput) {
            urlInput.value = youtubeUrl;
            
            // Trigger analysis
            const analyzeBtn = document.getElementById('analyze-btn');
            if (analyzeBtn) {
                analyzeBtn.click();
            }
        }
    }
}

// Format Selection
function initFormatSelection() {
    document.addEventListener('click', function(e) {
        // Check if clicked element is a format item but not a button
        if (e.target.closest('.format-item') && !e.target.closest('.download-btn')) {
            const formatItem = e.target.closest('.format-item');
            const formatItems = document.querySelectorAll('.format-item');
            
            // Remove selected class from all items
            formatItems.forEach(item => {
                item.classList.remove('selected');
            });
            
            // Add selected class to clicked item
            formatItem.classList.add('selected');
        }
        
        // Check if clicked element is a download button
        if (e.target.closest('.download-btn')) {
            const formatId = e.target.closest('.download-btn').getAttribute('data-format-id');
            startDownload(formatId);
        }
    });
}

// Start Download
function startDownload(formatId) {
    // Get selected compression level
    const compressionLevel = document.getElementById('compression-level')?.value || 'medium';
    
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
        if (videoInfoContainer) {
            videoInfoContainer.parentNode.insertBefore(progressContainer, videoInfoContainer.nextSibling);
            
            // Add animation
            progressContainer.classList.add('slide-up');
            
            // Add event listener to cancel button
            const cancelButton = document.getElementById('cancel-download-btn');
            if (cancelButton) {
                cancelButton.addEventListener('click', function() {
                    cancelDownload();
                });
            }
        }
    }
    
    // Simulate download progress
    simulateDownloadProgress();
    
    // In a real implementation, we would send an AJAX request to the server
    // to start the download process with the selected format and compression level
    /*
    fetch('/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            formatId: formatId,
            compressionLevel: compressionLevel
        })
    })
    .then(response => response.json())
    .then(data => {
        // Handle response
        if (data.success) {
            // Start progress tracking
            trackDownloadProgress(data.downloadId);
        } else {
            showToast('Download failed: ' + data.error, 'error');
        }
    })
    .catch(error => {
        showToast('An error occurred: ' + error, 'error');
    });
    */
}

// Simulate Download Progress
function simulateDownloadProgress() {
    const progressBar = document.querySelector('.progress-bar');
    const progressPercentage = document.querySelector('.progress-percentage');
    const progressSize = document.querySelector('.progress-size');
    const progressTime = document.querySelector('.progress-time');
    
    if (!progressBar || !progressPercentage || !progressSize || !progressTime) return;
    
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
        if (progressContainer) {
            progressContainer.classList.add('slide-down');
            
            setTimeout(() => {
                progressContainer.remove();
            }, 500);
            
            showToast('Download cancelled', 'warning');
        }
    }
}

// Download Complete
function downloadComplete() {
    const progressContainer = document.getElementById('progress-container');
    if (!progressContainer) return;
    
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
                <button class="btn btn-primary" id="open-folder-btn">
                    <i class="fas fa-folder-open"></i> Open Folder
                </button>
                <button class="btn btn-secondary" id="play-video-btn">
                    <i class="fas fa-play"></i> Play Video
                </button>
                <button class="btn btn-outline" id="generate-qr-btn">
                    <i class="fas fa-qrcode"></i> Generate QR Code
                </button>
            </div>
        </div>
    `;
    
    // Add animation
    const completeContainer = progressContainer.querySelector('.complete-container');
    if (completeContainer) {
        completeContainer.classList.add('bounce');
    }
    
    // Add event listeners
    const copyButton = progressContainer.querySelector('.copy-path');
    if (copyButton) {
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
    
    const generateQrBtn = document.getElementById('generate-qr-btn');
    if (generateQrBtn) {
        generateQrBtn.addEventListener('click', function() {
            generateQrCode('/home/user/Downloads/TasVID/sample_video.mp4');
        });
    }
}

// Batch Download
function initBatchDownload() {
    document.addEventListener('click', function(e) {
        // Check if clicked element is the add to batch button
        if (e.target.closest('#add-to-batch-btn')) {
            addToBatchDownload();
        }
        
        // Check if clicked element is the start batch button
        if (e.target.closest('#start-batch-btn')) {
            startBatchDownload();
        }
        
        // Check if clicked element is the clear batch button
        if (e.target.closest('#clear-batch-btn')) {
            clearBatchDownload();
        }
        
        // Check if clicked element is a batch remove button
        if (e.target.closest('.batch-remove-btn')) {
            const batchItem = e.target.closest('.batch-item');
            if (batchItem) {
                removeBatchItem(batchItem);
            }
        }
    });
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
        if (mainContainer) {
            mainContainer.appendChild(batchContainer);
            
            // Add animation
            batchContainer.classList.add('fade-in');
        }
    }
    
    // Get selected format
    const selectedFormat = document.querySelector('.format-item.selected');
    if (!selectedFormat) {
        showToast('Please select a format first', 'warning');
        return;
    }
    
    // Get video info
    const videoTitle = document.querySelector('.video-metadata h2')?.textContent || 'Sample Video';
    const videoThumbnail = document.querySelector('.video-thumbnail')?.src || '';
    const formatId = selectedFormat.getAttribute('data-format-id');
    const formatInfo = selectedFormat.querySelector('.format-resolution')?.textContent || 'Unknown';
    const formatSize = selectedFormat.querySelector('.format-size')?.textContent || 'Unknown';
    
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
    if (batchList) {
        batchList.appendChild(batchItem);
        
        // Add animation
        batchItem.classList.add('slide-in-right');
        
        showToast('Added to batch download queue', 'success');
    }
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
        if (batchList && batchList.children.length === 0) {
            const batchContainer = document.getElementById('batch-container');
            if (batchContainer) {
                // Add animation
                batchContainer.classList.add('fade-out');
                
                // Remove after animation
                setTimeout(() => {
                    batchContainer.remove();
                }, 500);
            }
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
        if (!statusElement) return;
        
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
    if (!batchList || batchList.children.length === 0) {
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

// Video Trimmer
function initVideoTrimmer() {
    document.addEventListener('click', function(e) {
        // Check if clicked element is the trim video button
        if (e.target.closest('#trim-video-btn')) {
            showVideoTrimmer();
        }
        
        // Check if clicked element is the close trimmer button
        if (e.target.closest('#close-trimmer-btn')) {
            closeTrimmer();
        }
        
        // Check if clicked element is the apply trim button
        if (e.target.closest('#apply-trim-btn')) {
            applyTrim();
        }
    });
}

// Show Video Trimmer
function showVideoTrimmer() {
    // Check if trimmer already exists
    if (document.querySelector('.trimmer-container')) return;
    
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
                <div class="timeline-progress" style="left: 0%; width: 100%;"></div>
                <div class="timeline-handle start" style="left: 0%;"></div>
                <div class="timeline-handle end" style="left: 100%;"></div>
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
    if (videoInfoContainer) {
        videoInfoContainer.parentNode.insertBefore(trimmerContainer, videoInfoContainer.nextSibling);
        
        // Add animation
        trimmerContainer.classList.add('slide-in-right');
        
        // Initialize timeline handles
        initTimelineHandles();
    }
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
    
    if (!timelineContainer || !startHandle || !endHandle || !timelineProgress || 
        !startTimeDisplay || !endTimeDisplay || !startTimeInput || !endTimeInput) return;
    
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
    
    // Preview trim button
    const previewTrimBtn = document.getElementById('preview-trim-btn');
    if (previewTrimBtn) {
        previewTrimBtn.addEventListener('click', function() {
            previewTrim();
        });
    }
}

// Preview Trim
function previewTrim() {
    const video = document.getElementById('trim-video-preview');
    const startTimeInput = document.getElementById('start-time-input');
    const endTimeInput = document.getElementById('end-time-input');
    
    if (!video || !startTimeInput || !endTimeInput) return;
    
    // Parse start and end times
    const startTimeParts = startTimeInput.value.split(':');
    const endTimeParts = endTimeInput.value.split(':');
    
    if (startTimeParts.length !== 2 || endTimeParts.length !== 2) return;
    
    const startSeconds = parseInt(startTimeParts[0]) * 60 + parseInt(startTimeParts[1]);
    const endSeconds = parseInt(endTimeParts[0]) * 60 + parseInt(endTimeParts[1]);
    
    // Set video current time to start time
    video.currentTime = startSeconds;
    
    // Play video
    video.play();
    
    // Pause when reaching end time
    const pauseAtEnd = function() {
        if (video.currentTime >= endSeconds) {
            video.pause();
            video.removeEventListener('timeupdate', pauseAtEnd);
        }
    };
    
    video.addEventListener('timeupdate', pauseAtEnd);
}

// Apply Trim
function applyTrim() {
    const startTimeInput = document.getElementById('start-time-input');
    const endTimeInput = document.getElementById('end-time-input');
    
    if (!startTimeInput || !endTimeInput) return;
    
    // Get start and end times
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;
    
    // Close trimmer
    closeTrimmer();
    
    // Show toast
    showToast(`Video will be trimmed from ${startTime} to ${endTime}`, 'success');
    
    // In a real implementation, we would send an AJAX request to the server
    // to apply the trim settings to the download
    /*
    fetch('/trim', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            startTime: startTime,
            endTime: endTime
        })
    })
    .then(response => response.json())
    .then(data => {
        // Handle response
        if (data.success) {
            showToast('Trim settings applied', 'success');
        } else {
            showToast('Failed to apply trim settings: ' + data.error, 'error');
        }
    })
    .catch(error => {
        showToast('An error occurred: ' + error, 'error');
    });
    */
}

// Close Trimmer
function closeTrimmer() {
    const trimmerContainer = document.querySelector('.trimmer-container');
    if (!trimmerContainer) return;
    
    // Add animation
    trimmerContainer.classList.add('slide-out-right');
    
    // Remove after animation
    setTimeout(() => {
        trimmerContainer.remove();
    }, 500);
}

// Generate QR Code
function generateQrCode(data) {
    // Check if QR container already exists
    if (document.querySelector('.qr-container')) return;
    
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
    if (mainContainer) {
        mainContainer.appendChild(qrContainer);
        
        // Add animation
        qrContainer.classList.add('bounce');
        
        // Add event listeners
        const closeBtn = document.getElementById('close-qr-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                closeQrCode(qrContainer);
            });
        }
        
        const downloadQrBtn = document.getElementById('download-qr-btn');
        if (downloadQrBtn) {
            downloadQrBtn.addEventListener('click', function() {
                // In a real implementation, we would trigger a download of the QR code image
                showToast('QR code image downloaded', 'success');
            });
        }
    }
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

// Advanced Options
function initAdvancedOptions() {
    // This would be expanded based on the advanced options available
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
        
        // Add styles if not already in CSS
        const style = document.createElement('style');
        style.textContent = `
            .toast-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 300px;
            }
            
            .toast {
                background-color: var(--card-bg);
                color: var(--text-color);
                padding: 12px 15px;
                border-radius: 8px;
                box-shadow: var(--shadow-medium);
                display: flex;
                align-items: center;
                gap: 10px;
                transform: translateX(100%);
                opacity: 0;
                transition: transform 0.3s ease, opacity 0.3s ease;
            }
            
            .toast.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .toast-success {
                border-left: 4px solid var(--success);
            }
            
            .toast-warning {
                border-left: 4px solid var(--warning);
            }
            
            .toast-error {
                border-left: 4px solid var(--danger);
            }
            
            .toast-info {
                border-left: 4px solid var(--info);
            }
            
            .toast i {
                font-size: 1.2rem;
            }
            
            .toast-success i {
                color: var(--success);
            }
            
            .toast-warning i {
                color: var(--warning);
            }
            
            .toast-error i {
                color: var(--danger);
            }
            
            .toast-info i {
                color: var(--info);
            }
            
            .toast span {
                flex: 1;
            }
            
            .toast-close {
                background: none;
                border: none;
                color: var(--text-color);
                opacity: 0.5;
                cursor: pointer;
                transition: opacity 0.2s ease;
            }
            
            .toast-close:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
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
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            closeToast(toast);
        });
    }
    
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
