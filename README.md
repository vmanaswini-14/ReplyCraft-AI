[![Backend Tests](https://github.com/vmanaswini-14/ReplyCraft-AI/actions/workflows/test.yml/badge.svg)](https://github.com/vmanaswini-14/ReplyCraft-AI/actions/workflows/test.yml)

# ✉️ ReplyCraft AI

### Your AI-Powered Email Assistant for Gmail

ReplyCraft AI is a Chrome extension that uses Google Gemini AI to generate professional, context-aware email replies directly from Gmail.

Customize your writing tone, provide additional instructions, and insert AI-generated drafts into Gmail while keeping complete control over the final message.

## 🚀 Features

- **AI-Powered Reply Generation:** Generate context-aware email responses.
- **Multiple Writing Tones:** Choose Professional, Friendly, Formal, or Concise.
- **Gmail Integration:** Load email content directly from Gmail.
- **Smart Reply Detection:** Identify emails that may not require a response.
- **Custom Instructions:** Personalize generated replies.
- **Regenerate Replies:** Generate alternative responses.
- **Copy to Clipboard:** Copy generated replies easily.
- **Direct Draft Insertion:** Insert generated replies into Gmail's reply editor.
- **User-Controlled Sending:** Review and edit drafts before sending. Emails are never automatically sent.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Extension interface |
| CSS3 | Styling and layout |
| JavaScript | Extension functionality |
| Chrome Extension APIs | Browser integration |
| Node.js | Backend runtime |
| Express.js | REST API server |
| Google Gemini API | AI-powered reply generation |

## ⚙️ Installation and Setup

### Prerequisites

- Google Chrome
- Node.js and npm
- A Google Gemini API key

### 1. Clone the Repository

git clone https://github.com/vmanaswini-14/ReplyCraft-AI.git
cd ReplyCraft-AI
2. Install Backend Dependencies
cd server
npm install
3. Configure Environment Variables

Create a .env file inside the server directory.

Add your API key:

GEMINI_API_KEY=your_gemini_api_key

Replace the placeholder with your own Gemini API key.

Never commit or share your .env file or API key.

4. Start the Backend

From the server directory, run:

node server.js

The backend should start at:

https://replycraft-ai.onrender.com

Keep the backend running while using the extension.

5. Load the Chrome Extension
Open Google Chrome.
Navigate to chrome://extensions.
Enable Developer mode.
Click Load unpacked.
Select the project folder containing manifest.json.
Open Gmail and launch ReplyCraft AI.

## 📸 Screenshots

### AI-Powered Email Reply
![ReplyCraft AI generating an email reply](replycraft-demo.png)

### Smart Reply Detection
![ReplyCraft AI detecting when a reply is unnecessary](no-reply-detection.png)

💡 How It Works
Open Gmail and select an email.
Load the email into ReplyCraft AI.
Choose a preferred writing tone.
Add optional instructions.
Generate an AI-powered reply.
Review, copy, regenerate, or insert the draft into Gmail.
Edit the response if needed and send it yourself.

ReplyCraft AI assists with drafting while leaving the final decision to the user.
🏗️ Architecture

           Gmail
              |
              v
     Chrome Extension
        Side Panel
              |
              v
      Node.js + Express
          Backend
              |
              v
       Google Gemini API
              |
              v
      Generated Reply
              |
              v
       Gmail Reply Draft

🔐 Security and Privacy
API credentials are loaded through environment variables.
.env files and node_modules are excluded using .gitignore.
Generated replies are inserted as drafts for the user to review.
The extension does not automatically send emails.
Users should review AI-generated content before sending it.
🎯 Project Highlights

ReplyCraft AI demonstrates practical experience with:

Chrome extension development
Frontend and backend integration
REST API development
Generative AI integration
Gmail interaction and browser automation
Environment variable management
Git and GitHub version control
🔮 Future Improvements
 Support additional email providers
 Add reply-history management
 Improve contextual personalization
 Add automated testing and error handling
 Explore easier extension distribution
👩‍💻 Author

Manaswini

GitHub: @vmanaswini-14

