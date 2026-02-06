# BIMDev

A comprehensive BIM (Building Information Modeling) Development Platform featuring an IFC viewer, quality inspection system, and Firebase integration for construction project management.

## Overview

BIMDev is a web-based platform that enables construction teams to visualize, manage, and inspect building information models. Built with modern web technologies, it provides a powerful 3D viewer for IFC files, integrated quality inspection workflows (ITP - Inspection and Test Plans), and cloud-based project management through Firebase.

## Key Features

- **IFC Model Loading & Visualization** - Load and view IFC files with full 3D navigation
- **3D Visualization** - Interactive 3D viewer powered by Three.js and ThatOpen Components
- **Project Management** - Organize projects, models, and documentation
- **User Management** - Role-based access control for team collaboration
- **Quality Inspection (ITP)** - Comprehensive inspection and test plan management system
- **Firebase Persistence** - Cloud storage and real-time synchronization
- **Section Planes** - (Coming in PR #3) Advanced model sectioning capabilities

## Technology Stack

- **Frontend Framework**: React 19
- **UI Library**: React Router DOM for navigation
- **3D Engine**: Three.js
- **BIM Components**: ThatOpen Components (v3.1)
- **Build Tool**: Vite
- **Language**: TypeScript
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Local Database**: Dexie (IndexedDB wrapper)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ 
- **npm** or **yarn**
- **Firebase account** - [Create one here](https://firebase.google.com/)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/tezparky01/BIMDev.git
cd BIMDev
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

### 4. Add Your Firebase Credentials

Open the `.env` file and add your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**⚠️ Security Note**: Never commit the `.env` file to version control. It's already included in `.gitignore`.

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Firebase Setup

### Creating a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** and follow the setup wizard
3. Once created, click on the **web icon** (</>) to add a web app
4. Register your app with a nickname (e.g., "BIMDev")
5. Copy the configuration values to your `.env` file

### Firestore Database Setup

1. In the Firebase Console, navigate to **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** for development (update rules for production later)
4. Select a location close to your users

### Firestore Security Rules

#### Development Rules (Permissive)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### Production Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

### Firebase Storage Setup

1. Navigate to **Storage** in the Firebase Console
2. Click **"Get started"**
3. Accept the default security rules or customize them
4. Choose a storage location

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server with hot module replacement |
| `npm run build` | Type check and build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check code quality |
| `npm run type-check` | Run TypeScript compiler to check types without emitting files |

## Project Structure

```
BIMDev/
├── src/
│   ├── bim-components/      # ThatOpen Components setup and configuration
│   │   ├── setup/           # Core BIM component initialization
│   │   └── DataEnhancer/    # Custom data enhancement for IFC models
│   ├── classes/             # Core business logic classes
│   │   ├── Project.ts       # Project entity and methods
│   │   ├── ProjectsManager.ts
│   │   ├── User.ts
│   │   └── UsersManager.ts
│   ├── firebase/            # Firebase configuration and utilities
│   ├── quality/             # Quality Inspection (ITP) system
│   ├── react-components/    # React UI components
│   ├── ui-templates/        # BIM UI templates and grids
│   ├── globals.ts           # Global type definitions and constants
│   └── index.tsx            # Application entry point
├── assets/                  # Static assets (images, icons)
├── resources/               # Additional resources
├── .env.example             # Environment variable template
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── tsconfig.node.json       # TypeScript config for build tools
├── vite.config.ts           # Vite configuration
└── style.css                # Global styles
```

## Key Features Details

### IFC Model Loading

The platform supports loading and visualizing Industry Foundation Classes (IFC) files, the standard for BIM data exchange. Upload your IFC models and explore them in the 3D viewer.

### 3D Visualization

Powered by Three.js and ThatOpen Components, the viewer provides:
- Pan, zoom, and rotate navigation
- Object selection and highlighting
- Property inspection
- Measurement tools

### Quality Inspection System (ITP)

The Inspection and Test Plan (ITP) module allows teams to:
- Create inspection checklists
- Track inspection progress
- Document test results
- Generate reports

### Project Management

Organize your work with:
- Multiple project support
- Project metadata and descriptions
- User assignments and permissions
- Cloud synchronization via Firebase

## Troubleshooting

### Common Issues

#### Port Already in Use

If port 5173 is already in use, Vite will automatically try the next available port. Check the console output for the actual URL.

#### Firebase Configuration Errors

**Error**: "Firebase: Error (auth/invalid-api-key)"
- **Solution**: Verify your `VITE_FIREBASE_API_KEY` in `.env` is correct

**Error**: "Firebase: Firebase App named '[DEFAULT]' already exists"
- **Solution**: This usually happens with hot module replacement. Refresh the page.

#### TypeScript Errors

If you see TypeScript errors after installation:

```bash
npm run type-check
```

This will show you any type errors that need to be resolved.

#### Build Failures

Try clearing the cache and reinstalling dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### IFC Models Not Loading

- Ensure your IFC file is valid (test with another IFC viewer)
- Check browser console for errors
- Verify file size isn't too large for browser memory

## Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and commit: `git commit -m 'Add amazing feature'`
4. **Push to your branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## Roadmap

- [x] **PR #1**: Security fixes for environment variables
- [x] **PR #2**: Configuration files and documentation
- [ ] **PR #3**: Section planes and ThatOpen compatibility improvements

## License

This project is licensed under the ISC License.

## Support

For questions, issues, or feature requests, please open an issue on GitHub.

## Acknowledgments

- Built with [ThatOpen Components](https://github.com/ThatOpen/engine_components)
- 3D rendering powered by [Three.js](https://threejs.org/)
- UI framework by [React](https://react.dev/)

---

**Note**: This is an active development project. Features and documentation are continuously evolving.
