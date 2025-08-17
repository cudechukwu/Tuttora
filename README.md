# Tutto Passa - Peer-to-Peer Academic Assistance Platform

A comprehensive web application connecting university students for peer-to-peer academic assistance with real-time communication, interactive tools, and gamification features.

## 🚀 **Phase 1.4: Interactive Tools - COMPLETED!**

### ✨ **New Features Added:**

#### 🎨 **Interactive Whiteboard**
- Real-time collaborative drawing and sketching
- Multiple colors and brush sizes
- Pen and eraser tools
- Live synchronization across all session participants
- Perfect for math problems, diagrams, and visual explanations

#### 📁 **File Sharing System**
- Drag & drop file upload interface
- Support for multiple file types (PDF, images, documents, code files)
- Real-time file sharing notifications
- File management with download and delete options
- Visual file type indicators

#### 💻 **Code Editor**
- Multi-language support (JavaScript, TypeScript, Python, Java, C++, HTML, CSS, SQL)
- Real-time collaborative coding
- Multiple themes (Light, Dark, Monokai)
- Adjustable font sizes
- Code formatting and execution capabilities
- Language-specific tips and hints

#### 🎥 **Session Recorder**
- Audio, video, and screen recording capabilities
- Pause/resume functionality
- Recording history management
- Automatic file download when stopped
- Real-time recording status notifications

### 🔧 **Technical Implementation:**
- **Frontend**: React components with TypeScript
- **Backend**: WebSocket integration for real-time collaboration
- **Real-time Features**: Live drawing, file sharing, code editing, and recording notifications
- **UI/UX**: Modern, responsive design with intuitive controls

### 🌐 **Access the Interactive Tools:**
1. **Login** to your account at `http://localhost:3001`
2. **Navigate** to the Interactive Tools page via dashboard or direct URL
3. **Choose** your preferred tool from the tabbed interface
4. **Start collaborating** in real-time!

---

## 📋 **Project Overview**

### **Core Features:**
- 🔐 **Authentication System** - JWT-based login/registration
- 👥 **Role Management** - Student (Rookie) and Tutor roles
- 🔍 **Real-time Matching** - Find available tutors by course
- 💬 **Live Chat** - WebSocket-powered messaging
- 🎨 **Interactive Tools** - Whiteboard, file sharing, code editor, recording
- 🏆 **Gamification** - Points, badges, leaderboards (coming next)
- 📅 **Session Management** - Start/end tutoring sessions
- 🎯 **Academic Integrity** - Monitoring and reporting

### **Technology Stack:**
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO for WebSocket communication
- **Authentication**: JWT tokens with refresh mechanism
- **State Management**: React Context + Zustand

### **Architecture:**
- **Monorepo Structure** - Shared packages and configurations
- **API-First Design** - RESTful endpoints with WebSocket events
- **Real-time Communication** - Live updates across all features
- **Responsive Design** - Mobile-first approach
- **Type Safety** - Full TypeScript implementation

## 🚀 **Getting Started**

### **Prerequisites:**
- Node.js 18+ and npm
- PostgreSQL database
- Git

### **Installation:**
```bash
# Clone the repository
git clone <repository-url>
cd TuttoPassa-WebApp

# Install dependencies
npm install

# Set up environment variables
cp backend/env.example backend/.env
# Edit backend/.env with your database credentials

# Set up database
cd backend
npx prisma generate
npx prisma db push
npm run seed

# Start development servers
cd ..
npm run dev
```

### **Access Points:**
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5001
- **Health Check**: http://localhost:5001/health
- **Interactive Tools**: http://localhost:3001/interactive-tools

## 📊 **Current Status**

### ✅ **Completed Phases:**
- **Phase 1.1**: Project Setup & Architecture
- **Phase 1.2**: User Management System
- **Phase 1.3**: Real-time Communication System
- **Phase 1.4**: Interactive Tools

### 🔄 **Next Phase:**
- **Phase 1.5**: Gamification System (Points, Badges, Leaderboards)

## 🎯 **Key Features Demo**

### **Interactive Tools Showcase:**
1. **Whiteboard**: Draw mathematical equations, diagrams, and sketches
2. **File Sharing**: Upload and share study materials instantly
3. **Code Editor**: Collaborate on programming assignments
4. **Session Recorder**: Record tutoring sessions for later review

### **Real-time Collaboration:**
- Multiple users can draw simultaneously on the whiteboard
- File uploads are instantly visible to all participants
- Code changes are synchronized in real-time
- Recording status is broadcast to all session members

## 🔧 **Development**

### **Available Scripts:**
```bash
npm run dev          # Start both frontend and backend
npm run dev:frontend # Start only frontend
npm run dev:backend  # Start only backend
npm run build        # Build for production
npm run test         # Run tests
```

### **Database Management:**
```bash
cd backend
npx prisma studio    # Open database GUI
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes
npx prisma db seed   # Seed database
```

## 🤝 **Contributing**

This project is actively developed. Contributions are welcome!

### **Development Guidelines:**
- Follow TypeScript best practices
- Use conventional commit messages
- Test features thoroughly
- Maintain responsive design
- Document new features

## 📝 **License**

This project is licensed under the MIT License.

---

**🎉 Phase 1.4 Interactive Tools is now complete! The platform now offers a comprehensive suite of collaborative tools for enhanced tutoring experiences.** 