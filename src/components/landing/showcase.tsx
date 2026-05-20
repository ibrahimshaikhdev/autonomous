"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

const nodes = [
  { name: "Gmail Trigger", x: 50, color: "bg-red-500/20 border-red-500" },
  { name: "AI Classifier", x: 250, color: "bg-purple-500/20 border-purple-500" },
  { name: "Save to CRM", x: 450, color: "bg-blue-500/20 border-blue-500" },
  { name: "Send WhatsApp", x: 650, color: "bg-green-500/20 border-green-500" },
  { name: "Generate Invoice", x: 850, color: "bg-yellow-500/20 border-yellow-500" },
];

export function Showcase() {
  return (
    <section id="showcase" className="py-24 border-y border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Visual Workflow Automation
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            See how easily you can build complex automations with our intuitive drag-and-drop interface.
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl rounded-xl border border-border bg-background p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Lead Qualification Pipeline</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
              Active
            </span>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between overflow-x-auto pb-8">
              {nodes.map((node, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`relative flex flex-col items-center px-4 py-3 rounded-lg border-2 ${node.color} bg-card min-w-[120px]`}>
                    <div className="text-2xl mb-2">
                      {index === 0 ? "📧" : index === 1 ? "🧠" : index === 2 ? "💾" : index === 3 ? "📱" : "📄"}
                    </div>
                    <span className="text-xs font-medium text-center">{node.name}</span>
                  </div>
                  {index < nodes.length - 1 && (
                    <div className="absolute top-1/2 -right-16 w-16 border-t-2 border-dashed border-border" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">94.5%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">1,247</div>
                  <div className="text-sm text-muted-foreground">Total Runs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">45ms</div>
                  <div className="text-sm text-muted-foreground">Avg. Duration</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Link href="/workflows/builder">
              <Button size="sm">View Workflow</Button>
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              Explore More Workflows
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}