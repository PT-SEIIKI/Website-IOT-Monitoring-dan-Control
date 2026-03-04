# IoT Control System - Campus Power Management

## Overview
This is an IoT Control System for Campus Power Management, migrated from Lovable to Replit. It provides a dashboard interface for monitoring and controlling power systems across a campus.

## Key Features (Implemented)
- **Real-time Monitoring**: Live updates via Socket.io for device statuses and power consumption.
- **Interactive Room Control**: "Kontrol Ruangan" page with grid/list views and master toggles.
- **Individual Lamp Visualization**: Interactive 10-lamp grid for each room with individual status indicators.
- **Maintenance Logging**: Ability to log lamp replacements (brand, wattage, technician) directly from the room view.
- **Structured Activity History**: Comprehensive log of all system actions, including technical specifications for maintenance tasks.
- **Admin Tools**: Bulk reset capabilities for lamps and ACs across the entire campus.

## Project Structure
- `/src` - Main source code directory
  - `/components` - React components
    - `/dashboard` - Dashboard-specific components (PowerChart, RecentActivity, StatCard, TopConsumers)
    - `/layout` - Layout components (Header, MainLayout, Sidebar)
    - `/rooms` - Room-related components (RoomCard with Interactive Grid)
    - `/ui` - Shadcn UI components
  - `/contexts` - React contexts (AuthContext)
  - `/data` - Mock data and simulation logic
  - `/hooks` - Custom React hooks
  - `/lib` - Utility functions and socket configuration
  - `/pages` - Page components (Dashboard, History, Login, Monitoring, Reports, Rooms, Schedule, Settings)
  - `/types` - TypeScript type definitions (Updated for individual lamp support)

## Tech Stack
- React 18 with TypeScript
- Vite for bundling and dev server
- Tailwind CSS for styling
- Shadcn UI components
- React Router v6 for routing
- TanStack Query for data fetching
- Socket.io for real-time communication
- date-fns for time formatting

## Workflows
- **Start application** - Vite dev server on port 5000 (frontend, webview)
- **Backend Server (IoT)** - Express + Socket.io server on port 3000 (console)

## Development
Run `npm run dev` to start the frontend on port 5000. The backend runs separately via `PORT=3000 npx tsx server/index.ts`.

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (provisioned by Replit)
- `MQTT_BROKER_URL` - MQTT broker URL (e.g., `mqtt://your-broker:1883`)
- `PORT` - Backend server port (default: 3000)

## Recent Changes
- 2026-01-12: Major Feature Update
  - Renamed "Ruangan" to "Kontrol Ruangan" for better UX clarity.
  - Simplified room list to 4 prototype rooms (1.0.1 - 1.0.4).
  - Implemented Individual Lamp Grid in RoomCard with real-time interactivity.
  - Added Lamp Replacement Logging form and data structure.
  - Refactored History page into a structured, interactive technical log.
  - Integrated state management for individual lamps in `Rooms.tsx`.
