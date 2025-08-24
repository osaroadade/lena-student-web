# Lena Student Web

A modern, production-ready React application built with React Router v7, featuring a clean MVC architecture and feature-based organization.

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Development Practices](#-development-practices)
- [Getting Started](#-getting-started)
- [Features](#-features)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

## 🏗 Architecture Overview

This project follows a **feature-based MVC architecture** with clear separation of concerns:

- **Models**: Business logic, data validation, API calls
- **Views**: Pure UI components without business logic
- **Controllers**: Request coordination, loaders, actions for React Router
- **Feature-based organization**: Related code grouped by domain, not by type

### Core Principles

1. **Single Responsibility**: Each file/class has one clear purpose
2. **Feature Isolation**: Features are self-contained with their own MVC layers
3. **Shared Libraries**: Common utilities in `lib/` for reusability
4. **Type Safety**: TypeScript throughout with proper interfaces
5. **Clean Imports**: Features export via index files for clean imports

## 📁 Project Structure

```
lena-student-web/
├── app/
│   ├── components/              # Reusable UI components
│   │   └── ui/                  # shadcn/ui components
│   ├── features/                # Feature-based organization
│   │   └── auth/                # Authentication feature (example)
│   │       ├── controllers/     # Request handling & coordination
│   │       ├── models/          # Business logic & data
│   │       ├── views/           # Pure UI components
│   │       ├── types.ts         # Feature-specific types
│   │       └── index.ts         # Clean exports
│   ├── lib/                     # Shared utilities
│   │   ├── api.ts               # API client & utilities
│   │   ├── session.ts           # Session management
│   │   ├── temp-session.ts      # Temporary session handling
│   │   ├── route-guards.ts      # Generic route protection
│   │   ├── types.ts             # Global types
│   │   └── utils.ts             # Common utilities
│   ├── routes/                  # Route definitions
│   └── root.tsx                 # App root component
├── tests/                       # Test files (mirrors app structure)
│   └── features/
│       └── auth/
│           └── models/          # Model tests (split by model)
├── public/                      # Static assets
└── [config files]               # Build & dev configuration
```

### Feature-Based Architecture

Each feature follows the MVC pattern:

```
features/auth/
├── controllers/
│   ├── auth-controller.ts       # Handles loaders/actions
│   └── auth-guards.ts           # Feature-specific route guards
├── models/
│   ├── login-model.ts           # Login business logic
│   ├── email-check-model.ts     # Email validation logic
│   ├── session-model.ts         # Session management
│   ├── validation-model.ts      # Form validation helpers
│   └── types.ts                 # Feature types
├── views/
│   ├── LoginForm.tsx            # Pure UI component
│   └── EmailCheckForm.tsx       # Pure UI component
└── index.ts                     # Clean exports
```

## 🛠 Tech Stack

### Core Framework
- **React 19** - UI framework
- **React Router v7** - Routing, data loading, and SSR
- **TypeScript** - Type safety and developer experience
- **Vite** - Build tool and development server

### Styling & UI
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library

### Data & State
- **Zod** - Schema validation
- **Cookies** - Session management
- **React Router Data APIs** - Built-in data loading (no external state management)

### Development & Testing
- **Vitest** - Testing framework
- **jsdom** - DOM testing environment
- **ESLint + TypeScript** - Code quality and type checking

### Deployment
- **Cloudflare Workers** - Edge runtime with SSR support

## 💻 Development Practices

### Code Organization

1. **Feature-First**: Group by domain (auth, dashboard, etc.), not by type
2. **MVC Separation**: Models (logic), Views (UI), Controllers (coordination)
3. **Clean Exports**: Each feature exports via `index.ts`
4. **Single Responsibility**: One class/function = one purpose

### File Naming Conventions

- **Models**: `kebab-case.ts` (e.g., `login-model.ts`)
- **Views**: `PascalCase.tsx` (e.g., `LoginForm.tsx`)
- **Controllers**: `kebab-case.ts` (e.g., `auth-controller.ts`)
- **Types**: `types.ts` (feature-specific) or global in `lib/types.ts`
- **Tests**: `*.test.ts` (mirrors source structure)

### Import Patterns

```typescript
// ✅ Good - Clean feature imports
import { AuthController, LoginForm, ValidationModel } from '~/features/auth'

// ✅ Good - Specific lib imports
import { createSession } from '~/lib/session'

// ❌ Avoid - Deep imports
import { LoginModel } from '~/features/auth/models/login-model'
```

### Model Design

Each model has a single responsibility:

```typescript
// ✅ Focused model
export class LoginModel {
    static validateLoginData(data: LoginFormData) { /* ... */ }
    static async loginUser(data: LoginFormData) { /* ... */ }
}

// ✅ Separate concerns
export class ValidationModel {
    static validateEmail(email: string) { /* ... */ }
    static validatePassword(password: string) { /* ... */ }
}
```

### View Components

Views are pure UI components without business logic:

```typescript
// ✅ Pure view component
export function LoginForm({ email, errors }: LoginFormProps) {
    // Only UI state and event handlers
    // Business logic delegated to models
}
```

### Controller Pattern

Controllers handle React Router integration:

```typescript
export class AuthController {
    // Loader functions for data fetching
    static async loginLoader({ request }: LoaderFunctionArgs) { /* ... */ }
    
    // Action functions for form submissions
    static async loginAction({ request }: ActionFunctionArgs) { /* ... */ }
}
```

### Testing Strategy

1. **Model Tests**: Focus on business logic, API integration, validation
2. **View Tests**: Component rendering, user interactions, prop handling
3. **Controller Tests**: Loader/action behavior, request handling
4. **Split by Model**: Each model has its own test file for maintainability

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd lena-student-web

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
# Start development server with HMR
npm run dev

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run typecheck

# Build for production
npm run build
```

Your application will be available at `http://localhost:5173`.

## ✨ Features

### Authentication System
- **Email/Password Login**: Secure user authentication
- **Session Management**: Cookie-based sessions with validation
- **Route Guards**: Protected routes with automatic redirects
- **Email Checking**: Validate email existence before login
- **Client-side Validation**: Real-time form validation
- **Error Handling**: Comprehensive error states and messaging

### Architecture Features
- **Server-Side Rendering**: Fast initial page loads
- **Type Safety**: Full TypeScript coverage
- **Form Handling**: React Router's built-in form APIs
- **Data Loading**: Automatic loading states and error boundaries
- **Responsive Design**: Mobile-first responsive UI

## 🧪 Testing

### Test Structure

Tests mirror the source code structure and are split by model for maintainability:

```
tests/
└── features/
    └── auth/
        └── models/
            ├── login-model.test.ts
            ├── email-check-model.test.ts
            ├── session-model.test.ts
            └── validation-model.test.ts
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test -- login-model.test.ts

# Run tests for specific feature
npm run test -- tests/features/auth/
```

### Test Practices

1. **Focus on Business Logic**: Test models thoroughly
2. **Mock External Dependencies**: API calls, session management
3. **Test Error Scenarios**: Network errors, validation failures
4. **Descriptive Test Names**: Clear what each test validates

## 🚀 Deployment

### Cloudflare Workers

This application is optimized for deployment on **Cloudflare Workers** with server-side rendering (SSR) support.

#### Production Deployment

```bash
# Build and deploy to production
npm run build
npx wrangler deploy
```

#### Development Commands

```bash
# Local development with SSR
npm run dev

# Local development with Workers runtime
npm run dev:wrangler

# Build for production
npm run build
```

### Environment Variables

#### Non-sensitive Variables (in `wrangler.jsonc`)

```json
{
  "vars": {
    "NODE_ENV": "production"
  }
}
```

#### Sensitive Variables (Wrangler Secrets)

For sensitive data like API URLs, use Wrangler secrets:

```bash
# Set API URL as a secret (recommended for private APIs)
npx wrangler secret put VITE_LENA_API_URL

# Set other secrets as needed
npx wrangler secret put DATABASE_URL
npx wrangler secret put STRIPE_SECRET_KEY
```

#### Managing Secrets

```bash
# List all secrets (names only, not values)
npx wrangler secret list

# Update a secret (works for both new and existing)
npx wrangler secret put SECRET_NAME

# Delete a secret
npx wrangler secret delete SECRET_NAME
```

### Why Cloudflare Workers?

- ✅ **Edge Performance**: Deploy globally with 0ms cold starts
- ✅ **SSR Support**: Full React Router v7 server-side rendering
- ✅ **Secure Secrets**: Built-in secrets management
- ✅ **Cost Effective**: Generous free tier, pay-per-request
- ✅ **TypeScript Support**: Native TypeScript runtime
- ✅ **Global CDN**: Static assets served from edge locations

## 🤝 Contributing

### Development Workflow

1. **Follow the Architecture**: Use MVC pattern within features
2. **Write Tests**: Add tests for new models and significant view logic
3. **Type Everything**: Maintain TypeScript coverage
4. **Update Documentation**: Keep README and code comments current

### Adding a New Feature

1. **Create Feature Directory**:
   ```
   app/features/new-feature/
   ├── controllers/
   ├── models/
   ├── views/
   ├── types.ts
   └── index.ts
   ```

2. **Follow MVC Pattern**:
   - Models: Business logic, validation, API calls
   - Views: Pure UI components
   - Controllers: React Router loaders/actions

3. **Add Tests**:
   ```
   tests/features/new-feature/
   └── models/
       └── [model-name].test.ts
   ```

4. **Export Cleanly**:
   ```typescript
   // features/new-feature/index.ts
   export * from './controllers/feature-controller'
   export * from './models/feature-model'
   export * from './views/FeatureView'
   ```

### Code Review Checklist

- [ ] Follows MVC architecture pattern
- [ ] Models have single responsibility
- [ ] Views are pure UI components
- [ ] Controllers handle React Router integration
- [ ] Tests cover business logic
- [ ] Types are properly defined
- [ ] Clean imports/exports used
- [ ] Documentation updated if needed

### Getting Help

- **Architecture Questions**: Refer to existing auth feature as example
- **React Router**: [Official documentation](https://reactrouter.com/)
- **Testing**: Check existing test files for patterns
- **UI Components**: [shadcn/ui docs](https://ui.shadcn.com/)

---

## 📝 Notes for New Team Members

### Understanding the Codebase

1. **Start with `/app/features/auth`**: Complete example of MVC pattern
2. **Check `/lib`**: Shared utilities and types
3. **Look at tests**: Understand expected behavior
4. **Follow imports**: See how features connect

### Common Patterns

- **Data Loading**: Use React Router loaders, not useEffect
- **Form Handling**: Use React Router actions and Form component
- **Validation**: Client-side with models, server-side in controllers
- **Error Handling**: Comprehensive error types and user-friendly messages
- **State Management**: React Router's built-in data APIs (no Redux/Zustand needed)

### AI Agent Instructions

When working on this codebase:

1. **Respect the MVC Architecture**: Always separate models, views, and controllers
2. **Follow Feature Organization**: Keep related code together in feature directories
3. **Maintain Type Safety**: Use TypeScript properly throughout
4. **Write Focused Models**: Each model should have a single responsibility
5. **Test Business Logic**: Always add/update tests for model changes
6. **Use Clean Imports**: Import from feature index files, not deep paths
7. **Update Documentation**: Keep README current with architectural changes

---

Built with ❤️ for scalable, maintainable React applications.
