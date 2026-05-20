# AutonomousOps AI — Project Context

## Project Goal

AutonomousOps AI is an AI-native workflow automation platform inspired by:

- n8n
- Zapier
- Retool
- AI operational systems

The platform allows users to visually create, manage, and execute automations using drag-and-drop workflows and AI-assisted workflow generation.

Long-term vision:
Create a scalable open-source SaaS platform that helps businesses automate operations using natural language and intelligent workflow orchestration.

Example workflow:
Gmail Trigger → AI Classification → Save to Google Sheets → Notify Discord → Generate Invoice

---

# Main Objectives

The project aims to demonstrate:

- scalable backend engineering
- workflow execution systems
- AI-assisted automation
- SaaS architecture
- system design
- event-driven systems
- modern frontend engineering
- authentication & authorization
- real-world integrations
- open-source engineering practices

---

# Long-Term Product Vision

AutonomousOps AI should eventually support:

- AI-generated workflows from plain English
- drag-and-drop workflow builder
- real-time workflow monitoring
- workflow execution engine
- workflow templates
- self-healing workflows
- reusable automation blocks
- third-party integrations
- collaborative workspaces
- AI workflow debugging
- workflow analytics
- open-source plugin ecosystem

---

# Current Tech Stack

## Frontend

- Next.js 14
- TypeScript
- TailwindCSS
- React Flow
- shadcn/ui

## Backend

- NestJS
- TypeScript
- REST APIs

## Database

- MySQL
- Prisma ORM

## Future Infrastructure

- Redis
- Queue systems
- WebSockets
- AI APIs
- Background workers
- Docker

---

# Development Philosophy

IMPORTANT RULES:

- Build incrementally
- Avoid overengineering
- Keep localhost stable
- Use stable package versions only
- Avoid premature scaling complexity
- Focus on clean architecture
- Build production-grade foundations
- Build module-by-module
- Test each phase before moving ahead

IMPORTANT:
Do NOT attempt enterprise-level infrastructure too early.

---

# Current Stable Versions

Use stable versions only:

- Next.js 14
- React 18
- ESLint 8
- Stable NestJS
- Stable Prisma

Avoid:

- experimental releases
- unstable packages
- bleeding-edge dependencies

---

# Project Architecture Direction

Architecture should eventually support:

- scalable workflow execution
- modular integrations
- async processing
- event-driven systems
- AI orchestration
- multi-user SaaS
- future scaling

BUT:
initial versions must remain simple and stable.

---

# Development Workflow

Before moving to next phase:

- current phase must be stable
- localhost must run correctly
- no major frontend/backend bugs
- no dependency chaos
- no broken navigation
- no dead UI components

---

# Completed Phases

## Phase 1 — Frontend MVP

Completed:

- Landing page
- Dashboard UI
- Workflow builder UI
- Workflow history page
- Settings page
- Sidebar navigation
- Navbar
- React Flow setup
- Theme support
- Responsive UI
- Frontend routing
- Frontend stabilization
- UI interaction fixes

Goal:
Create polished SaaS-style frontend foundation.

---

## Phase 2 — Backend + Authentication Foundation

Completed:

- NestJS backend setup
- MySQL setup
- Prisma integration
- Environment configuration
- Authentication module
- JWT authentication
- Password hashing
- User registration
- User login
- Protected routes
- User management
- Profile endpoints
- Frontend-backend auth connection

Goal:
Create stable backend foundation with real authentication and database persistence.

---

# Current Phase

## Current Phase — Phase 3: Workflow CRUD + Workflow Persistence

Phase 3 is partially completed.

The backend architecture and workflow persistence foundation are already implemented successfully.

Current completed work:

### Backend Completed

- Workflow Prisma schema completed
- Workflow model added in `schema.prisma`
- MySQL workflow persistence working
- Workflow CRUD APIs implemented
- Create workflow endpoint
- Get all workflows endpoint
- Get workflow by ID endpoint
- Update workflow endpoint
- Delete workflow endpoint
- Duplicate workflow endpoint
- Workflow module integrated into NestJS backend
- DTO validation implemented
- Prisma migrations completed successfully
- Backend running successfully on localhost:3001
- TypeScript and Prisma issues resolved

### Frontend Completed

- React Flow workflow builder UI created
- Dashboard UI completed
- Workflow builder page completed
- Workflow list page UI completed
- Workflow detail page UI completed
- Frontend routing completed
- Frontend running successfully on localhost:3000

### Authentication Completed

- JWT authentication working
- Protected routes working
- User authentication integrated with workflow APIs

---

# Remaining Work in Phase 3 (Phase 3B)

The backend CRUD system exists, but the frontend is not fully connected to the backend yet.

Current focus:

- frontend ↔ backend workflow integration
- connecting React Flow builder with APIs
- workflow persistence from frontend
- workflow loading into React Flow
- workflow editing/updating from UI
- workflow deletion from UI
- workflow duplication from UI
- proper frontend API service layer
- loading states
- frontend error handling
- workflow state synchronization

---

# Main Goal of Remaining Phase 3

Transform the project from:

- dashboard UI + backend APIs

into:

- fully connected real workflow management platform

where users can:

- create workflows
- visually edit workflows
- save workflows
- reload workflows later
- update workflows
- delete workflows
- duplicate workflows

using the real React Flow builder connected to the backend database.

---

# Important Engineering Rules

- Keep localhost stable
- Avoid unnecessary rewrites
- Do not overengineer
- Do not introduce Redis/Kafka yet
- Do not start execution engine yet
- Focus ONLY on workflow management completion
- Use existing backend architecture
- Use existing frontend architecture
- Build incrementally

---

# Current Tech Stack

Frontend:

- Next.js 14
- TypeScript
- TailwindCSS
- React Flow

Backend:

- NestJS
- TypeScript

Database:

- MySQL
- Prisma ORM

---

# Current Priority

Complete Phase 3B:
Frontend ↔ Backend workflow integration and persistence.

# Future Phases

## Phase 4 — Workflow Execution Engine

Planned:

- node execution engine
- trigger system
- action execution
- workflow runtime
- execution states
- retry handling
- execution logs

Goal:
Make workflows executable.

---

## Phase 5 — Real Integrations

Planned integrations:

- Gmail API
- Google Sheets API
- Discord API
- Telegram Bot API
- Slack API
- GitHub API

Goal:
Enable real-world automation workflows.

---

## Phase 6 — Real-Time Monitoring

Planned:

- live workflow monitoring
- WebSocket updates
- execution dashboard
- live logs
- execution analytics

Goal:
Create real-time operational visibility.

---

## Phase 7 — AI Workflow Generation

Planned:

- natural language workflows
- AI-generated automation flows
- AI node recommendations
- workflow templates
- workflow optimization suggestions

Example:
"Whenever a lead fills my form, send welcome email and notify sales team."

Goal:
AI-native workflow creation.

---

## Phase 8 — AI Workflow Intelligence

Planned:

- self-healing workflows
- AI debugging
- execution failure analysis
- intelligent retries
- workflow optimization
- automation memory

Goal:
Create intelligent automation system beyond traditional workflow tools.

---

# Real Integrations Strategy

Use real APIs with free tiers where possible.

Primary integrations:

- Gmail
- Google Sheets
- Discord
- Telegram
- Slack
- GitHub

IMPORTANT:
Prefer free-tier-friendly APIs during MVP stage.

---

# Open Source Strategy

Project will eventually become:

- open source
- publicly documented
- built in public
- feedback-driven
- community-improved

Goals:

- attract contributors
- improve engineering visibility
- strengthen GitHub profile
- showcase system design skills
- attract recruiters/startup founders

---

# Public Building Strategy

The project is being built publicly on:

- X/Twitter
- LinkedIn
- GitHub

Positioning:
Computer engineering student from India building an open-source AI workflow automation platform while learning scalable backend engineering and SaaS architecture.

---

# Important Development Constraints

IMPORTANT:
Claude is being used through Minimax free version inside VS Code.

Constraints:

- plain text responses only
- no tool references
- no artifacts
- no unsupported formatting

AI instructions:

- generate incrementally
- avoid giant rewrites
- avoid unnecessary refactors
- explain root causes before fixes
- prefer stable implementations
- prioritize working localhost environment

---

# Core Engineering Goal

Build a project strong enough to demonstrate:

- advanced software engineering
- scalable system design
- backend architecture
- real-world SaaS engineering
- automation systems thinking
- AI-assisted operational tooling

This project should eventually serve as:

- flagship resume project
- final year project
- open-source SaaS
- public engineering portfolio
- long-term startup opportunity
