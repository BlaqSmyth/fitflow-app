# FitFlow - Fitness Application

## Overview

FitFlow is a comprehensive fitness application that combines video-based workout sessions with progress tracking and user management. The application provides users with access to 90+ premium workouts across multiple categories, featuring a workout player with video playback capabilities, detailed exercise tracking through workout sheets, and comprehensive progress analytics. Built as a mobile-first progressive web application, FitFlow offers an intuitive interface for users to discover, follow, and track their fitness journey.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built using React with TypeScript, leveraging the Vite build tool for development and production builds. The application uses a component-based architecture with shadcn/ui components for consistent UI design. Routing is handled by Wouter for lightweight client-side navigation. The UI is styled using Tailwind CSS with a custom design system featuring a dark theme with primary orange (#FF6B35) and secondary blue (#3B82F6) colors.

State management is handled through TanStack Query for server state and React hooks for local component state. The application follows a mobile-first responsive design approach with a bottom navigation pattern for primary app navigation.

### Backend Architecture
The server is built using Express.js with TypeScript, providing a REST API for the frontend. The application uses a modular structure with separate files for database operations, authentication, routing, and server configuration. The server implements middleware for request logging, JSON parsing, and error handling.

### Data Storage Solutions
The application uses PostgreSQL as the primary database, accessed through Drizzle ORM for type-safe database operations. The database schema supports comprehensive fitness tracking with tables for users, workout categories, workouts, exercises, workout sessions, exercise sets, user progress, and favorite workouts.

Database connections are handled through Neon's serverless PostgreSQL client, with connection pooling for optimal performance. Session data is stored in PostgreSQL using connect-pg-simple for persistent user sessions.

### Authentication and Authorization
Authentication is implemented using Replit's OpenID Connect (OIDC) authentication system with Passport.js. The system supports secure session management with encrypted cookies and automatic session renewal. User sessions are stored in the database with configurable TTL.

The authentication system includes middleware to protect API routes and automatically redirect unauthenticated users to the login flow. User profile information is synchronized from the OIDC provider and stored locally for quick access.

### API Structure
The REST API follows RESTful conventions with endpoints organized by resource type:
- `/api/auth/*` - Authentication and user management
- `/api/categories` - Workout category management
- `/api/workouts/*` - Workout CRUD operations and filtering
- `/api/exercises/*` - Exercise management
- `/api/sessions/*` - Workout session tracking
- `/api/progress` - User progress analytics
- `/api/favorites` - Favorite workout management

All API endpoints require authentication and return JSON responses with consistent error handling.

## External Dependencies

### Core Framework Dependencies
- **React 18** with TypeScript for component-based UI development
- **Express.js** for server-side API development
- **Vite** for build tooling and development server
- **Wouter** for lightweight client-side routing

### Database and ORM
- **PostgreSQL** via Neon serverless platform for data persistence
- **Drizzle ORM** for type-safe database operations and migrations
- **Drizzle Kit** for database schema management

### Authentication Services
- **Replit Auth** using OpenID Connect for user authentication
- **Passport.js** for authentication middleware
- **express-session** with PostgreSQL store for session management

### UI Component Libraries
- **shadcn/ui** built on Radix UI primitives for accessible components
- **Tailwind CSS** for utility-first styling
- **Lucide React** for consistent iconography

### State Management and Data Fetching
- **TanStack Query** for server state management and caching
- **React Hook Form** with Zod validation for form handling

### Development and Build Tools
- **TypeScript** for type safety across the application
- **ESBuild** for server-side bundling in production
- **PostCSS** with Autoprefixer for CSS processing

### Additional Utilities
- **date-fns** for date manipulation and formatting
- **clsx** and **class-variance-authority** for conditional styling
- **nanoid** for unique ID generation
- **memoizee** for function memoization and caching