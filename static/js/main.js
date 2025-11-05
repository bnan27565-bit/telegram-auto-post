// API base URL
const API_URL = '';

// Load configuration on page load
window.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    loadThemePreference();
    applyStoredAnimation();
});

// Save configuration
async function saveConfig() {
    const botToken = document.getElementById('botToken')?.value;
    const chatId = document.getElementById('chatId')?.value;
    
    if (!botToken || !chatId) {
        showNotification('Please fill in all configuration fields', 'error');
        return;
    }
    
    const config = {
        bot_token: botToken,
        chat_id: chatId
    };
    
    try {
        const response = await fetch(`${API_URL}/api/config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
        
        const result = await response.json();
        showNotification('Configuration saved successfully!', 'success');
    } catch (error) {
        showNotification('Error saving configuration', 'error');
        console.error(error);
    }
}

// Test connection
async function testConnection() {
    const botToken = document.getElementById('botToken')?.value;
    const chatId = document.getElementById('chatId')?.value;
    
    if (!botToken || !chatId) {
        showNotification('Please fill in bot token and chat ID first', 'error');
        return;
    }
    
    // Show loading notification
    showNotification('Testing connection...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/api/test-connection`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bot_token: botToken,
                chat_id: chatId
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showNotification(result.message, 'success');
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Connection test failed. Check console for details.', 'error');
        console.error(error);
    }
}

// Find chat ID
async function findChatId() {
    const botToken = document.getElementById('botToken')?.value;
    
    if (!botToken) {
        showNotification('Please enter bot token first', 'error');
        return;
    }
    
    showNotification('Looking for chat IDs... Send a message to your bot/group now!', 'info');
    
    try {
        const response = await fetch(`${API_URL}/api/get-chat-id`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bot_token: botToken
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success' && result.chats && result.chats.length > 0) {
            let message = 'Found chat IDs:\n\n';
            result.chats.forEach(chat => {
                message += `${chat.title}
ID: ${chat.id}
Type: ${chat.type}

`;
            });
            
            // If only one chat, auto-fill it
            if (result.chats.length === 1) {
                document.getElementById('chatId').value = result.chats[0].id;
                showNotification(`Auto-filled: ${result.chats[0].title} (${result.chats[0].id})`, 'success');
            } else {
                alert(message);
                showNotification('Multiple chats found. Check the alert to choose one.', 'success');
            }
        } else {
            showNotification(result.message || 'No chats found. Send a message to your bot/group and try again.', 'info');
        }
    } catch (error) {
        showNotification('Error finding chat ID', 'error');
        console.error(error);
    }
}

// Load configuration
async function loadConfig() {
    try {
        const response = await fetch(`${API_URL}/api/config`);
        const config = await response.json();
        
        if (document.getElementById('botToken')) {
            document.getElementById('botToken').value = config.bot_token || '';
        }
        if (document.getElementById('chatId')) {
            document.getElementById('chatId').value = config.chat_id || '';
        }
        if (document.getElementById('autoPostToggle')) {
            document.getElementById('autoPostToggle').checked = config.auto_post_enabled || false;
        }
        
        // Load selected days
        const selectedDays = config.selected_days || [];
        document.querySelectorAll('.day-input').forEach(input => {
            if (selectedDays.includes(input.value)) {
                input.checked = true;
            }
        });
        
        // Load interval settings
        const totalSeconds = config.interval_seconds || 600;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (document.getElementById('intervalHours')) {
            document.getElementById('intervalHours').value = hours;
        }
        if (document.getElementById('intervalMinutes')) {
            document.getElementById('intervalMinutes').value = minutes;
        }
        if (document.getElementById('intervalSeconds')) {
            document.getElementById('intervalSeconds').value = seconds;
        }
    } catch (error) {
        console.error('Error loading configuration:', error);
    }
}

// Select media files
function selectMedia() {
    document.getElementById('mediaFiles')?.click();
}

// Handle media file selection
let selectedMediaFiles = [];

document.getElementById('mediaFiles')?.addEventListener('change', (e) => {
    const files = e.target.files;
    const preview = document.getElementById('mediaPreview');
    preview.innerHTML = '';
    selectedMediaFiles = [];
    
    for (let file of files) {
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target.result;
                
                // Store file data
                selectedMediaFiles.push({
                    type: file.type,
                    data: data,
                    name: file.name
                });
                
                // Preview images
                if (file.type.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = data;
                    preview.appendChild(img);
                } else if (file.type.startsWith('video/')) {
                    const video = document.createElement('video');
                    video.src = data;
                    video.controls = true;
                    video.style.width = '150px';
                    video.style.height = '150px';
                    video.style.objectFit = 'cover';
                    video.style.borderRadius = '8px';
                    preview.appendChild(video);
                }
            };
            reader.readAsDataURL(file);
        }
    }
});

// Send post
async function sendPost() {
    const caption = document.getElementById('caption')?.value;
    
    if (!caption && selectedMediaFiles.length === 0) {
        showNotification('Please enter a caption or select media', 'error');
        return;
    }
    
    const post = {
        caption: caption || '',
        media: selectedMediaFiles
    };
    
    try {
        showNotification('Sending post...', 'info');
        
        const response = await fetch(`${API_URL}/api/send-post`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(post)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showNotification('Post sent successfully!', 'success');
            
            // Clear form
            document.getElementById('caption').value = '';
            document.getElementById('mediaFiles').value = '';
            document.getElementById('mediaPreview').innerHTML = '';
            selectedMediaFiles = [];
        } else {
            showNotification(result.message || 'Error sending post', 'error');
        }
    } catch (error) {
        showNotification('Error sending post', 'error');
        console.error(error);
    }
}

// Toggle auto post
async function toggleAutoPost() {
    const enabled = document.getElementById('autoPostToggle')?.checked;
    
    // Get selected days of week
    const selectedDays = [];
    document.querySelectorAll('.day-input:checked').forEach(input => {
        selectedDays.push(input.value);
    });
    
    // Calculate total seconds
    const hours = parseInt(document.getElementById('intervalHours')?.value || 0);
    const minutes = parseInt(document.getElementById('intervalMinutes')?.value || 0);
    const seconds = parseInt(document.getElementById('intervalSeconds')?.value || 0);
    
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    
    if (enabled && totalSeconds < 1) {
        showNotification('Please set at least 1 second interval', 'error');
        document.getElementById('autoPostToggle').checked = false;
        return;
    }
    
    if (enabled && selectedDays.length === 0) {
        showNotification('Please select at least one day of the week', 'error');
        document.getElementById('autoPostToggle').checked = false;
        return;
    }
    
    const settings = {
        enabled: enabled,
        interval_seconds: totalSeconds,
        selected_days: selectedDays
    };
    
    try {
        const response = await fetch(`${API_URL}/api/auto-post`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        const result = await response.json();
        
        let intervalText = '';
        if (hours > 0) intervalText += `${hours} hour${hours > 1 ? 's' : ''} `;
        if (minutes > 0) intervalText += `${minutes} minute${minutes > 1 ? 's' : ''} `;
        if (seconds > 0) intervalText += `${seconds} second${seconds > 1 ? 's' : ''}`;
        
        const daysText = selectedDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
        
        showNotification(
            enabled ? `Auto post enabled on ${daysText} every ${intervalText.trim()}` : 'Auto post disabled', 
            'success'
        );
        
        if (enabled) {
            updateNextPostTime(totalSeconds);
        } else {
            document.getElementById('nextPostTime').innerHTML = '';
        }
    } catch (error) {
        showNotification('Error updating auto post settings', 'error');
        console.error(error);
    }
}

// Update next post time
function updateNextPostTime(totalSeconds) {
    const now = new Date();
    const nextPost = new Date(now.getTime() + totalSeconds * 1000);
    const timeString = nextPost.toLocaleString();
    
    const nextPostDiv = document.getElementById('nextPostTime');
    if (nextPostDiv) {
        nextPostDiv.innerHTML = `⏰ Next post scheduled for: ${timeString}`;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        background: type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3',
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: '1000',
        animation: 'slideIn 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Load theme preference
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme') || 'ocean';
    const root = document.documentElement;
    
    switch(savedTheme) {
        case 'light':
            root.style.setProperty('--dark-bg', '#f5f5f5');
            root.style.setProperty('--card-bg', '#ffffff');
            root.style.setProperty('--text-color', '#333333');
            root.style.setProperty('--border-color', '#e0e0e0');
            break;
        case 'dark':
            root.style.setProperty('--dark-bg', '#1a1a2e');
            root.style.setProperty('--card-bg', '#16213e');
            root.style.setProperty('--text-color', '#e0e0e0');
            root.style.setProperty('--border-color', '#2d3748');
            break;
        case 'ocean':
            root.style.setProperty('--dark-bg', '#0a192f');
            root.style.setProperty('--card-bg', '#112240');
            root.style.setProperty('--text-color', '#ccd6f6');
            root.style.setProperty('--border-color', '#233554');
            root.style.setProperty('--primary-color', '#64ffda');
            root.style.setProperty('--secondary-color', '#8892b0');
            break;
        case 'sunset':
            root.style.setProperty('--dark-bg', '#2d1b2e');
            root.style.setProperty('--card-bg', '#3d2c3e');
            root.style.setProperty('--text-color', '#f4e3d7');
            root.style.setProperty('--border-color', '#5d4c5e');
            root.style.setProperty('--primary-color', '#ff6b9d');
            root.style.setProperty('--secondary-color', '#ffa07a');
            break;
    }
}

// Apply stored animation
function applyStoredAnimation() {
    const savedAnimation = localStorage.getItem('animation') || 'slide';
    if (savedAnimation !== 'none') {
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add(savedAnimation === 'fade' ? 'fade-in' : savedAnimation === 'slide' ? 'slide-up' : 'zoom-in');
            }, index * 100);
        });
    }
}
