# GitHub Setup Guide

Your RentMS project is ready to be pushed to GitHub!

## Steps to Push to GitHub

### 1. Create a GitHub Repository

1. Go to https://github.com/new
2. Enter repository name: `rentms` (or your preferred name)
3. Add description: "Rent Management System - Full-stack web application with MongoDB, Node.js, and Bootstrap"
4. Choose **Public** or **Private**
5. Click "Create repository"

### 2. Connect Local Repository to GitHub

After creating the repository on GitHub, you'll see instructions. Run these commands in your project directory:

```bash
cd C:\Users\Dylan\Downloads\sneat-1.0.0\sneat-1.0.0

# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/rentms.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### 3. Verify Push

Visit `https://github.com/YOUR_USERNAME/rentms` to see your repository online!

## Local Git Status

Your local repository already has:
✅ All source code committed
✅ Configuration files
✅ MongoDB models and routes
✅ Frontend HTML/CSS/JS
✅ Backend Express server

## Recommended .gitignore Entries

The `.gitignore` file already excludes:
- node_modules/
- .env (environment variables)
- mongodb_data/
- .vscode/
- IDE files
- OS temporary files

## Future Commits

After making changes, commit them with:

```bash
git add .
git commit -m "Description of changes"
git push origin main
```

## Clone from GitHub Later

To clone this repository on another machine:

```bash
git clone https://github.com/YOUR_USERNAME/rentms.git
cd rentms
cd backend
npm install
```

## Important Files in Your Repository

- **backend/src/server.js** - Main Express server with MongoDB
- **backend/src/models/** - Mongoose schemas for database
- **backend/src/routes/** - API endpoint handlers
- **html/index.html** - Main dashboard HTML
- **assets/** - CSS, images, fonts
- **server-simple.js** - Frontend file server
- **START.bat** - Windows startup script
- **.env** - Configuration (not pushed, create locally)
- **package.json** - Dependencies

## Creating .env Locally on New Machine

After cloning, create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rentms
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
```

## Support

If you need help with git:
- `git status` - See what's changed
- `git log` - See commit history
- `git diff` - See changes not yet committed
- `git reset` - Undo changes
- `git branch` - Manage branches

---

Happy coding! Your RentMS project is now version-controlled and ready for collaboration! 🚀
