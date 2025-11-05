// Load profile data
window.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
    loadProfileImage();
    loadThemePreference();
    loadAnimationPreference();
});

// Load profile data
async function loadProfileData() {
    try {
        // Load configuration
        const configResponse = await fetch('/api/config');
        const config = await configResponse.json();
        
        // Update bot info
        document.getElementById('profileBotToken').textContent = 
            config.bot_token ? '••••••••••••' + config.bot_token.slice(-6) : 'Not configured';
        document.getElementById('profileChatId').textContent = 
            config.chat_id || 'Not configured';
        
        const autoPostBadge = document.getElementById('profileAutoPost');
        autoPostBadge.textContent = config.auto_post_enabled ? 'Enabled' : 'Disabled';
        autoPostBadge.className = config.auto_post_enabled ? 'info-value badge active' : 'info-value badge';
        
        // Load posts statistics
        const postsResponse = await fetch('/api/posts');
        const posts = await postsResponse.json();
        
        document.getElementById('totalPosts').textContent = posts.length;
        
        // Calculate today's posts
        const today = new Date().toDateString();
        const todayPosts = posts.filter(post => {
            const postDate = new Date(post.timestamp).toDateString();
            return postDate === today;
        });
        document.getElementById('todayPosts').textContent = todayPosts.length;
        
        // Scheduled posts (you can add this logic based on your needs)
        document.getElementById('scheduledPosts').textContent = '0';
        
    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

// Backup data
async function backupData() {
    try {
        const configResponse = await fetch('/api/config');
        const config = await configResponse.json();
        
        const postsResponse = await fetch('/api/posts');
        const posts = await postsResponse.json();
        
        const backup = {
            config: config,
            posts: posts,
            timestamp: new Date().toISOString()
        };
        
        // Create download link
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `telegram-auto-post-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showNotification('Backup created successfully!', 'success');
    } catch (error) {
        showNotification('Error creating backup', 'error');
        console.error(error);
    }
}

// Restore data
function restoreData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const backup = JSON.parse(text);
            
            // Restore configuration
            await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backup.config)
            });
            
            showNotification('Data restored successfully! Please refresh the page.', 'success');
            setTimeout(() => location.reload(), 2000);
        } catch (error) {
            showNotification('Error restoring data', 'error');
            console.error(error);
        }
    };
    input.click();
}

// Clear all data
function clearData() {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone!')) {
        return;
    }
    
    const emptyConfig = {
        bot_token: '',
        chat_id: '',
        auto_post_enabled: false,
        interval_minutes: 10
    };
    
    fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emptyConfig)
    })
    .then(() => {
        showNotification('All data cleared!', 'success');
        setTimeout(() => location.reload(), 1500);
    })
    .catch(error => {
        showNotification('Error clearing data', 'error');
        console.error(error);
    });
}

// Profile Image Functions
function selectProfileImage() {
    document.getElementById('profileImageInput').click();
}

function handleProfileImage(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = e.target.result;
            localStorage.setItem('profileImage', imageData);
            displayProfileImage(imageData);
            showNotification('Profile image updated!', 'success');
        };
        reader.readAsDataURL(file);
    }
}

function loadProfileImage() {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
        displayProfileImage(savedImage);
    }
}

function displayProfileImage(imageData) {
    const preview = document.getElementById('profileImagePreview');
    preview.innerHTML = `<img src="${imageData}" alt="Profile" class="profile-image">`;
}

// Set theme
function setTheme(theme) {
    const root = document.documentElement;
    
    // Remove active class from all theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    event.target.closest('.theme-btn').classList.add('active');
    
    // Apply theme colors
    switch(theme) {
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
    
    localStorage.setItem('theme', theme);
    showNotification(`Theme set to: ${theme}`, 'success');
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme') || 'ocean';
    const themeButtons = document.querySelectorAll('.theme-btn');
    
    themeButtons.forEach((btn, index) => {
        const themes = ['light', 'dark', 'ocean', 'sunset'];
        if (themes[index] === savedTheme) {
            btn.classList.add('active');
            // Apply theme without showing notification
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
    });
}

// Set animation
function setAnimation(animation) {
    // Remove active class from all animation buttons
    document.querySelectorAll('.animation-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    event.target.closest('.animation-btn').classList.add('active');
    
    localStorage.setItem('animation', animation);
    showNotification(`Animation set to: ${animation}`, 'success');
    
    // Apply animation to all cards as demo
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        // Remove all animation classes
        card.classList.remove('fade-in', 'slide-up', 'zoom-in');
        
        // Add selected animation
        if (animation !== 'none') {
            setTimeout(() => {
                card.classList.add(animation === 'fade' ? 'fade-in' : animation === 'slide' ? 'slide-up' : 'zoom-in');
            }, 10);
        }
    });
}

function loadAnimationPreference() {
    const savedAnimation = localStorage.getItem('animation') || 'slide';
    const animationButtons = document.querySelectorAll('.animation-btn');
    
    animationButtons.forEach((btn, index) => {
        const animations = ['fade', 'slide', 'zoom', 'none'];
        if (animations[index] === savedAnimation) {
            btn.classList.add('active');
        }
    });
}

function applyStoredAnimation() {
    // Disabled for faster performance
}

// Show notification (same as main.js)
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
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
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
