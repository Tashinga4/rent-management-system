# Project Shutdown & Cleanup Guide

## How to Properly Shut Down the Project

### Step 1: Close Running Servers

You have 3 services running:

#### Option A: Graceful Shutdown (Recommended)
In each terminal window running a service, press:
```
Ctrl + C
```

#### Option B: Force Kill Processes
```powershell
# Kill all Node processes
taskkill /F /IM node.exe

# Kill MongoDB process
taskkill /F /IM mongod.exe
```

### Step 2: Close Terminal Windows
Close any terminal/command prompt windows that were running the servers.

### Step 3: Close VS Code
1. File → Close Folder
2. File → Exit (or Ctrl + Shift + Q)

## Restarting the Project Later

### Quick Start (Windows)
Simply double-click: `START.bat`

This will automatically:
- Start MongoDB
- Start Backend API server
- Start Frontend server
- Open dashboard in browser

### Manual Start

**Terminal 1 - MongoDB:**
```bash
mongod --dbpath "C:\Users\Dylan\Downloads\sneat-1.0.0\sneat-1.0.0\backend\mongodb_data"
```

**Terminal 2 - Backend:**
```bash
cd C:\Users\Dylan\Downloads\sneat-1.0.0\sneat-1.0.0\backend
npm start
```

**Terminal 3 - Frontend:**
```bash
cd C:\Users\Dylan\Downloads\sneat-1.0.0\sneat-1.0.0
node server-simple.js
```

**Browser:**
```
http://localhost:3000/html/index.html
```

## Your Progress is Saved

✅ **Local Git Repository:** All code committed locally
✅ **GitHub Ready:** Instructions in GITHUB_SETUP.md

To push to GitHub later:
```bash
git remote add origin https://github.com/YOUR_USERNAME/rentms.git
git push -u origin main
```

## Backup Recommendations

### Important Directories to Backup
- `backend/mongodb_data/` - Your database
- `backend/src/` - Your custom backend code
- `html/` - Your custom pages
- `assets/` - Your custom styles/images

### Backup Commands
```bash
# Full project backup
xcopy "C:\Users\Dylan\Downloads\sneat-1.0.0" "D:\Backups\RentMS" /E /I

# Or use cloud sync (OneDrive, Google Drive, Dropbox)
```

## When You Return

1. Double-click `START.bat` to start all services
2. OR manually start each service in separate terminals
3. Open http://localhost:3000/html/index.html

That's it! Your project will be ready to use.

## System Requirements Check

Before next session, ensure you have:
- ✅ Node.js installed (check: `node -v`)
- ✅ MongoDB installed (check: `mongod --version`)
- ✅ Git installed (check: `git --version`)
- ✅ VS Code installed

## Troubleshooting on Restart

### Port Already in Use
```bash
# Find process using port 3000
netstat -ano | findstr ":3000"

# Kill it
taskkill /PID <PID> /F
```

### MongoDB Connection Error
```bash
# Verify MongoDB is running
netstat -ano | findstr ":27017"

# If not, start it
mongod --dbpath "backend\mongodb_data"
```

### Module Not Found
```bash
cd backend
npm install
```

---

**Total Project Footprint:** ~500MB (with node_modules)
**Database Size:** Grows with your data (empty at start)
**Last Modified:** January 28, 2026

See you next time! 🚀
