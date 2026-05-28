import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { executeWorkflow } from "../execution/engine/workflow-engine";

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}

  async triggerByWebhookId(
    webhookId: string,
    requestData: {
      headers: Record<string, string>;
      body: any;
      method: string;
      query: Record<string, string>;
    },
  ) {
    // Find workflow by webhookId
    const workflow = await this.prisma.workflow.findFirst({
      where: { webhookId },
    });

    if (!workflow) {
      throw new NotFoundException(`Webhook not found`);
    }

    // Parse nodes/edges from JSON
    const nodes =
      typeof workflow.nodes === "string"
        ? JSON.parse(workflow.nodes)
        : workflow.nodes;
    const edges =
      typeof workflow.edges === "string"
        ? JSON.parse(workflow.edges)
        : workflow.edges;

    // Build trigger data from the incoming webhook request
    const triggerData = {
      source: "webhook",
      webhookId,
      method: requestData.method,
      headers: requestData.headers,
      query: requestData.query,
      body: requestData.body,
      receivedAt: new Date().toISOString(),
    };

    // Create execution record
    const execution = await this.prisma.execution.create({
      data: {
        workflowId: workflow.id,
        status: "RUNNING",
        triggerData,
        triggerSource: "webhook",
      },
    });

    const startTime = Date.now();

    try {
      const result = await executeWorkflow(nodes, edges, triggerData);
      const duration = Date.now() - startTime;

      const updated = await this.prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: result.status === "success" ? "SUCCESS" : "FAILED",
          outputData: result.outputData || undefined,
          nodeResults: result.nodeResults as any,
          logs: result.logs as any,
          completedAt: new Date(),
          duration,
        },
      });

      return {
        executionId: updated.id,
        status: updated.status,
        logs: result.logs,
        outputData: result.outputData,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      await this.prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: "FAILED",
          logs: [
            {
              timestamp: new Date().toISOString(),
              nodeId: "system",
              nodeName: "System",
              message: `Execution error: ${error.message}`,
              level: "error",
            },
          ] as any,
          completedAt: new Date(),
          duration,
        },
      });

      throw error;
    }
  }
}
