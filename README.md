# Telegram Auto Post

A web-based tool for automating posts to Telegram channels and groups.

## Technology Stack

- **Backend**: Python (Flask)
- **Frontend**: HTML, CSS, JavaScript
- **Libraries**: python-telegram-bot, APScheduler

## Features

✅ Home page with post creation and scheduling
✅ About page with features and usage instructions
✅ Profile page with statistics and settings
✅ Auto-posting with custom intervals
✅ Media file support (images/videos)
✅ Backup and restore functionality
✅ Modern, responsive UI

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

1. Start the Flask server:
```bash
python app.py
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

## How to Use

1. **Get Bot Token**:
   - Go to [@BotFather](https://t.me/BotFather) on Telegram
   - Create a new bot with `/newbot`
   - Copy the bot token

2. **Get Channel/Group ID**:
   - Add your bot to your channel/group
   - Make it an admin
   - Get the chat ID (use @getidsbot or similar)

3. **Configure the App**:
   - Go to Home page
   - Enter your bot token and channel ID
   - Click "Save Configuration"

4. **Create Posts**:
   - Enter your caption
   - (Optional) Add media files
   - Click "Send Post" to send immediately
   - Or enable "Auto Post" for scheduled posting

## Pages

- **Home** (`/`): Main interface for creating posts and configuration
- **About** (`/about`): Information about the tool and how to use it
- **Profile** (`/profile`): View statistics and manage settings

## Project Structure

```
TG_Auto_Post/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── config.json           # Configuration file (auto-generated)
├── posts.json            # Posts storage (auto-generated)
├── templates/
│   ├── index.html        # Home page
│   ├── about.html        # About page
│   └── profile.html      # Profile page
└── static/
    ├── css/
    │   └── style.css     # Styles
    └── js/
        ├── main.js       # Main JavaScript
        └── profile.js    # Profile page JavaScript
```

## License

MIT License
