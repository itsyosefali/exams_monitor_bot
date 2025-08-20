# 📚 Academic Deadline Telegram Bot

A smart Telegram bot that helps you keep track of exams, assignments, reports, and other academic deadlines. Never miss another deadline again! 🎓

## ✨ Features

- **📝 Add Events**: Easily add exams, assignments, reports with dates
- **📅 Smart Notifications**: Get reminded 24 hours and 2 hours before deadlines
- **📋 List Events**: View all upcoming deadlines with urgency indicators
- **🚨 Urgency Alerts**: Visual indicators for approaching deadlines
- **⏰ Automatic Reminders**: Daily notifications for upcoming events
- **💾 Persistent Storage**: All data stored securely in Supabase

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 16+ installed
- A Telegram account
- A Supabase account (free tier available)

### 2. Get Telegram Bot Token

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot`
3. Choose a name and username for your bot
4. Copy the bot token

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings → API
4. Copy your project URL and anon key

### 4. Install Dependencies

```bash
npm install
```

### 5. Configure Environment

1. Copy `config.env.example` to `.env`
2. Fill in your credentials:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
NOTIFICATION_HOURS_BEFORE=24
NOTIFICATION_HOURS_BEFORE_CRITICAL=2
```

### 6. Set Up Database

```bash
npm run setup
```

If the automatic setup fails, create the table manually in Supabase SQL Editor:

```sql
CREATE TABLE academic_events (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  subject TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_academic_events_user_date ON academic_events(user_id, event_date);
CREATE INDEX idx_academic_events_date ON academic_events(event_date);
```

### 7. Run the Bot

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## 📱 Usage

### Commands

- `/start` - Welcome message and bot introduction
- `/add` - Add a new academic event
- `/list` - Show all upcoming events
- `/help` - Display help information

### Adding Events

1. Use `/add` command
2. Send the subject/event name (e.g., "Math Midterm Exam")
3. Send the date in DD-MM-YYYY format (e.g., "18-02-2026")
4. Confirm with "yes"

### Example Conversation

```
You: /add
Bot: 📝 Adding New Event

Please send me the subject/event name (e.g., 'Math Midterm Exam'):

You: Math Midterm Exam
Bot: 📅 Now send me the date in DD-MM-YYYY format (e.g., 18-02-2026):

You: 18-02-2026
Bot: ✅ Event Details:

📚 Subject: Math Midterm Exam
📅 Date: 18-02-2026

Is this correct? Send 'yes' to confirm or 'no' to cancel.

You: yes
Bot: ✅ Event added successfully!

📚 Math Midterm Exam
📅 18-02-2026

I'll remind you before the deadline! ⏰
```

## 🔔 Notifications

The bot automatically sends notifications:
- **24 hours before** deadline (⚠️ REMINDER)
- **2 hours before** deadline (🚨 URGENT)

## 🏗️ Architecture

- **Frontend**: Telegram Bot API
- **Backend**: Node.js with Express-like bot framework
- **Database**: Supabase (PostgreSQL)
- **Scheduling**: node-cron for automated notifications
- **Date Handling**: Moment.js for robust date operations

## 📊 Database Schema

```sql
academic_events
├── id (SERIAL PRIMARY KEY)
├── user_id (BIGINT) - Telegram user ID
├── subject (TEXT) - Event description
├── event_date (TIMESTAMP) - Deadline date
├── created_at (TIMESTAMP) - Record creation time
└── updated_at (TIMESTAMP) - Last update time
```

## 🚀 Deployment Options

### Local Development
```bash
npm run dev
```

### Production (VPS/Cloud)
```bash
npm start
```

### Docker (Coming Soon)
```bash
docker build -t academic-bot .
docker run -d academic-bot
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Your bot token from @BotFather | Required |
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Required |
| `NOTIFICATION_HOURS_BEFORE` | Hours before deadline for first notification | 24 |
| `NOTIFICATION_HOURS_BEFORE_CRITICAL` | Hours before deadline for urgent notification | 2 |

### Customization

You can modify notification times, add new commands, or customize the bot behavior by editing `src/index.js`.

## 🐛 Troubleshooting

### Common Issues

1. **Bot not responding**: Check your bot token and internet connection
2. **Database errors**: Verify Supabase credentials and table structure
3. **Notifications not working**: Check cron job and timezone settings

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=* npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api) - Telegram Bot API wrapper
- [Supabase](https://supabase.com) - Open source Firebase alternative
- [Moment.js](https://momentjs.com) - Date manipulation library

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Open an issue on GitHub
4. Contact the maintainer

---

**Happy studying! 📚✨ Never miss another deadline with your Academic Deadline Bot!**
