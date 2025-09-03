# ChrisPrograms - Programming, Gaming & Development Hub

A comprehensive full-stack platform for developers and gamers, featuring programming resources, compressed games, development tools, and community features.

## Features

### 🚀 Programming Resources
- **Development Tools**: Visual Studio Code, GitHub Desktop, Python, Node.js
- **Learning Resources**: JavaScript frameworks, database systems, API development
- **Code Sharing**: Upload and share programming projects with the community

### 🎮 Gaming Hub
- **Compressed Games**: Safe downloads from trusted partner sites
- **Gaming Resources**: Game trailers, reviews, and community discussions
- **File Sharing**: Upload and download gaming content

### 💬 AI Assistant
- **Chris AI**: Intelligent assistant for programming and gaming questions
- **Real-time Chat**: Get instant help with coding, debugging, and tech support
- **Community Support**: Connect with fellow developers and gamers

### 🔐 User System
- **Authentication**: Secure user registration and login
- **File Management**: Personal file uploads and downloads
- **Admin Panel**: Administrative controls for site management

## Technology Stack

### Frontend
- **HTML5/CSS3**: Modern responsive design with animations
- **Vanilla JavaScript**: Interactive features and API integration
- **Progressive Web App**: Mobile-friendly experience

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **JWT**: Authentication tokens
- **Multer**: File upload handling

### Database & Storage
- **Supabase**: PostgreSQL database with real-time features
- **Row Level Security**: Secure data access policies
- **Cloud Storage**: File hosting and management

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=http://localhost:3001
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

### Database Setup
The application uses Supabase with the following tables:
- `users` - User accounts and authentication
- `files` - File uploads and metadata
- `chat_messages` - AI chat conversations

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Files
- `POST /api/files/upload` - Upload files
- `GET /api/files` - List all public files
- `GET /api/files/:id/download` - Download file
- `DELETE /api/files/:id` - Delete file (admin)

### Chat
- `GET /api/chat/messages` - Get chat history
- `POST /api/chat/messages` - Send message
- `DELETE /api/chat/messages/:id` - Delete message

### Admin
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - List all users
- `DELETE /api/admin/users/:id` - Delete user

## Features

### Programming Tools
- Visual Studio Code integration
- GitHub Desktop workflows
- Python development resources
- JavaScript framework guides
- Database development tutorials
- API development best practices

### Gaming Resources
- Compressed Game Hub partnership
- All Type Hacks integration
- Ocean of Compressed games
- Safe download verification
- Gaming community features

### Community Features
- Developer groups and collaboration
- Code project sharing
- Gaming discussions
- Technical support chat
- Resource recommendations

## Security

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure authentication
- **Row Level Security**: Database-level access control
- **File Validation**: Upload security and type checking
- **Admin Controls**: Restricted administrative functions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Contact

- **Email**: chrisprograms2011@gmail.com
- **Phone**: +250 796837967, +250 732744523
- **YouTube**: [@M.Chris.T](https://www.youtube.com/@M.Chris.T), [@CHRIS-c7y2v](https://www.youtube.com/@CHRIS-c7y2v)
- **Instagram**: [@m.chris.t2011](https://www.instagram.com/m.chris.t2011/), [@i_c_chris250](https://www.instagram.com/i_c_chris250/)

## License

© 2025 ChrisPrograms. All rights reserved.

---

**ChrisPrograms** - Your trusted programming, gaming, and development resource hub.