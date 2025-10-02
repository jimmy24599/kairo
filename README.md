# Kairo - AI-Powered Web App Builder

**Turn any idea into a working web app with AI.** Kairo is an intelligent AI agent platform that understands your project context and generates complete, production-ready applications from natural language descriptions.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Kairo is a sophisticated AI-powered platform that combines natural language processing with intelligent code generation to create full-stack web applications. The system features a modern React frontend with a Node.js backend that orchestrates AI agents capable of understanding project context, generating code, and managing complex development workflows.

### Core Capabilities
- **Intelligent Code Generation**: AI agents that understand your existing codebase and generate contextually appropriate code
- **Real-time Collaboration**: WebSocket-based communication for live updates and progress tracking
- **Project Management**: Complete project lifecycle management from creation to deployment
- **Context Awareness**: Deep understanding of project structure, dependencies, and patterns
- **Multi-language Support**: TypeScript, JavaScript, and other modern web technologies

## ✨ Key Features

### 🤖 AI Agent System
- **Context-Aware Generation**: AI agents analyze your existing project structure before making changes
- **Intelligent Task Planning**: Breaks down complex requests into manageable, executable tasks
- **Error Prevention**: 90% fewer errors through intelligent code analysis and validation
- **Multi-file Operations**: Seamlessly handles complex refactoring across multiple files
- **Dependency Tracking**: Automatically manages imports, exports, and dependencies

### 🎨 Modern Frontend
- **Interactive UI**: Beautiful, responsive interface built with Next.js 14 and Tailwind CSS
- **Real-time Updates**: Live progress tracking with WebSocket connections
- **Code Editor Integration**: Monaco Editor for syntax highlighting and code editing
- **File Explorer**: Visual project structure navigation
- **Terminal Integration**: Built-in terminal for command execution

### 🔧 Backend Infrastructure
- **Express.js Server**: Robust API server with WebSocket support
- **MongoDB Integration**: Persistent storage for projects, chats, and user data
- **AI Service Integration**: OpenAI/OpenRouter API integration for intelligent code generation
- **File System Management**: Comprehensive file operations and project management
- **Real-time Communication**: WebSocket server for live updates

### 🛠 Development Tools
- **AST Analysis**: Advanced code analysis using Babel and TypeScript compiler
- **Code Refactoring**: Intelligent code transformation and optimization
- **Dependency Management**: Automatic package installation and management
- **Build System Integration**: Support for various build tools and frameworks
- **Testing Framework**: Built-in testing capabilities

### 🔧 AI Agent Tools System
Kairo features a comprehensive suite of specialized tools that enable the AI agent to perform complex development tasks:

#### **File Operations Tool** (`fileOperations.js`)
- **File Management**: Create, read, write, delete, and rename files
- **Stream Operations**: Handle large files with streaming capabilities
- **File Permissions**: Manage file permissions and attributes
- **Patch Application**: Apply code patches and diffs
- **File Statistics**: Get detailed file information and metadata

#### **AST Refactoring Tool** (`astRefactoring.js`)
- **Code Parsing**: Parse JavaScript/TypeScript code into Abstract Syntax Trees
- **Symbol Refactoring**: Rename variables, functions, and classes across files
- **Method Extraction**: Extract code blocks into new functions
- **Function Inlining**: Inline function calls to reduce complexity
- **Import Management**: Organize and update import statements
- **TypeScript Support**: Full TypeScript language service integration
- **Codemod Application**: Apply automated code transformations

#### **Semantic Search Tool** (`semanticSearch.js`)
- **Code Understanding**: Generate embeddings for code comprehension
- **Similarity Search**: Find similar code patterns across the project
- **Context-Aware Search**: Search based on semantic meaning, not just text
- **Intelligent Indexing**: Build searchable indexes of codebase
- **Cross-File Analysis**: Understand relationships between different files

#### **Search & Navigation Tool** (`searchNavigation.js`)
- **Symbol Finding**: Locate function, class, and variable definitions
- **Reference Tracking**: Find all references to symbols
- **Code Outline**: Generate hierarchical code structure
- **Cross-Reference Analysis**: Understand code dependencies
- **Intelligent Search**: Context-aware code search capabilities

#### **Dependency Management Tool** (`dependencyManagement.js`)
- **Package Analysis**: Analyze project dependencies and versions
- **Version Management**: Check for updates and manage versions
- **Dependency Tree**: Visualize dependency relationships
- **Security Audits**: Check for vulnerable dependencies
- **Lock File Management**: Handle package-lock.json and yarn.lock

#### **Terminal System Tool** (`terminalSystem.js`)
- **Command Execution**: Run shell commands safely
- **Process Management**: Start, stop, and monitor processes
- **Package Installation**: Install npm/yarn packages
- **Build Execution**: Run build scripts and commands
- **Streaming Output**: Real-time command output streaming

#### **Automated Testing Tool** (`automatedTesting.js`)
- **Test Framework Detection**: Auto-detect Jest, Mocha, pytest, etc.
- **Test Execution**: Run tests with coverage reporting
- **Linting Integration**: Run ESLint, Prettier, and other linters
- **Build Validation**: Test build processes
- **Type Checking**: Run TypeScript type checking
- **Performance Testing**: Execute performance benchmarks

#### **Safe Sandbox Tool** (`safeSandbox.js`)
- **Path Validation**: Ensure file operations stay within project bounds
- **Content Validation**: Validate file content for safety
- **Command Validation**: Sanitize and validate shell commands
- **Security Enforcement**: Prevent access to system files
- **Resource Limits**: Enforce file size and operation limits

#### **Session Memory Tool** (`sessionMemory.js`)
- **Edit History**: Track all code changes and modifications
- **Patch Management**: Store and manage code patches
- **Reasoning Logs**: Record AI decision-making process
- **Rollback Capability**: Undo changes and restore previous states
- **Session Summaries**: Generate summaries of development sessions

## 🏗 Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Services   │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (OpenAI)      │
│                 │    │                 │    │                 │
│ • React UI      │    │ • Express API   │    │ • GPT-4         │
│ • WebSocket     │    │ • WebSocket     │    │ • Code Analysis │
│ • Monaco Editor │    │ • MongoDB       │    │ • Task Planning │
│ • File Explorer │    │ • File System   │    │ • Code Gen      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. **User Input**: Natural language description of desired application
2. **Context Analysis**: AI agent analyzes existing project structure
3. **Task Planning**: Breaks down request into executable tasks
4. **Code Generation**: AI generates contextually appropriate code
5. **File Operations**: Backend manages file creation and modification
6. **Real-time Updates**: Frontend receives live progress updates
7. **Validation**: Code validation and error checking
8. **Deployment**: Ready-to-deploy application

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Monaco Editor** - Code editing capabilities
- **Socket.io Client** - Real-time communication
- **Zustand** - State management
- **Lucide React** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **WebSocket** - Real-time communication
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **OpenAI API** - AI services
- **Babel** - JavaScript compiler
- **TypeScript Compiler** - Type checking

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 🚀 Installation

### Prerequisites
- Node.js 18.0 or later
- MongoDB (local or cloud)
- OpenAI API key or OpenRouter API key

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/kairo.git
   cd kairo
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Set up environment variables**
   ```bash
   # Frontend (.env.local)
   NEXT_PUBLIC_WS_URL=ws://localhost:3001
   
   # Backend (.env)
   OPENROUTER_API_KEY=your_openrouter_api_key
   MONGODB_URI=mongodb://localhost:27017/kairo
   PROJECT_ROOT=/path/to/your/projects
   PORT=3001
   ```

5. **Start the development servers**
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm run dev
   
   # Terminal 2: Start frontend
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 💻 Usage

### Basic Workflow

1. **Launch Kairo**: Open the web interface
2. **Describe Your App**: Enter a natural language description
3. **AI Analysis**: The system analyzes your request and project context
4. **Code Generation**: AI generates the complete application
5. **Review & Customize**: Use the built-in editor to modify code
6. **Deploy**: Export and deploy your application

### Example Prompts

```
"Build a todo app with user authentication and database storage"
"Create a landing page for my startup with contact form"
"Make a dashboard for tracking sales data with charts"
"Build an e-commerce site with Stripe payments and inventory management"
"Create a blog platform with markdown support and comments"
```

### Agent Mode Features

- **Chat Interface**: Natural language interaction with AI
- **Code Editor**: Real-time code editing with syntax highlighting
- **File Explorer**: Visual project structure navigation
- **Terminal**: Command execution and package management
- **Progress Tracking**: Real-time updates on generation progress

## 📚 API Documentation

### WebSocket Events

#### Client to Server
```javascript
// Process a new request
{
  "action": "process_request",
  "userInput": "Build a todo app",
  "projectName": "my-todo-app",
  "chatId": "chat_123"
}

// Get available projects
{
  "action": "get_projects"
}

// Get project files
{
  "action": "get_project_files",
  "projectName": "my-todo-app"
}

// Get file content
{
  "action": "get_file_content",
  "projectName": "my-todo-app",
  "filePath": "app/page.tsx"
}

// Save file
{
  "action": "save_file",
  "projectName": "my-todo-app",
  "filePath": "app/page.tsx",
  "content": "// Updated file content"
}

// Stop agent
{
  "action": "stop_agent"
}
```

#### Server to Client
```javascript
// Start message
{
  "type": "start",
  "message": "Starting agent process..."
}

// Progress update
{
  "type": "progress",
  "message": "Generating components...",
  "progress": 45
}

// Task completion
{
  "type": "task_complete",
  "taskId": "task_123",
  "message": "Component generated successfully"
}

// Final result
{
  "type": "result",
  "message": "Request completed successfully",
  "result": {
    "success": true,
    "filesCreated": ["app/page.tsx", "components/Todo.tsx"],
    "filesModified": ["package.json"]
  }
}

// Error message
{
  "type": "error",
  "message": "Error processing request: Invalid input"
}
```

### REST API Endpoints

#### Health Check
```http
GET /api/health
```

#### Chat Management
```http
GET /api/chats
POST /api/chats
GET /api/chats/:id
PUT /api/chats/:id
DELETE /api/chats/:id
```

#### Message Management
```http
GET /api/messages
POST /api/messages
GET /api/messages/:id
PUT /api/messages/:id
DELETE /api/messages/:id
```

#### Todo Management
```http
GET /api/todos
POST /api/todos
GET /api/todos/:id
PUT /api/todos/:id
DELETE /api/todos/:id
```

#### Subtask Management
```http
GET /api/subtasks
POST /api/subtasks
GET /api/subtasks/:id
PUT /api/subtasks/:id
DELETE /api/subtasks/:id
```

## 📁 Project Structure

```
kairo/
├── app/                          # Next.js app directory
│   ├── about/                    # About page
│   ├── agent/                    # Agent interface
│   ├── api/                      # API routes
│   │   ├── agent/                # Agent API endpoints
│   │   ├── dev-server/           # Development server management
│   │   └── projects/             # Project management API
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
├── backend/                      # Node.js backend
│   ├── config/                   # Configuration files
│   │   └── database.js           # MongoDB connection
│   ├── lib/                      # Backend libraries
│   │   └── agent/                # AI agent implementation
│   ├── models/                   # MongoDB models
│   │   ├── Chat.js               # Chat model
│   │   ├── Message.js            # Message model
│   │   ├── Subtask.js            # Subtask model
│   │   └── Todo.js               # Todo model
│   ├── routes/                   # Express routes
│   │   ├── chats.js              # Chat routes
│   │   ├── messages.js           # Message routes
│   │   ├── subtasks.js           # Subtask routes
│   │   └── todos.js              # Todo routes
│   ├── tools/                    # AI agent tools
│   │   ├── index.js              # Tools orchestration and API
│   │   ├── astRefactoring.js     # AST-based refactoring engine
│   │   ├── automatedTesting.js   # Testing automation framework
│   │   ├── dependencyManagement.js # Package management system
│   │   ├── fileOperations.js     # File system operations
│   │   ├── safeSandbox.js        # Security and sandboxing
│   │   ├── searchNavigation.js   # Code search and navigation
│   │   ├── semanticSearch.js     # Semantic code search
│   │   ├── sessionMemory.js      # Session management and history
│   │   └── terminalSystem.js     # Terminal operations and process management
│   ├── agent.js                  # Main AI agent
│   ├── agent_new.js              # Enhanced AI agent
│   └── server.js                 # Express server
├── components/                   # React components
│   ├── AgentMode.tsx             # Main agent interface
│   ├── AgentTasks.tsx            # Task management
│   ├── ChatInput.tsx             # Chat input component
│   ├── ChatTabs.tsx              # Chat tab management
│   ├── CodeEditor.tsx            # Monaco code editor
│   ├── FileExplorer.tsx          # File tree explorer
│   ├── Header.tsx                # Navigation header
│   ├── Hero.tsx                  # Landing hero section
│   ├── MessagesContainer.tsx     # Message display
│   ├── TerminalPanel.tsx         # Terminal interface
│   └── ui/                       # UI components
│       └── button.tsx            # Button component
├── lib/                          # Frontend libraries
│   ├── agent/                    # Frontend agent logic
│   │   ├── aiService.ts          # AI service client
│   │   ├── capacityAgent.ts      # Capacity agent
│   │   ├── fileSystem.ts         # File system operations
│   │   ├── taskExecutor.ts       # Task execution
│   │   ├── taskManager.ts        # Task management
│   │   └── types.ts              # TypeScript types
│   └── websocketClient.ts        # WebSocket client
├── public/                       # Static assets
│   ├── assets/                   # Images and icons
│   └── hero.webp                 # Hero background
├── package.json                  # Frontend dependencies
├── tailwind.config.js            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## 🔧 Development

### Available Scripts

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

#### Backend
```bash
cd backend
npm run dev          # Start development server with nodemon
npm start            # Start production server
```

### Development Workflow

1. **Feature Development**
   - Create feature branch from `main`
   - Implement changes with proper TypeScript types
   - Add tests for new functionality
   - Update documentation

2. **AI Agent Development**
   - Modify agent logic in `backend/agent_new.js`
   - Update tools in `backend/tools/`
   - Test with various project types
   - Validate code generation quality

3. **Frontend Development**
   - Add new components in `components/`
   - Update UI/UX in `app/` directory
   - Implement new features in `lib/`
   - Test WebSocket communication

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent code formatting
- **Testing**: Unit and integration tests
- **Documentation**: Comprehensive code documentation

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Environment Variables**
   ```bash
   NEXT_PUBLIC_WS_URL=wss://your-backend-url.com
   ```

### Backend Deployment (Railway/Heroku)

1. **Prepare for Deployment**
   ```bash
   cd backend
   npm install --production
   ```

2. **Environment Variables**
   ```bash
   OPENROUTER_API_KEY=your_api_key
   MONGODB_URI=your_mongodb_uri
   PROJECT_ROOT=/app/projects
   PORT=3001
   NODE_ENV=production
   ```

3. **Deploy**
   ```bash
   # Railway
   railway deploy
   
   # Heroku
   git push heroku main
   ```

### Docker Deployment

1. **Frontend Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Backend Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 3001
   CMD ["npm", "start"]
   ```

3. **Docker Compose**
   ```yaml
   version: '3.8'
   services:
     frontend:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NEXT_PUBLIC_WS_URL=ws://backend:3001
     
     backend:
       build: ./backend
       ports:
         - "3001:3001"
       environment:
         - MONGODB_URI=mongodb://mongo:27017/kairo
         - OPENROUTER_API_KEY=your_api_key
     
     mongo:
       image: mongo:latest
       ports:
         - "27017:27017"
   ```

## 🤝 Contributing

### Getting Started

1. **Fork the Repository**
   ```bash
   git clone https://github.com/yourusername/kairo.git
   cd kairo
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Changes**
   - Follow TypeScript best practices
   - Add tests for new functionality
   - Update documentation

4. **Commit Changes**
   ```bash
   git commit -m "Add amazing feature"
   ```

5. **Push to Branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open Pull Request**

### Contribution Guidelines

- **Code Style**: Follow existing code patterns
- **Testing**: Add tests for new features
- **Documentation**: Update README and code comments
- **Performance**: Consider performance implications
- **Security**: Follow security best practices

### Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

2. **Set Up Environment**
   ```bash
   cp .env.example .env.local
   cp backend/.env.example backend/.env
   ```

3. **Start Development**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend
   npm run dev
   ```


## 🎯 Roadmap

### Phase 1: Core Features ✅
- [x] Basic AI agent implementation
- [x] WebSocket communication
- [x] File system operations
- [x] Code generation
- [x] Project management

### Phase 2: Enhanced AI (In Progress)
- [x] Advanced context understanding with semantic search
- [x] Intelligent error handling with AST analysis
- [x] Code optimization with refactoring tools
- [x] Performance monitoring with testing framework
- [ ] Multi-agent collaboration
- [ ] Enhanced security with sandbox improvements

### Phase 3: Platform Features (In Progress)
- [x] User authentication
- [ ] Project sharing
- [ ] Team collaboration
- [ ] Version control integration
- [ ] Deployment automation

### Phase 4: Enterprise Features (Future)
- [ ] Custom AI models
- [ ] Advanced analytics
- [ ] Enterprise security
- [ ] API marketplace
- [ ] White-label solutions

## 🙏 Acknowledgments

- **OpenAI** - For providing the AI capabilities
- **Next.js Team** - For the amazing React framework
- **MongoDB** - For the database solution
- **Vercel** - For deployment platform
- **Community** - For feedback and contributions

---

**Built by Ahmed Gamil**

*Turn any idea into a working web app with AI.*
