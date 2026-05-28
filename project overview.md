# AutonomousOps AI — Updated Project Context

## Project Overview

AutonomousOps AI is an AI-native workflow automation platform inspired by:

- n8n
- Zapier
- Retool
- AI operational systems

The platform allows users to:

- visually build workflows
- configure automation nodes
- execute workflows
- integrate external services
- manage automations through a scalable SaaS architecture

Long-term vision:
Build an open-source AI workflow orchestration platform capable of AI-generated automations and intelligent operational workflows.

---

# Current Architecture Status

The project is already a functional full-stack SaaS application with:

- frontend
- backend
- database
- authentication
- workflow persistence
- execution engine
- configurable runtime nodes
- draft autosave
- OTP password reset system

---

# Current Tech Stack

## Frontend

- Next.js 14
- React 18
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

## Authentication & Security

- JWT authentication
- Protected routes
- Session persistence
- User isolation/security
- OTP password reset
- Resend email API

## Workflow Runtime

- Workflow execution engine
- Sequential graph traversal
- Configurable execution nodes
- Runtime execution logs
- Draft autosave using localStorage

---

# Completed Phases

## Phase 1 — Frontend MVP

Completed:

- Landing page
- Dashboard UI
- Workflow builder UI
- React Flow integration
- Routing
- Responsive layout
- Theme support
- Frontend stabilization

---

## Phase 2 — Backend + Authentication

Completed:

- NestJS backend
- MySQL + Prisma
- JWT authentication
- User registration/login
- Protected routes
- User management
- Frontend/backend auth integration

---

## Phase 3 — Workflow CRUD + Persistence

Completed:

- Workflow database schema
- Workflow CRUD APIs
- Workflow save/load/update/delete
- Workflow duplication
- React Flow persistence
- Frontend/backend workflow integration
- User-isolated workflows
- Auth/session stabilization
- Draft autosave
- Real OTP password reset flow
- Workflow security fixes

---

## Phase 4A — Workflow Execution Engine

Completed:

- Workflow runtime engine
- Sequential node execution
- Graph traversal
- Runtime execution flow
- Execution logging
- Error handling
- Manual workflow execution

Supported runtime nodes:

- Manual Trigger
- Delay Node
- HTTP Request Node
- Log Node

---

## Phase 4B — Configurable Node System

Completed:

- Dynamic node configuration
- Config sidebar/panel
- Runtime config persistence
- Configurable HTTP requests
- Configurable delay nodes
- Configurable log nodes
- Config persistence in workflow state

---

# Completed Phase

## Phase 5A — Real Integrations MVP

Current goal:
Add real-world integrations into workflow runtime.

Initial integrations planned:

- Webhook Trigger Node
- Discord Webhook Node

Future integrations:

- Telegram Bot API
- Gmail API
- Google Sheets API
- GitHub API

---

# Engineering Philosophy

IMPORTANT RULES:

- Build incrementally
- Avoid overengineering
- Keep localhost stable
- Use stable package versions only
- Preserve architecture stability
- Fix bugs before adding complexity
- Prefer modular scalable systems

IMPORTANT:
Do NOT introduce:

- microservices
- Kafka
- distributed execution
- enterprise scaling complexity

until core architecture is fully stable.

---

# Current Product Capabilities

The platform currently supports:

- visual workflow building
- workflow persistence
- configurable runtime nodes
- workflow execution
- authentication/security
- autosave draft recovery
- OTP-based password reset
- runtime execution logs

---

# Completed Phase

## Phase 5B

PHASE 5B — SMART LEADOPS AUTOMATION SYSTEM

IMPORTANT:
Phase 5A integration foundation is completed.

Current platform already supports:

- workflow execution engine
- configurable nodes
- webhook triggers
- external integrations
- workflow persistence
- auth/security

Now build a focused business automation use case.

GOAL:
Transform AutonomousOps AI from generic workflow tool into a business operations automation platform.

Build:
SMART LEAD QUALIFICATION + CRM AUTOMATION

IMPORTANT:
Do NOT overengineer.
Do NOT add many unrelated integrations.
Focus on solving one real business problem extremely well.

MAIN BUSINESS PROBLEM:
Small businesses lose leads because:

- lead data is scattered
- no qualification logic
- no automatic categorization
- poor lead visibility
- manual CRM entry

BUILD THESE NODES:

1. Lead Intake Node
   Receives lead submission data

Fields:

- name
- email
- company
- source
- message
- budget

---

2. Lead Scoring Node

Configurable scoring rules:

- budget thresholds
- keyword detection
- source weighting
- priority classification

Outputs:

- hot lead
- warm lead
- cold lead

---

3. Google Sheets CRM Node

Append structured lead rows into sheet

Columns:

- timestamp
- name
- company
- score
- priority
- source
- status

---

4. Notification Node

Send internal alert when:

- hot lead detected
- high-value lead arrives

---

5. Lead Status Router

Conditional routing:

- hot leads → immediate alert
- warm leads → CRM only
- cold leads → archive

EXECUTION REQUIREMENTS:

- workflow runtime must process lead data dynamically
- scoring should affect downstream routing
- all node outputs should flow through execution graph

FRONTEND REQUIREMENTS:

- clean business-focused node config UI
- lead scoring settings panel
- workflow templates for lead automation

IMPORTANT ENGINEERING RULES:

- minimal stable implementation
- preserve architecture
- keep localhost stable
- modular node design

VERY IMPORTANT:
Before generating code:

1. Explain lead automation architecture
2. Explain scoring/routing strategy
3. Explain Google Sheets integration flow
4. Explain execution graph behavior
5. Then generate implementation incrementally

# completed Phase -

PHASE 6 — EXECUTION MONITORING & OBSERVABILITY

IMPORTANT:
Phase 5B is completed.

Current platform already supports:

- workflow execution engine
- configurable runtime nodes
- webhook triggers
- external integrations
- lead automation workflows
- workflow persistence
- auth/security

Now build execution monitoring and observability.

GOAL:
Transform AutonomousOps AI into a production-grade observable automation platform.

IMPORTANT:
Do NOT rewrite execution engine.
Do NOT add AI workflow generation yet.
Do NOT overengineer.

MAIN GOALS:

1. Workflow execution history
2. Detailed execution logs
3. Run inspection
4. Execution status visualization
5. Retry failed executions

BUILD:

1. Execution History Dashboard

Display:

- workflow name
- execution status
- trigger source
- duration
- timestamp
- success/failure

---

2. Execution Detail View

Per execution:

- node-by-node logs
- execution timestamps
- payload snapshots
- outputs/errors
- execution path

---

3. Visual Node Status Tracking

Workflow graph should display:

- success state
- failed state
- running state

---

4. Retry Execution

Allow rerunning failed workflow executions.

---

5. Execution Persistence

Store execution runs in database.

Include:

- workflowId
- executionId
- node results
- runtime duration
- status
- trigger payload
- error traces

FRONTEND REQUIREMENTS:

- execution monitoring dashboard
- run detail modal/page
- visual execution state rendering
- clean observability UI

BACKEND REQUIREMENTS:

- execution run model
- execution logging persistence
- retrieval APIs
- retry execution APIs

IMPORTANT ENGINEERING RULES:

- minimal stable implementation
- preserve architecture
- modular design
- keep localhost stable

VERY IMPORTANT:
Before generating code:

1. Explain execution observability architecture
2. Explain database persistence design
3. Explain frontend monitoring flow
4. Explain node status tracking strategy
5. Then generate implementation incrementally

# completed phase--

PHASE 7 — AI WORKFLOW GENERATION

IMPORTANT:
Phase 6 execution observability is completed.

Current platform already supports:

- workflow execution engine
- configurable runtime nodes
- webhook integrations
- lead automation
- execution monitoring
- retry system
- workflow persistence
- auth/security

Now begin:

AI WORKFLOW GENERATION

GOAL:
Transform AutonomousOps AI into a true AI-native workflow automation platform.

Allow users to generate workflows using natural language.

IMPORTANT:
Start simple.

Do NOT build advanced LLM orchestration.
Do NOT overengineer.
Do NOT introduce multi-agent systems.

Build a practical MVP.

MAIN FEATURES:

1. Natural Language Workflow Generator

User enters prompt like:

"When a lead submits a form, score it and save it to CRM"

System generates workflow graph automatically.

---

2. Prompt-to-Node Mapping

Convert prompts into:

- nodes
- edges
- configurations

using deterministic parsing / lightweight AI logic.

---

3. AI Workflow Suggestions

Suggest:

- missing nodes
- recommended next steps
- optimization hints

---

4. Workflow Template Intelligence

Generate best-fit workflow templates from intent.

---

5. Frontend AI Builder UI

Add:

- prompt input box
- generate workflow button
- preview generated graph
- allow editing after generation

---

BACKEND REQUIREMENTS

Build:

- AI generation module
- prompt parsing service
- workflow graph generator
- template mapper

---

IMPORTANT ENGINEERING RULES

- Minimal stable implementation
- Preserve architecture
- No giant rewrites
- Keep localhost stable

VERY IMPORTANT:

Before generating code:

1. Explain prompt-to-workflow architecture
2. Explain node generation strategy
3. Explain frontend AI generation flow
4. Explain extensibility approach
5. Then implement incrementally

# some bugs in phase 7

PHASE 7 FIXES — AI WORKFLOW GENERATION STABILIZATION

IMPORTANT:
Phase 7 exists partially but is NOT functioning correctly.

Current issues:

1. Prompt understanding is too strict

Examples:

- typing "sheets" fails
- partial keywords fail
- typo tolerance is poor

The generator should handle:

- partial matches
- fuzzy matching
- typo tolerance
- semantic keyword mapping

Examples that should work:

- sheets
- shets
- google shhets
- save to sheet

---

2. Generated workflow disappears after clicking "Use Workflow"

Current broken behavior:

- workflow generation appears
- clicking "Use Workflow" causes blank builder
- workflow only appears after saving

Correct behavior:

- generated workflow must immediately render on canvas
- nodes + edges should appear instantly
- user should edit before saving
- save should persist existing visible graph

---

3. Execution incorrectly shows "Skipped"

Current broken behavior:

- all generated nodes show skipped

Correct behavior:

- trigger nodes should execute successfully
- configured executable nodes should run
- only invalid/unconfigured nodes should skip

---

FIX REQUIREMENTS:

1. Improve prompt parsing
   Implement:

- fuzzy keyword matching
- typo-tolerant parsing
- synonym mapping

2. Fix immediate canvas rendering
   Ensure generated graph hydrates directly into React Flow state

3. Fix execution status logic
   Correct trigger/runtime execution labeling

IMPORTANT:
Do NOT rewrite AI workflow generation architecture.
Do NOT replace with external LLM API yet.

Keep current parser-based system but make it robust and stable.

VERY IMPORTANT:
Before generating code:

1. Explain why prompt parsing is failing
2. Explain why graph render state is lost
3. Explain execution status issue
4. Then generate minimal stable fixes

# Future Roadmap

## Phase 8

PHASE 8 — ADVANCED WORKFLOW ORCHESTRATION

IMPORTANT:
Phase 7 AI workflow generation is completed.

Current platform already supports:

- workflow execution engine
- configurable nodes
- external integrations
- lead automation
- execution monitoring
- AI workflow generation
- workflow persistence
- auth/security

Now build:

ADVANCED WORKFLOW ORCHESTRATION

GOAL:
Transform AutonomousOps AI into a true production-grade workflow orchestration platform.

IMPORTANT:
Do NOT rewrite existing runtime.
Do NOT introduce distributed systems yet.
Do NOT overengineer.

Build advanced orchestration on top of current execution engine.

MAIN FEATURES:

1. CONDITIONAL BRANCHING

Allow workflows to route execution dynamically.

Examples:

- if budget > 5000
- if lead score >= 80
- if API response success

Support:

- true path
- false path

---

2. CONDITIONAL NODE

Create configurable logic node.

Fields:

- left operand
- operator
- right operand

Operators:

- equals
- greater than
- less than
- contains

---

3. PARALLEL EXECUTION

Allow one node to fan out into multiple concurrent paths.

Requirements:

- parallel node execution
- result tracking
- completion synchronization

---

4. RETRY LOGIC

Per node configurable retry settings:

- retry count
- retry delay
- exponential backoff optional

---

5. FAILURE HANDLING

Allow behavior selection:

- stop workflow
- continue
- route to fallback node

---

6. EXECUTION PATH VISUALIZATION

Show actual runtime branch taken during execution.

---

BACKEND REQUIREMENTS

Build:

- branching execution resolver
- parallel execution manager
- retry controller
- failure policy handler

---

FRONTEND REQUIREMENTS

Add:

- conditional node config UI
- branch visualization
- retry settings UI
- execution path rendering

---

IMPORTANT ENGINEERING RULES

- minimal stable implementation
- preserve architecture
- incremental changes only
- keep localhost stable

VERY IMPORTANT:

Before generating code:

1. Explain branching execution architecture
2. Explain parallel execution strategy
3. Explain retry/failure handling flow
4. Explain runtime synchronization
5. Then implement incrementally
