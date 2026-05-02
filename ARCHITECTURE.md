# Architecture Overview

This project is a high-performance **MERN Stack** (MongoDB, Express, React, Node.js) web application designed for a premium movie booking experience. The architecture follows a modular, scalable, and decoupled approach.

## 🏗 Backend Architecture

### Core Tech Stack
- **Node.js & Express**: High-concurrency server framework.
- **MongoDB & Mongoose**: Flexible, document-oriented database with structured schemas.
- **JWT (JSON Web Tokens)**: Secure, stateless authentication for users and admins.
- **Stripe SDK**: Real-time payment processing via Payment Intents API.

### Key Components
- **Location-Aware Discovery Engine**: Implements a sophisticated intersection algorithm that filters movies based on theater availability and active showtimes in the user's selected city.
- **Dynamic Data Aggregator**: Backend supports on-the-fly sorting (`rating`, `latest`) and result limiting to power featured homepage sections.
- **Modular Routing**: Routes are divided by domain (Auth, Movies, Theaters, Bookings).
- **Analytics Engine**: Advanced MongoDB aggregation pipelines for real-time revenue tracking and booking statistics across global and theater-specific scopes.
- **Controller-Service Pattern**: Business logic is separated from route definitions for maintainability.
- **Middleware Layer**: Centralized authentication (`protect`) and role-based validation.
- **Database Indexing**: Optimized queries for movie discovery and showtime availability.

### Role-Based Access Control (RBAC)
- **User**: Discovery, booking, and ticket management.
- **Theater Admin**: Management of owned theaters, showtime scheduling, and branch-specific analytics.
- **Super Admin**: Global platform oversight, theater approvals/moderation, and network-wide financial auditing.
- **Drill-Down Architecture**: Decoupled analytics pages for theater-specific deep-dives using dynamic route parameters (`/admin/theater/:id`).

### Security
- **Version Locking**: Implements optimistic concurrency control (Mongoose `__v`) to prevent double-booking of seats.
- **Env Variable Protection**: Sensitive keys (DB, Stripe, JWT) are restricted to `.env`.

---

## 🎨 Frontend Architecture

### Core Tech Stack
- **React 19 + TypeScript**: Type-safe component development.
- **Vite**: Ultra-fast build tool and development server.
- **Tailwind CSS**: Utility-first styling for a "Cinematic Dark" aesthetic.
- **Lucide React**: Modern, consistent iconography.

### State Management
- **Context API**: 
  - `AuthContext`: Manages global login state, user roles, and token lifecycle.
  - `LocationContext`: Persists theater location preferences across the session.

### Navigation & Routing
- **React Router 7**: Nested routing with protected routes (`ProtectedRoute`) for Admins and logged-in Users.
- **Step-Based Workflows**: Complex interactions like Booking are broken into state-driven steps to reduce cognitive load.

### Component Design
- **Atomic Design Principles**: Reusable UI components (Buttons, Inputs, Modals) versus feature-specific pages.
- **Glassmorphism UI**: Uses backdrop filters and translucent borders for a premium feel.

---

## 💳 Integration Layer
- **Stripe Payment Intents**: Custom 2-column payment UI integrated directly into the booking flow (versus simple redirect).
- **OMDB API**: Dynamically fetches high-resolution movie posters and metadata.
