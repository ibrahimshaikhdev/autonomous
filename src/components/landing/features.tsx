"use client";

const features = [
  {
    icon: "🎯",
    title: "Visual Workflow Builder",
    description: "Drag and drop nodes to create powerful automations. No coding required — just connect the dots.",
  },
  {
    icon: "🤖",
    title: "AI-Powered Intelligence",
    description: "Integrate AI agents to classify, analyze, and generate responses. Let AI handle the complex decisions.",
  },
  {
    icon: "⚡",
    title: "Real-Time Execution",
    description: "Monitor your workflows in real-time. See exactly what's happening at every step of the process.",
  },
  {
    icon: "🔗",
    title: "100+ Integrations",
    description: "Connect to your favorite tools — Gmail, Slack, Salesforce, Stripe, and many more.",
  },
  {
    icon: "📊",
    title: "Advanced Analytics",
    description: "Track performance, identify bottlenecks, and optimize your workflows with detailed insights.",
  },
  {
    icon: "🔄",
    title: "Smart Retries",
    description: "Automatic error handling with intelligent retry logic ensures your workflows stay reliable.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Automate
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed for modern teams. Build, deploy, and scale your automations with confidence.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}