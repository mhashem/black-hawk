# Microservices Dashboard

## Overview

This is a modern web application that provides an admin dashboard for monitoring Spring Boot microservices. The application consists of a React frontend with TypeScript and a Node.js Express backend, designed to periodically scrape Spring Boot actuator endpoints and display real-time service health information. The dashboard allows users to register microservices, monitor their health status, view application metadata, and track Kafka Streams topologies.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for build tooling
- **UI Components**: Shadcn/UI component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Background Processing**: Custom monitoring service that runs every 30 seconds to scrape microservice endpoints
- **API Design**: RESTful endpoints following conventional patterns
- **Data Storage**: In-memory storage implementation with interface for future database migration

### Database Schema
The application uses four main tables:
- **services**: Stores registered microservice information (name, URL, group)
- **health_data**: Stores health check results and component status
- **service_info**: Stores application metadata (version, git branch, build time)
- **kafka_streams_info**: Stores Kafka Streams topology state information

### Key Features
- **Service Registration**: Web form to register new microservices with validation
- **Real-time Monitoring**: Automatic refresh every 30 seconds for live status updates
- **Health Status Tracking**: Color-coded status indicators (green/red/orange)
- **Service Details Modal**: Detailed view of service health and metadata
- **Statistics Dashboard**: Overview cards showing service counts by status
- **Responsive Design**: Mobile-friendly layout with sidebar navigation

### Data Flow
1. Background monitoring service scrapes `/actuator/health`, `/actuator/info`, and `/actuator/kafkastreams` endpoints
2. Data is stored in respective database tables with upsert operations
3. Frontend queries combined service data through API endpoints
4. React Query manages caching and automatic refetching

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL hosting (configured via DATABASE_URL)
- **Connection**: Uses `@neondatabase/serverless` driver for serverless compatibility

### UI and Styling
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography
- **FontAwesome**: Icon library used in navigation components

### Development Tools
- **Vite**: Fast build tool and development server
- **Replit Integration**: Development environment specific plugins and error handling
- **TypeScript**: Static type checking across the entire stack

### Validation and Forms
- **Zod**: Schema validation library used with Drizzle and React Hook Form
- **React Hook Form**: Form library with validation integration

### HTTP and API
- **Axios**: HTTP client for making requests to Spring Boot actuator endpoints
- **TanStack Query**: Server state management and caching

### Utilities
- **date-fns**: Date formatting and manipulation
- **clsx/tailwind-merge**: Utility for conditional CSS classes
- **nanoid**: Unique ID generation for entities