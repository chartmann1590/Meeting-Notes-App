# MeetingScribe AI - Documentation Index

Welcome to MeetingScribe AI! This index will help you find the right documentation for your needs.

## 📚 Documentation Overview

### Getting Started
- **[README.md](README.md)** - Main project overview, features, and setup instructions
- **[QUICK_START.md](QUICK_START.md)** - Fastest way to get up and running
- **[DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** - Complete development setup and guidelines

### Technical Documentation
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference for backend services
- **[MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)** - Migration from Cloudflare to local AI (completed)

### AI and Prompts
- **[prompts/ai-summarization.md](prompts/ai-summarization.md)** - AI summarization prompts and customization
- **[prompts/development-guidelines.md](prompts/development-guidelines.md)** - Development best practices

## 🚀 Quick Navigation

### For New Users
1. Start with [README.md](README.md) for project overview
2. Follow [QUICK_START.md](QUICK_START.md) for setup
3. Use the application at http://localhost:3000

### For Developers
1. Read [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) for setup
2. Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for backend APIs
3. Review [prompts/development-guidelines.md](prompts/development-guidelines.md) for standards

### For Contributors
1. Follow [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) for development workflow
2. Check [prompts/development-guidelines.md](prompts/development-guidelines.md) for coding standards
3. Review [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API design patterns

## 📁 Project Structure

```
├── 📄 README.md                    # Main project documentation
├── 📄 QUICK_START.md               # Quick setup guide
├── 📄 DEVELOPMENT_GUIDE.md         # Development setup and guidelines
├── 📄 API_DOCUMENTATION.md         # Backend API reference
├── 📄 MIGRATION_SUMMARY.md         # Migration history (completed)
├── 📄 DOCUMENTATION_INDEX.md       # This file
├── 📁 prompts/                     # AI prompts and guidelines
│   ├── 📄 ai-summarization.md      # AI summarization prompts
│   └── 📄 development-guidelines.md # Development best practices
├── 📁 src/                         # Frontend React application
├── 📁 server/                      # Backend Express.js server
└── 📁 setup scripts/               # Automated setup scripts
```

## 🔧 Setup Options

### Option 1: Docker Setup (Recommended)
```bash
# Linux/macOS
./setup-docker.sh

# Windows
setup-docker.bat
```

### Option 2: Local Setup
```bash
# Linux/macOS
./setup.sh

# Windows
setup.bat
```

## 🌐 Application Access

After setup, access the application at:
- **Main Application:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Ollama API:** http://localhost:11434 (Docker setup only)

## 🆘 Getting Help

### Common Issues
- Check the [Troubleshooting section](README.md#troubleshooting) in README.md
- Review [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API issues
- See [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) for development problems

### Support
- Create an issue on GitHub for bugs or feature requests
- Check existing issues for solutions
- Review the documentation for setup and usage questions

## 📝 Documentation Standards

All documentation follows these standards:
- **Clear and concise** - Easy to understand for all skill levels
- **Up-to-date** - Reflects current project state
- **Comprehensive** - Covers all necessary information
- **Well-organized** - Logical structure and navigation
- **Examples included** - Code examples and usage patterns

## 🔄 Keeping Documentation Updated

When making changes to the project:
1. Update relevant documentation files
2. Test all code examples
3. Verify links and references
4. Update this index if needed
5. Commit documentation changes with code changes

## 📋 Documentation Checklist

- [ ] README.md - Project overview and setup
- [ ] QUICK_START.md - Quick setup guide
- [ ] DEVELOPMENT_GUIDE.md - Development setup
- [ ] API_DOCUMENTATION.md - API reference
- [ ] MIGRATION_SUMMARY.md - Migration history
- [ ] prompts/ai-summarization.md - AI prompts
- [ ] prompts/development-guidelines.md - Development standards
- [ ] DOCUMENTATION_INDEX.md - This index

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Complete and up-to-date