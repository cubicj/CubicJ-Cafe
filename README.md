# CubicJ Cafe

AI-powered Image-to-Video generation platform built for self-hosted deployment on Mini PC servers.

## Overview

CubicJ Cafe is a web application that transforms static images into dynamic videos using AI technology. The system integrates with ComfyUI for video generation and Discord for community sharing, designed to run efficiently on Mini PC hardware with Ubuntu Server and domain connectivity.

## Key Features

- **Image-to-Video Generation**: Convert static images to videos using advanced AI models
- **Discord Integration**: OAuth2 authentication and automatic result sharing
- **LoRA Preset System**: Customizable style presets with drag-and-drop management
- **Queue Management**: Real-time processing queue with user permissions
- **Admin Dashboard**: Comprehensive system monitoring and configuration
- **NSFW Content Handling**: Automatic content classification and routing
- **Multi-Server Support**: Local and cloud server integration (Runpod)

## Technology Stack

- **Frontend**: Next.js 15.4.6, React 19.1.0, TailwindCSS 4.0, Shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM, SQLite
- **Authentication**: Discord OAuth2 with custom session management  
- **AI Integration**: ComfyUI API, Wan 2.2 I2V models
- **Deployment**: PM2, Nginx, SSL certificates
- **Monitoring**: Winston logging, performance tracking

## System Requirements

- **Mini PC Server**: Ubuntu Server 20.04+ recommended
- **Node.js**: v22.17.0 or higher
- **ComfyUI Server**: Separate instance for AI processing
- **Domain**: Configured for HTTPS access
- **Discord Application**: For OAuth2 and bot integration

## Installation & Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd mini
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   - Configure `ecosystem.config.js` with your environment variables
   - Set up Discord OAuth2 application credentials
   - Configure ComfyUI server endpoints

4. **Database Setup**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Build & Deploy**
   ```bash
   npm run build
   npm run start
   ```

## Development

```bash
npm run dev     # Development server
npm run build   # Production build  
npm run lint    # Code linting
npm test        # Run tests
```

## Architecture

- **Standalone Deployment**: Next.js standalone mode for efficient server deployment
- **Session Management**: HttpOnly cookies with custom session handling
- **Real-time Updates**: WebSocket integration for live status monitoring
- **File Processing**: Automatic cleanup and optimization
- **Error Handling**: Comprehensive logging and error tracking

## Contributing

This project is designed for personal deployment and portfolio demonstration. For deployment inquiries or technical discussions, please open an issue.

## License

Private project for portfolio demonstration purposes.
