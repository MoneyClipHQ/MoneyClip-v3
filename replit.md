# MoneyClip - Screen Recording for Financial Advisors

## Overview

MoneyClip is a web application designed specifically for financial advisors to create secure screen recordings for client communication. The application allows advisors to record their screens while explaining portfolios, market updates, or financial plans, then share these recordings securely with clients through password-protected, expiring links. This solution addresses the challenge of explaining complex financial concepts while maintaining compliance standards required in the financial services industry.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built as a React Single Page Application (SPA) using:
- **React 18** with TypeScript for type safety and modern React patterns
- **Vite** as the build tool and development server for fast compilation and hot module replacement
- **Tailwind CSS** for utility-first styling with a custom design system
- **Shadcn/ui** component library built on Radix UI primitives for accessible, customizable UI components
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management, caching, and data fetching
- **React Hook Form** with Zod validation for form handling and validation

The application follows a component-based architecture with reusable UI components and a landing page structure showcasing the product's value proposition for financial advisors.

### Backend Architecture
The server-side uses a Node.js/Express architecture:
- **Express.js** server with TypeScript for API routes and middleware
- **Modular route registration** system with centralized error handling
- **Storage abstraction layer** using an interface pattern that currently implements in-memory storage but can be easily swapped for database implementations
- **Development/production environment handling** with different static file serving strategies

### Data Storage Solutions
The application is configured for PostgreSQL database integration:
- **Drizzle ORM** for type-safe database operations and migrations
- **PostgreSQL** as the target database (configured via Neon Database serverless)
- **Schema-first approach** with shared TypeScript types between client and server
- **Zod validation** integration with Drizzle for runtime type checking

The current implementation includes a basic user schema and an in-memory storage fallback for development.

### Authentication and Authorization
While not fully implemented, the architecture includes:
- **Session-based authentication** preparation with PostgreSQL session storage
- **User management system** with username/password authentication schema
- **Credential handling** through secure HTTP-only cookies

### Development and Build System
- **Monorepo structure** with shared types and utilities between client and server
- **ESBuild** for production server bundling
- **TypeScript** across the entire stack with path mapping for clean imports
- **Development middleware** for HMR and error overlay in development mode
- **Replit-specific optimizations** including development banners and cartographer integration

### Styling and Design System
- **Custom color palette** optimized for financial services branding
- **CSS custom properties** for theming and consistent design tokens
- **Responsive design** with mobile-first approach
- **Google Fonts integration** (Inter, DM Sans, Fira Code, Geist Mono) for typography hierarchy

The application emphasizes a clean, professional aesthetic suitable for financial advisor workflows while maintaining accessibility standards through Radix UI components.

## External Dependencies

### Core Framework Dependencies
- **React 18** - Frontend framework for building the user interface
- **Express.js** - Backend web framework for API and server logic
- **TypeScript** - Type safety across the entire application stack
- **Vite** - Frontend build tool and development server

### Database and ORM
- **Neon Database** - Serverless PostgreSQL database hosting (@neondatabase/serverless)
- **Drizzle ORM** - Type-safe database toolkit with PostgreSQL dialect
- **Drizzle Kit** - Database migration and schema management tools

### UI and Styling
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Radix UI** - Comprehensive set of accessible, headless UI components
- **Shadcn/ui** - Pre-built component library based on Radix UI
- **Lucide React** - Icon library for consistent iconography
- **Class Variance Authority** - Utility for creating component variants

### State Management and Data Fetching
- **TanStack Query** - Server state management and caching
- **React Hook Form** - Form state management and validation
- **Hookform Resolvers** - Integration between React Hook Form and validation libraries
- **Zod** - Runtime type validation and schema definition

### Development and Build Tools
- **ESBuild** - Fast JavaScript bundler for production builds
- **PostCSS** - CSS processing with Autoprefixer
- **TSX** - TypeScript execution environment for development
- **Replit-specific plugins** - Development environment optimizations

### Routing and Navigation
- **Wouter** - Lightweight routing library for React applications

### Session Management
- **Connect PG Simple** - PostgreSQL session store for Express sessions
- **Express Session** - Session middleware for user authentication

### Utility Libraries
- **Date-fns** - Date manipulation and formatting
- **CLSX** - Conditional class name utility
- **Tailwind Merge** - Intelligent Tailwind class merging
- **Nanoid** - URL-safe unique ID generation

The application is designed to be deployed on Replit with PostgreSQL database integration, though the modular architecture allows for easy adaptation to other hosting environments.