import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateWorkflowDto } from "./dto/create-workflow.dto";
import { UpdateWorkflowDto } from "./dto/update-workflow.dto";

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService) {}

  async validateWorkspaceMembership(userId: string, workspaceId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, workspaceId },
    });
    if (!user) {
      throw new ForbiddenException("You do not have access to this workspace");
    }
  }

  async create(
    userId: string,
    workspaceId: string,
    createWorkflowDto: CreateWorkflowDto,
  ) {
    await this.validateWorkspaceMembership(userId, workspaceId);
    return this.prisma.workflow.create({
      data: {
        ...createWorkflowDto,
        user: { connect: { id: userId } },
        workspace: { connect: { id: workspaceId } },
      },
    });
  }

  async findAll(workspaceId: string, userId: string) {
    await this.validateWorkspaceMembership(userId, workspaceId);
    return this.prisma.workflow.findMany({
      where: { workspaceId, userId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findOne(id: string, workspaceId: string, userId: string) {
    await this.validateWorkspaceMembership(userId, workspaceId);
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, workspaceId, userId },
    });
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    return workflow;
  }

  async update(
    id: string,
    workspaceId: string,
    userId: string,
    updateWorkflowDto: UpdateWorkflowDto,
  ) {
    await this.validateWorkspaceMembership(userId, workspaceId);
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, workspaceId, userId },
    });
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    return this.prisma.workflow.update({
      where: { id },
      data: updateWorkflowDto,
    });
  }

  async remove(id: string, workspaceId: string, userId: string) {
    await this.validateWorkspaceMembership(userId, workspaceId);
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, workspaceId, userId },
    });
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    await this.prisma.workflow.delete({
      where: { id },
    });
    return { success: true };
  }

  async duplicate(id: string, userId: string, workspaceId: string) {
    await this.validateWorkspaceMembership(userId, workspaceId);
    const workflowToDuplicate = await this.prisma.workflow.findFirst({
      where: { id, workspaceId, userId },
    });

    if (!workflowToDuplicate) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    const newWorkflowName = `${workflowToDuplicate.name} (Copy)`;

    return this.prisma.workflow.create({
      data: {
        name: newWorkflowName,
        description: workflowToDuplicate.description,
        nodes: workflowToDuplicate.nodes as any,
        edges: workflowToDuplicate.edges as any,
        isPublic: workflowToDuplicate.isPublic,
        user: { connect: { id: userId } },
        workspace: { connect: { id: workspaceId } },
      },
    });
  }
}
