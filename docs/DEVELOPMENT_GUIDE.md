# MeetingScribe AI - Development Guide

## Getting Started

This guide will help you set up a development environment for MeetingScribe AI and contribute to the project.

## Prerequisites

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Package manager
- **Git** - Version control
- **Ollama** - Local AI platform - [Download](https://ollama.ai/download)

### Optional but Recommended
- **Docker** - For containerized development
- **VS Code** - Recommended IDE with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/chartmann1590/Meeting-Notes-App.git
cd Meeting-Notes-App
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up AI Services

#### Option A: Automated Setup (Recommended)
```bash
# Linux/macOS
./setup.sh

# Windows
setup.bat
```

#### Option B: Manual Setup
```bash
# Start Ollama service
ollama serve

# Download required models (in a new terminal)
ollama pull whisper
ollama pull llama3.2:3b
```

### 4. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # Frontend only (port 3000)
npm run dev:backend   # Backend only (port 3001)
```

## Project Structure

```
├── src/                           # Frontend React application
│   ├── components/                # React components
│   │   ├── ui/                   # shadcn/ui components (auto-generated)
│   │   ├── AudioVisualizer.tsx   # Audio visualization component
│   │   ├── ErrorBoundary.tsx     # Error handling components
│   │   ├── Layout.tsx            # Main layout component
│   │   └── ThemeToggle.tsx       # Theme switching component
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-meeting-store.ts  # Meeting state management (Zustand)
│   │   ├── use-mobile.tsx        # Mobile detection hook
│   │   └── use-theme.ts          # Theme management hook
│   ├── lib/                      # Utility functions
│   │   ├── api.ts                # API client functions
│   │   ├── chat.ts               # Chat/meeting logic
│   │   ├── real-transcriber.ts   # Audio transcription logic
│   │   └── utils.ts              # General utilities
│   ├── pages/                    # Page components
│   │   ├── DemoPage.tsx          # Demo/landing page
│   │   ├── HomePage.tsx          # Main meeting interface
│   │   ├── PastMeetingsPage.tsx  # Meeting history
│   │   └── SettingsPage.tsx      # Application settings
│   └── types/                    # TypeScript type definitions
├── server/                       # Backend Express.js server
│   ├── services/                 # AI service integrations
│   │   ├── ollama.ts             # Ollama LLM service
│   │   └── whisper.ts            # Whisper transcription service
│   ├── index.ts                  # Main server file
│   └── types.ts                  # Server type definitions
├── public/                       # Static assets
├── prompts/                      # Documentation and AI prompts
└── setup scripts                 # Automated setup scripts
```

## Development Workflow

### 1. Feature Development

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Follow the coding standards outlined below
   - Write tests for new functionality
   - Update documentation if needed

3. **Test your changes:**
   ```bash
   npm run lint        # Check code style
   npm run build       # Ensure build works
   node test-app.js    # Test API endpoints
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   ```

### 2. Code Standards

#### TypeScript
- Use strict TypeScript configuration
- Define proper interfaces for all data structures
- Use type guards and proper error handling
- Avoid `any` type - use proper typing

#### React Components
- Use functional components with hooks
- Implement proper error boundaries
- Use React.memo for performance optimization when needed
- Follow the single responsibility principle

#### Styling
- Use Tailwind CSS utility classes
- Leverage shadcn/ui components when possible
- Implement responsive design patterns
- Support both light and dark themes

#### File Naming
- Use PascalCase for React components: `MyComponent.tsx`
- Use camelCase for utilities: `myUtility.ts`
- Use kebab-case for directories: `my-directory`

### 3. Testing

#### Frontend Testing
```bash
# Run linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

#### Backend Testing
```bash
# Test API endpoints
node test-app.js

# Check server health
curl http://localhost:3001/api/health
```

#### Manual Testing
1. Start the development servers
2. Open http://localhost:3000
3. Test audio recording functionality
4. Verify transcription works
5. Check AI summarization
6. Test all UI interactions

## Adding New Features

### 1. Frontend Components

When adding new React components:

1. **Create the component file:**
   ```typescript
   // src/components/MyNewComponent.tsx
   import React from 'react';
   import { Button } from '@/components/ui/button';
   
   interface MyNewComponentProps {
     title: string;
     onAction: () => void;
   }
   
   export const MyNewComponent: React.FC<MyNewComponentProps> = ({
     title,
     onAction
   }) => {
     return (
       <div className="p-4">
         <h2 className="text-xl font-semibold">{title}</h2>
         <Button onClick={onAction}>Action</Button>
       </div>
     );
   };
   ```

2. **Add to the appropriate page:**
   ```typescript
   import { MyNewComponent } from '@/components/MyNewComponent';
   ```

### 2. Backend API Endpoints

When adding new API endpoints:

1. **Add the route in `server/index.ts`:**
   ```typescript
   app.post('/api/my-endpoint', async (req, res) => {
     try {
       // Your logic here
       res.json({ success: true, data: result });
     } catch (error) {
       res.status(500).json({ 
         success: false, 
         error: 'Error message' 
       });
     }
   });
   ```

2. **Add TypeScript types in `server/types.ts`:**
   ```typescript
   export interface MyEndpointRequest {
     param1: string;
     param2: number;
   }
   
   export interface MyEndpointResponse {
     success: boolean;
     data?: any;
     error?: string;
   }
   ```

### 3. AI Service Integration

When adding new AI services:

1. **Create service file in `server/services/`:**
   ```typescript
   // server/services/my-ai-service.ts
   export class MyAIService {
     async processData(input: string): Promise<string> {
       // Your AI service logic
     }
   }
   ```

2. **Import and use in your endpoints:**
   ```typescript
   import { MyAIService } from './services/my-ai-service';
   
   const aiService = new MyAIService();
   ```

## Environment Configuration

### Development Environment Variables

Create a `.env.local` file for local development:

```bash
# AI Model Configuration
WHISPER_MODEL=whisper
OLLAMA_MODEL=llama3.2:3b
OLLAMA_API_URL=http://localhost:11434/api/generate

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend Configuration
VITE_API_URL=http://localhost:3001
```

### Production Environment Variables

For production deployment:

```bash
# AI Model Configuration
WHISPER_MODEL=whisper
OLLAMA_MODEL=llama3.2:3b
OLLAMA_API_URL=http://ollama:11434/api/generate

# Server Configuration
PORT=3001
NODE_ENV=production

# Frontend Configuration
VITE_API_URL=http://localhost:3001
```

## Debugging

### Frontend Debugging

1. **Use React Developer Tools:**
   - Install the browser extension
   - Inspect component state and props
   - Monitor re-renders

2. **Console Logging:**
   ```typescript
   console.log('Debug info:', data);
   ```

3. **Error Boundaries:**
   - Check the ErrorBoundary component
   - Monitor error logs in the console

### Backend Debugging

1. **Server Logs:**
   ```bash
   npm run dev:backend
   # Watch console output for errors
   ```

2. **API Testing:**
   ```bash
   # Test individual endpoints
   curl -X POST http://localhost:3001/api/transcribe \
     -F "audio=@test.wav"
   ```

3. **Ollama Service:**
   ```bash
   # Check if Ollama is running
   curl http://localhost:11434/api/tags
   
   # Check available models
   ollama list
   ```

## Performance Optimization

### Frontend Optimization

1. **Code Splitting:**
   ```typescript
   const LazyComponent = React.lazy(() => import('./LazyComponent'));
   ```

2. **Memoization:**
   ```typescript
   const MemoizedComponent = React.memo(MyComponent);
   ```

3. **Bundle Analysis:**
   ```bash
   npm run build
   # Analyze bundle size
   ```

### Backend Optimization

1. **Streaming Responses:**
   ```typescript
   res.writeHead(200, { 'Content-Type': 'application/json' });
   res.write(JSON.stringify({ status: 'processing' }));
   ```

2. **File Cleanup:**
   ```typescript
   // Clean up temporary files
   fs.unlinkSync(tempFilePath);
   ```

## Contributing Guidelines

### Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests if applicable**
5. **Update documentation**
6. **Submit a pull request**

### Commit Message Format

Use conventional commit messages:

```
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

### Code Review Checklist

- [ ] Code follows project standards
- [ ] Tests pass
- [ ] Documentation is updated
- [ ] No console errors
- [ ] Responsive design works
- [ ] Dark/light theme support
- [ ] Error handling implemented
- [ ] Performance considerations addressed

## Troubleshooting

### Common Development Issues

1. **"Module not found" errors:**
   ```bash
   npm install
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Ollama connection issues:**
   ```bash
   # Check if Ollama is running
   ollama serve
   
   # Check models
   ollama list
   ```

3. **Port conflicts:**
   ```bash
   # Kill processes on ports
   lsof -ti:3000 | xargs kill -9
   lsof -ti:3001 | xargs kill -9
   ```

4. **Build failures:**
   ```bash
   # Clear build cache
   npm run build -- --force
   ```

### Getting Help

- Check the [API Documentation](API_DOCUMENTATION.md)
- Review the [README](README.md) for setup instructions
- Look at existing issues on GitHub
- Create a new issue with detailed information

## Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d --build
```

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

For detailed deployment instructions, see the main [README](../README.md).