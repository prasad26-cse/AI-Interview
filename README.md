# 🤖 AI Interview Assistant

A production-quality AI-powered interview platform built with React, TypeScript, Redux Toolkit, and Ant Design. Conduct automated technical interviews with AI-powered question generation, real-time grading, and comprehensive analytics.

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

live demo:(https://68de08ba34c47f7d98d365dd--symphonious-pasca-ba1360.netlify.app/)

## Features

### Interviewee Tab
- **Resume Upload**: Accept PDF/DOCX files with automatic text extraction
- **Smart Field Extraction**: Automatically extracts Name, Email, and Phone from resumes
- **Missing Field Collection**: Chatbot prompts for any missing information before starting
- **Timed Interview**: 6 long theoretical questions (2 Easy → 2 Medium → 2 Hard) with countdown timers
  - Questions focus on concepts, architecture, and design patterns
  - No coding questions - only theoretical knowledge testing
- **Camera & Microphone Recording**: Records video/audio for each answer (with user consent)
- **Auto-Submit**: Automatically submits answers when time runs out
- **AI Grading**: Real-time grading using Hugging Face API
- **Session Persistence**: Resume interrupted sessions with "Welcome Back" modal

### Interviewer Dashboard
- **Admin Authentication**: Login with `interviewe@admin.com` / `pass@123`
- **Candidate List**: View all candidates sorted by score or date
- **Search & Filter**: Search by name/email, filter by status
- **Detailed View**: View full interview transcript, recordings, and AI feedback
- **Score Visualization**: Color-coded scores and status tags

### Technical Features
- **Local Persistence**: All data stored in IndexedDB (redux-persist + localForage)
- **Timer Restoration**: Accurate timer restoration after page refresh/close
- **Media Storage**: Video/audio recordings stored as blobs in IndexedDB
- **Responsive UI**: Modern, clean interface built with Ant Design
- **Type Safety**: Full TypeScript implementation

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **State Management**: Redux Toolkit + redux-persist
- **Storage**: localForage (IndexedDB)
- **UI Library**: Ant Design
- **Build Tool**: Vite
- **AI Service**: Hugging Face Inference API
- **Resume Parsing**: pdfjs-dist (PDF) + mammoth (DOCX)
- **Media Recording**: MediaRecorder API

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure API Key** (Required):
   
   ⚠️ **IMPORTANT**: You must configure a Hugging Face API key before using the application.
   
   **Option A - Environment Variable (Recommended for Development)**:
   ```bash
   # Create a .env file in the root directory
   cp .env.example .env
   
   # Edit .env and add your API key:
   VITE_HUGGINGFACE_API_KEY=your_actual_huggingface_api_key_here
   ```
   
   **Option B - Settings UI (Recommended for Production)**:
   - Start the application
   - Click the "Settings" button in the top-right corner
   - Enter your Hugging Face API key
   - Click "Save" - the key will be stored in browser localStorage
   
   **Get Your Free API Key**:
   - Visit [Hugging Face Tokens](https://huggingface.co/settings/tokens)
   - Sign up for a free account
   - Generate an API token (read access is sufficient)
   - Copy the token for use in the application

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Preview production build**:
   ```bash
   npm run preview
   ```

## Configuration

### API Setup

This application uses the Hugging Face Inference API for AI-powered features. The API key can be configured in two ways:

1. **Environment Variable** (`.env` file):
   - Best for development and local testing
   - Key is loaded automatically on application start
   - Not committed to version control

2. **Settings UI** (localStorage):
   - Best for production deployments
   - Users can configure their own API key
   - Persists across browser sessions

### Admin Access

For the admin dashboard, configure authentication credentials in your deployment environment.

⚠️ **Security Note**: Never commit API keys or credentials to version control. Use environment variables for production deployments.

## Usage

### For Candidates (Interviewee Tab)

1. **Upload Resume**: Click "Upload Resume" and select a PDF or DOCX file
2. **Complete Profile**: If any fields are missing, the chatbot will ask for them
3. **Grant Permissions**: Allow camera/microphone access when prompted (optional but recommended)
4. **Answer Questions**: Type your answers and submit before time runs out
5. **View Results**: See your final score and AI-generated summary

### For Interviewers (Interviewer Tab)

1. **Login**: Click "Interviewer" tab and login with admin credentials
2. **View Candidates**: Browse the list of all candidates with scores
3. **Search/Filter**: Use search bar and filters to find specific candidates
4. **View Details**: Click "View Details" to see full interview transcript and recordings
5. **Review Performance**: Check per-question scores, feedback, and recordings

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── LoginModal.tsx
│   ├── SettingsModal.tsx
│   └── WelcomeBackModal.tsx
├── pages/              # Main page components
│   ├── IntervieweePage.tsx
│   └── InterviewerPage.tsx
├── services/           # External API services
│   ├── huggingfaceService.ts   # Service wrapper for HF API
│   └── huggingfaceAPI.ts       # Hugging Face API implementation
├── store/              # Redux store and slices
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── candidatesSlice.ts
│   │   ├── sessionsSlice.ts
│   │   └── uiSlice.ts
│   └── index.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   ├── mediaRecorder.ts
│   ├── resumeParser.ts
│   ├── storage.ts
│   └── timerUtils.ts
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## Data Model

### Candidate
```typescript
{
  id: UUID;
  name?: string;
  email?: string;
  phone?: string;
  resumeFileName?: string;
  sessionId?: UUID;
  createdAt: string;
  updatedAt: string;
}
```

### Session
```typescript
{
  id: UUID;
  candidateId: UUID;
  questions: Question[];
  currentIndex: number;
  answers: Answer[];
  status: 'in_progress' | 'completed' | 'paused';
  questionStartTime?: string;
  finalScore?: number;
  finalSummary?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Question
```typescript
{
  id: UUID;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimitSec: number;
  rubric?: string;
  gradingHints?: string;
}
```

### Answer
```typescript
{
  id: UUID;
  questionId: UUID;
  text: string;
  startTime: string;
  submitTime: string;
  durationSec: number;
  autoSubmitted: boolean;
  recordingBlobId?: string;
  llmScore?: number;
  llmFeedback?: string;
}
```

## Key Features Explained

### Resume Parsing
- Uses `pdfjs-dist` for PDF extraction and `mammoth` for DOCX
- Regex-based extraction for email and phone numbers
- Heuristic name detection from first clean lines
- Fallback to manual collection if extraction fails

### Timer System
- Stores absolute `questionStartTime` as ISO string
- Calculates remaining time on every tick: `remaining = timeLimit - (now - startTime)`
- Survives page refresh/close by recalculating from stored timestamp
- Auto-submits when remaining time reaches 0

### Media Recording
- Requests camera/microphone permission per question
- Uses `MediaRecorder` API to capture video/audio
- Stores blobs in IndexedDB with unique IDs
- Displays live preview during recording
- Allows playback in interviewer dashboard

### AI Integration
- Generates unique questions per session using Hugging Face models
- Grades answers with 0-10 score and detailed feedback
- Creates final summary after all questions completed
- Includes fallback scoring if API calls fail
- Uses template-based question generation for reliability

### Persistence
- Redux state persisted to IndexedDB via redux-persist
- Separate IndexedDB stores for blobs and settings
- Automatic rehydration on app mount
- "Welcome Back" modal for unfinished sessions

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 14.3+)
- **MediaRecorder**: Requires modern browser with WebRTC support

## Privacy & Security

⚠️ **Important Notes**:

1. **API Keys**: Should be stored securely using environment variables
2. **Authentication**: Implement proper server-side authentication for production
3. **Data Storage**: All data stored locally in browser IndexedDB
4. **Recordings**: Stored locally with user consent
5. **HTTPS**: Required for camera/microphone access
6. **Data Export**: Consider implementing data backup and export features

### Security Best Practices

- Use environment variables for sensitive configuration
- Implement rate limiting for API calls
- Add proper authentication and authorization
- Encrypt sensitive data at rest
- Implement audit logging for admin actions
- Regular security audits and updates

## Troubleshooting

### Common Issues

**Resume Upload Issues**:
- Ensure file is PDF or DOCX format (max 10MB)
- File must contain actual text (not scanned images)
- Minimum 20 characters of content required
- Check browser console (F12) for detailed errors

**Interview Not Starting / API Key Errors**:
- **Error: "API key not configured"**: 
  - Click Settings button and enter your Hugging Face API key
  - OR create a `.env` file with `VITE_HUGGINGFACE_API_KEY=your_key`
  - Get a free token from https://huggingface.co/settings/tokens
- **Error: "Failed to grade answer"**: Usually means API key is missing or invalid
- Check internet connection
- Ensure you haven't exceeded API rate limits (Hugging Face free tier limits)
- Try refreshing the page and re-entering the API key

**Camera/Microphone Issues**:
- Grant browser permissions when prompted
- Ensure HTTPS or localhost (required for media access)
- Close other apps using camera/microphone
- Try a different browser (Chrome/Edge recommended)

**Data Extraction Problems**:
- Place contact info at top of resume
- Use standard formats for email/phone
- Ensure clear section headers (Skills, Projects, etc.)
- You can manually enter missing information

**Performance Issues**:
- Close unnecessary browser tabs
- Clear browser cache
- Disable browser extensions temporarily
- Check system meets minimum requirements

### Debug Mode

Open browser console (F12) to view detailed logs:
- Resume parsing progress
- API calls and responses
- Question generation steps
- Field extraction results

## 🚀 Deployment

### Quick Deploy Options

**Vercel (Recommended)**:
1. Push code to GitHub
2. Import repository in [Vercel](https://vercel.com)
3. Deploy with zero configuration
4. Live in 2 minutes!

**Netlify**:
1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Deploy automatically

**GitHub Pages**:
1. Install: `npm install --save-dev gh-pages`
2. Add deploy script to package.json
3. Run: `npm run deploy`
4. Enable Pages in repository settings

### Pre-Deployment Checklist

- ✅ All code committed and pushed
- ✅ `npm run build` works without errors
- ✅ Environment variables configured
- ✅ No sensitive data in code
- ✅ TypeScript errors fixed
- ✅ Application tested locally

## 📊 Recent Improvements

### Enhanced PDF Extraction
- **Better name extraction** with multiple strategies
- **Improved phone extraction** supporting international formats
- **Enhanced email filtering** to avoid placeholders
- **More robust parsing** with better error handling

### Comprehensive Error Handling
- **Retry mechanisms** for question generation and grading
- **Fallback questions** if API fails
- **Graceful degradation** with default scores
- **User notifications** for all error states

### Beautiful Completion Screen
- **Personalized greetings** based on score
- **Color-coded results** (green/blue/orange/red)
- **Detailed performance summary** with AI feedback
- **Professional presentation** with next steps

### Admin Dashboard Features
- **Submission tracking** with date and time
- **Recent submissions widget** showing last 5 interviews
- **Enhanced candidate details** with timestamps
- **Better organization** with sortable columns

### Interview Flow Improvements
- **No interruptions** - fixed modal pop-ups during interview
- **Smooth progression** - all stages transition properly
- **Clear feedback** - users always know what's happening
- **Data preservation** - all answers saved even during errors

## 🎯 Key Features

### For Candidates
- ✅ **Easy Resume Upload**: PDF/DOCX support with smart extraction
- ✅ **Preparation Time**: 15-30 seconds per question based on difficulty
- ✅ **Multiple Input Methods**: Type, speak, or do both
- ✅ **Real-time Feedback**: Instant grading with detailed feedback
- ✅ **Professional Results**: Beautiful completion screen with score

### For Administrators
- ✅ **Complete Dashboard**: View all candidates and interviews
- ✅ **Submission Tracking**: See exactly when interviews were completed
- ✅ **Recent Activity**: Quick view of latest submissions
- ✅ **Detailed Analytics**: Score distributions and pass rates
- ✅ **Interview Transcripts**: Full Q&A with recordings

### Technical Highlights
- ✅ **Resilient Architecture**: Multiple fallback mechanisms
- ✅ **Local Storage**: All data in IndexedDB for privacy
- ✅ **Session Recovery**: Resume interrupted interviews
- ✅ **Type-Safe**: Full TypeScript implementation
- ✅ **Modern UI**: Ant Design components with custom styling

## 🛠️ System Requirements

- **Browser**: Chrome 90+, Edge 90+, Firefox 88+, Safari 14.3+
- **Internet**: Stable connection required for AI features
- **Storage**: 50MB+ available for recordings
- **RAM**: 2GB+ recommended
- **Node.js**: 18+ for development

## Future Enhancements

- [ ] Server-side API for secure key storage
- [ ] Real-time collaboration (multiple interviewers)
- [ ] Export interview data to PDF/CSV
- [ ] Custom question banks
- [ ] Multi-language support
- [ ] Video analysis (facial expressions, confidence)
- [ ] Integration with ATS systems
- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review browser console for detailed logs

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Powered by [Hugging Face](https://huggingface.co/)
- UI components from [Ant Design](https://ant.design/)
- State management with [Redux Toolkit](https://redux-toolkit.js.org/)

---

**Built with ❤️ using React, TypeScript, and AI**

*Last Updated: October 2025*
