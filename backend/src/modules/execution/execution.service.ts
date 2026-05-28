import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { executeWorkflow } from "./engine/workflow-engine";

@Injectable()
export class ExecutionService {
  constructor(private prisma: PrismaService) {}

  async execute(userId: string, workspaceId: string, workflowId: string, triggerData?: any, triggerSource?: string) {
    // Validate workspace membership
    const user = await this.prisma.user.findFirst({
      where: { id: userId, workspaceId },
    });
    if (!user) {
      throw new ForbiddenException("You do not have access to this workspace");
    }

    // Load workflow
    const workflow = await this.prisma.workflow.findFirst({
      where: { id: workflowId, workspaceId, userId },
    });
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${workflowId} not found`);
    }

    // Parse nodes/edges from JSON
    const nodes = typeof workflow.nodes === "string" ? JSON.parse(workflow.nodes) : workflow.nodes;
    const edges = typeof workflow.edges === "string" ? JSON.parse(workflow.edges) : workflow.edges;

    // Create execution record (RUNNING)
    const execution = await this.prisma.execution.create({
      data: {
        workflowId,
        status: "RUNNING",
        triggerData: triggerData || undefined,
        triggerSource: triggerSource || "manual",
      },
    });

    const startTime = Date.now();

    try {
      // Run the engine
      const result = await executeWorkflow(nodes, edges, triggerData);
      const duration = Date.now() - startTime;

      // Update execution with results
      const updated = await this.prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: result.status === "success" ? "SUCCESS" : "FAILED",
          outputData: result.outputData || undefined,
          nodeResults: result.nodeResults as any,
          logs: result.logs as any,
          completedAt: new Date(),
          duration,
          errorTrace: result.status === "failed" ? this.extractErrorTrace(result.logs) : null,
        },
      });

      return updated;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Update execution as failed
      const updated = await this.prisma.execution.update({
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
          errorTrace: error.stack || error.message,
        },
      });

      return updated;
    }
  }

  async retry(userId: string, workspaceId: string, executionId: string) {
    // Find the original execution
    const execution = await this.findOne(userId, workspaceId, executionId);

    if (execution.status !== "FAILED") {
      throw new BadRequestException("Only failed executions can be retried");
    }

    // Re-execute with the same trigger data
    return this.execute(
      userId,
      workspaceId,
      execution.workflowId,
      execution.triggerData || undefined,
      "retry",
    );
  }

  private extractErrorTrace(logs: any[]): string | null {
    const errorLogs = logs.filter((l: any) => l.level === "error");
    if (errorLogs.length === 0) return null;
    return errorLogs.map((l: any) => `[${l.nodeName}] ${l.message}`).join("\n");
  }

  async findAll(userId: string, workspaceId: string, workflowId?: string, status?: string) {
    // Validate workspace membership
    const user = await this.prisma.user.findFirst({
      where: { id: userId, workspaceId },
    });
    if (!user) {
      throw new ForbiddenException("You do not have access to this workspace");
    }

    const where: any = {
      workflow: { workspaceId, userId },
    };
    if (workflowId) {
      where.workflowId = workflowId;
    }
    if (status) {
      where.status = status;
    }

    return this.prisma.execution.findMany({
      where,
      include: {
        workflow: { select: { id: true, name: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 100,
    });
  }

  async getStats(userId: string, workspaceId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, workspaceId },
    });
    if (!user) {
      throw new ForbiddenException("You do not have access to this workspace");
    }

    const where = { workflow: { workspaceId, userId } };
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const [total, today, weekSuccess, weekFailed] = await Promise.all([
      this.prisma.execution.count({ where }),
      this.prisma.execution.count({ where: { ...where, startedAt: { gte: todayStart } } }),
      this.prisma.execution.count({ where: { ...where, status: "SUCCESS", startedAt: { gte: weekStart } } }),
      this.prisma.execution.count({ where: { ...where, status: "FAILED", startedAt: { gte: weekStart } } }),
    ]);

    const weekTotal = weekSuccess + weekFailed;
    const successRate = weekTotal > 0 ? Math.round((weekSuccess / weekTotal) * 100) : 100;

    return { total, today, successRate };
  }

  async findOne(userId: string, workspaceId: string, executionId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, workspaceId },
    });
    if (!user) {
      throw new ForbiddenException("You do not have access to this workspace");
    }

    const execution = await this.prisma.execution.findFirst({
      where: {
        id: executionId,
        workflow: { workspaceId, userId },
      },
      include: {
        workflow: { select: { id: true, name: true, nodes: true, edges: true } },
      },
    });

    if (!execution) {
      throw new NotFoundException(`Execution with ID ${executionId} not found`);
    }

    return execution;
  }
}
