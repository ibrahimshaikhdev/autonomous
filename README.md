# AutonomousOps AI

AutonomousOps AI is an AI-native workflow automation platform inspired by n8n, Zapier, Retool, and AI operational systems. It allows users to visually build workflows, configure automation nodes, execute workflows, integrate external services, and manage automations through a scalable SaaS architecture. The long-term vision is to build an open-source AI workflow orchestration platform capable of AI-generated automations and intelligent operational workflows.
LIVE at https://autonomous-4.vercel.app/
## Current Architecture Status

The project is a functional full-stack SaaS application with a frontend, backend, database, authentication, workflow persistence, execution engine, configurable runtime nodes, draft autosave, and an OTP password reset system.

## Current Tech Stack

### Frontend

- Next.js 14
- React 18
- TypeScript
- TailwindCSS
- React Flow
- shadcn/ui

### Backend

- NestJS
- TypeScript
- REST APIs

### Database

- MySQL
- Prisma ORM

### Authentication & Security

- JWT authentication
- Protected routes
- Session persistence
- User isolation/security
- OTP password reset
- Resend email API

### Workflow Runtime

- Workflow execution engine
- Sequential graph traversal
- Configurable execution nodes
- Runtime execution logs
- Draft autosave using localStorage

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
