# MailGen - AI-Powered Email Marketing Automation

An intelligent email marketing platform that uses AI to generate personalized emails and automate campaigns.

## Features

- 🤖 AI-powered email generation using LangGraph
- 📧 Multiple professional email templates
- 🎯 Smart prospect targeting and personalization
- 📊 Campaign analytics and tracking
- 🔄 Automated workflow with approval system
- 🎨 Customizable email templates with visual editor
- 🔐 Secure SMTP configuration

## Tech Stack

### Frontend
- React.js
- TailwindCSS
- Lucide React Icons
- Framer Motion

### Backend
- Node.js
- Express.js
- LangGraph for AI workflows
- Ollama for local LLM inference
- Redis for caching and memory

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Ollama (for local LLM)
- Redis

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lucaszengool/mailgen.git
cd mailgen
```

2. Install dependencies:
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```env
PORT=3333
OLLAMA_BASE_URL=http://localhost:11434
REDIS_URL=redis://localhost:6379
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
```

4. Start the development servers:
```bash
# Start backend server
npm run server:dev

# In another terminal, start frontend
cd client
npm start
```

## Deployment

### Railway Deployment

This application is configured for easy deployment on Railway:

1. Connect your GitHub repository to Railway
2. Railway will auto-detect the configuration
3. Set environment variables in Railway dashboard
4. Deploy!

## Usage

1. **Configure SMTP**: Set up your email sending credentials
2. **Define Campaign Goal**: Choose your marketing objective
3. **Select Template**: Pick from professional email templates
4. **Add Prospects**: Import or manually add target contacts
5. **Generate Emails**: AI creates personalized emails
6. **Review & Edit**: Preview and customize before sending
7. **Launch Campaign**: Send emails automatically

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

## License

MIT

## Contact

For questions and support, please open an issue on GitHub.
