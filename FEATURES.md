# Implemented Features

This document outlines the core features of the ScreenFlix platform, categorized by the user persona.

## 🎬 User Features

### 🔍 Discovery & Filtering
- **Smart Discovery Sections**:
  - **Trending Now**: Top 10 movies ranked dynamically by real-time IMDb ratings.
  - **Latest Releases**: Curated list of the 20 most recently synchronized movies.
- **Location-Aware Intersection**: Persistent city selection with "Selection Lock" logic. The home sections automatically filter to show "Trending in [City]" and "Latest in [City]" using a theater-showtime intersection engine.

### 🎟 Booking Experience
- **Interactive Seat Map**: 
  - Dynamic seat generation based on theater layout.
  - Category-based pricing (Platinum, Gold, Silver).
  - Optimistic locking to prevent seat snatching.
- **2-Step Checkout**:
  - **Step 1**: Quick summary bar with live total calculation.
  - **Step 2 (The Vault)**: Premium 2-column layout for final order review and payment gateways.
- **Embedded Payment**: Integrated Stripe payment field (Credit/Debit) for a seamless in-app experience.

### 👤 Profile & Tickets
- **Digital Ticket Wallet**: Dedicated profile page listing all past and upcoming shows.
- **Rich Ticket Metadata**: View seat numbers, showtimes, theater location, and digital receipt details.
- **Instant Confirmation**: Automatic redirect and ticket update after successful payment.

---

## 🛠 Admin Features (Theater & Super Admin)

### 📊 Analytics Dashboards
- **Global Command Center (Super Admin)**: Unified view of total platform revenue, ticket volume, and payment success rates.
- **Branch Performance Hub (Theater Admin)**: Dedicated analytics for owned branches with real-time profit tracking.
- **Theater Intelligence Reports**: A standalone deep-dive page for every branch featuring:
  - **Revenue Analytics**: Breakdowns of net profit and sales completion.
  - **Sticky-Header Ledger**: A high-performance, scrollable transaction table with persistent headers for auditing hundreds of bookings.

### 🎬 Theater & Network Management
- **Verified Theater Network (Super Admin)**: Searchable table of all approved theaters with direct links to full performance reports.
- **Visual Layout Builder**: Admins can define `seatsPerRow` and unique row ranges (e.g., Rows A-C are Platinum).
- **Zone-Based Pricing**: Ability to set different prices per category (Platinum/Gold/Silver) per show.

### 🕒 Showtime Orchestration
- **Wide-Layout Scheduler**: A modern 2-column modal for creating showtimes.
- **Conflict Prevention**: Intelligent showtime creation linked to specific screens and existing movie metadata via OMDB.

---

## 💎 Design & UX Details
- **Cinematic Dark Theme**: Custom HEX-tailored dark mode with vibrant red/indigo highlights.
- **Micro-Animations**: Smooth fade-ins, hover-lifts on buttons, and pulse effects for interactive states.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop viewing.
- **Safe State Transitions**: Location locking and protected routes prevent navigation errors.
