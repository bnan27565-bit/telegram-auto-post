from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import os
from datetime import datetime
import json
import requests
import base64

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

# Configuration file path
CONFIG_FILE = 'config.json'
POSTS_FILE = 'posts.json'

# Load or create config
def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        'bot_token': '', 
        'chat_id': '', 
        'auto_post_enabled': False, 
        'interval_seconds': 600,
        'selected_days': []
    }

def save_config(config):
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=4, ensure_ascii=False)

# Load or create posts
def load_posts():
    if os.path.exists(POSTS_FILE):
        with open(POSTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_posts(posts):
    with open(POSTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(posts, f, indent=4, ensure_ascii=False)

# Routes
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/profile')
def profile():
    return render_template('profile.html')

# API Endpoints
@app.route('/api/config', methods=['GET', 'POST'])
def config():
    if request.method == 'GET':
        return jsonify(load_config())
    else:
        data = request.json
        save_config(data)
        return jsonify({'status': 'success', 'message': 'Configuration saved'})

@app.route('/api/posts', methods=['GET', 'POST'])
def posts():
    if request.method == 'GET':
        return jsonify(load_posts())
    else:
        data = request.json
        posts_list = load_posts()
        posts_list.append({
            'id': len(posts_list) + 1,
            'caption': data.get('caption', ''),
            'media': data.get('media', []),
            'timestamp': datetime.now().isoformat()
        })
        save_posts(posts_list)
        return jsonify({'status': 'success', 'message': 'Post saved'})

@app.route('/api/get-chat-id', methods=['POST'])
def get_chat_id():
    """Get chat ID by sending a message and checking updates"""
    data = request.json
    bot_token = data.get('bot_token')
    
    if not bot_token:
        return jsonify({'status': 'error', 'message': 'Bot token is required'})
    
    try:
        # Get updates to find chat IDs
        url = f'https://api.telegram.org/bot{bot_token}/getUpdates'
        response = requests.get(url, timeout=10)
        result = response.json()
        
        if not result.get('ok'):
            return jsonify({'status': 'error', 'message': 'Invalid bot token'})
        
        updates = result.get('result', [])
        
        if not updates:
            return jsonify({
                'status': 'info',
                'message': 'No recent messages found. Please send a message to your bot or group, then try again.'
            })
        
        # Extract unique chat IDs
        chats = []
        seen_ids = set()
        
        for update in reversed(updates[-10:]):  # Last 10 updates
            message = update.get('message') or update.get('channel_post')
            if message:
                chat = message.get('chat', {})
                chat_id = chat.get('id')
                chat_title = chat.get('title') or chat.get('first_name', 'Private Chat')
                chat_type = chat.get('type')
                
                if chat_id and chat_id not in seen_ids:
                    seen_ids.add(chat_id)
                    chats.append({
                        'id': chat_id,
                        'title': chat_title,
                        'type': chat_type
                    })
        
        return jsonify({
            'status': 'success',
            'chats': chats
        })
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Error: {str(e)}'})

@app.route('/api/test-connection', methods=['POST'])
def test_connection():
    """Test Telegram bot token and chat ID"""
    data = request.json
    bot_token = data.get('bot_token')
    chat_id = data.get('chat_id')
    
    if not bot_token or not chat_id:
        return jsonify({'status': 'error', 'message': 'Bot token and chat ID are required'})
    
    try:
        # Test bot token by getting bot info
        bot_url = f'https://api.telegram.org/bot{bot_token}/getMe'
        bot_response = requests.get(bot_url, timeout=10)
        bot_data = bot_response.json()
        
        if not bot_data.get('ok'):
            return jsonify({
                'status': 'error',
                'message': f'Invalid bot token: {bot_data.get("description", "Unknown error")}'
            })
        
        bot_info = bot_data.get('result', {})
        bot_name = bot_info.get('username', 'Unknown')
        
        # Test sending a message to the chat
        send_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
        test_message = {
            'chat_id': chat_id,
            'text': '✅ Connection test successful! Your Telegram Auto Post is working correctly.'
        }
        
        send_response = requests.post(send_url, json=test_message, timeout=10)
        send_data = send_response.json()
        
        if not send_data.get('ok'):
            error_desc = send_data.get('description', 'Unknown error')
            if 'chat not found' in error_desc.lower():
                return jsonify({
                    'status': 'error',
                    'message': f'Chat ID {chat_id} not found. Make sure the bot is added to the channel/group and has admin rights.'
                })
            elif 'bot was blocked' in error_desc.lower():
                return jsonify({
                    'status': 'error',
                    'message': 'Bot was blocked by the user. Please unblock it and try again.'
                })
            else:
                return jsonify({
                    'status': 'error',
                    'message': f'Failed to send message: {error_desc}'
                })
        
        return jsonify({
            'status': 'success',
            'message': f'Connection successful! Bot: @{bot_name}',
            'bot_name': bot_name
        })
        
    except requests.exceptions.Timeout:
        return jsonify({'status': 'error', 'message': 'Connection timeout. Please check your internet connection.'})
    except requests.exceptions.RequestException as e:
        return jsonify({'status': 'error', 'message': f'Connection error: {str(e)}'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Error: {str(e)}'})

@app.route('/api/send-post', methods=['POST'])
def send_post():
    """Send post to Telegram with optional media"""
    data = request.json
    config = load_config()
    
    bot_token = config.get('bot_token')
    chat_id = config.get('chat_id')
    caption = data.get('caption', '')
    media_files = data.get('media', [])
    
    if not bot_token or not chat_id:
        return jsonify({'status': 'error', 'message': 'Please configure bot token and chat ID first'})
    
    if not caption and not media_files:
        return jsonify({'status': 'error', 'message': 'Caption or media is required'})
    
    try:
        # If there are media files, send as photo/video
        if media_files and len(media_files) > 0:
            # Send first media file with caption
            media_data = media_files[0]
            media_type = media_data.get('type', 'photo')
            media_base64 = media_data.get('data', '')
            
            # Remove base64 prefix if exists
            if ',' in media_base64:
                media_base64 = media_base64.split(',')[1]
            
            # Decode base64 to binary
            media_binary = base64.b64decode(media_base64)
            
            # Determine if it's photo or video
            if 'video' in media_type:
                send_url = f'https://api.telegram.org/bot{bot_token}/sendVideo'
                files = {'video': ('video.mp4', media_binary)}
            else:
                send_url = f'https://api.telegram.org/bot{bot_token}/sendPhoto'
                files = {'photo': ('photo.jpg', media_binary)}
            
            message_data = {
                'chat_id': chat_id,
                'caption': caption
            }
            
            response = requests.post(send_url, data=message_data, files=files, timeout=30)
            result = response.json()
            
        else:
            # Send text only
            send_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
            message_data = {
                'chat_id': chat_id,
                'text': caption,
                'parse_mode': 'HTML'
            }
            
            response = requests.post(send_url, json=message_data, timeout=10)
            result = response.json()
        
        if result.get('ok'):
            # Save post to history
            posts_list = load_posts()
            posts_list.append({
                'id': len(posts_list) + 1,
                'caption': caption,
                'has_media': len(media_files) > 0,
                'timestamp': datetime.now().isoformat(),
                'status': 'sent'
            })
            save_posts(posts_list)
            
            return jsonify({'status': 'success', 'message': 'Post sent to Telegram successfully!'})
        else:
            return jsonify({
                'status': 'error',
                'message': f'Failed to send: {result.get("description", "Unknown error")}'
            })
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Error: {str(e)}'})

@app.route('/api/auto-post', methods=['POST'])
def toggle_auto_post():
    data = request.json
    config = load_config()
    config['auto_post_enabled'] = data.get('enabled', False)
    config['interval_seconds'] = data.get('interval_seconds', 600)
    config['selected_days'] = data.get('selected_days', [])
    save_config(config)
    return jsonify({'status': 'success', 'message': 'Auto post settings updated'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
