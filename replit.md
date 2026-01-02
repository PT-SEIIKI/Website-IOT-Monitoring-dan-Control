# IoT Control System - Campus Power Management

## Overview
This is an IoT Control System for Campus Power Management, migrated from Lovable to Replit. It provides a dashboard interface for monitoring and controlling power systems across a campus.

## Project Structure
- `/src` - Main source code directory
  - `/components` - React components
    - `/dashboard` - Dashboard-specific components (PowerChart, RecentActivity, StatCard, TopConsumers)
    - `/layout` - Layout components (Header, MainLayout, Sidebar)
    - `/rooms` - Room-related components
    - `/ui` - Shadcn UI components
  - `/contexts` - React contexts (AuthContext)
  - `/data` - Mock data
  - `/hooks` - Custom React hooks
  - `/lib` - Utility functions
  - `/pages` - Page components (Dashboard, History, Login, Monitoring, Reports, Rooms, Schedule, Settings)
  - `/types` - TypeScript type definitions

## Tech Stack
- React 18 with TypeScript
- Vite for bundling and dev server
- Tailwind CSS for styling
- Shadcn UI components
- React Router v6 for routing
- TanStack Query for data fetching
- React Hook Form with Zod for forms
- Recharts for data visualization

## Development
Run `npm run dev` to start the development server on port 5000.

## Recent Changes
- 2026-01-02: Migrated from Lovable to Replit environment
  - Updated Vite config to use port 5000 with `allowedHosts: true`
  - Fixed CSS @import ordering issue
