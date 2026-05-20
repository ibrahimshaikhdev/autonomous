"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground mb-6">
            <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            Now with AI-powered workflow suggestions
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Automate Your Business with
            <span className="text-primary"> Intelligent Workflows</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Build powerful automated workflows with our visual editor. Connect triggers,
            actions, AI agents, and integrations in minutes — no coding required.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="px-8">
                Start Building Free
              </Button>
            </Link>
            <Link href="#showcase">
              <Button variant="outline" size="lg" className="px-8">
                See It In Action
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required · Free plan includes 5 workflows
          </p>
        </div>

        <div className="mt-20 relative mx-auto max-w-5xl">
          <div className="rounded-xl border border-border bg-card/50 p-2">
            <div className="rounded-lg bg-background overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border p-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 text-center text-xs text-muted-foreground">
                  AutonomousOps Workflow Builder
                </div>
              </div>
              <div className="aspect-[16/9] bg-gradient-to-br from-card to-background flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-6xl mb-4">⚡</div>
                  <p className="text-lg">Workflow Canvas Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}