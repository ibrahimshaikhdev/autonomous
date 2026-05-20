import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateWorkflowDto } from "./dto/create-workflow.dto";
import { UpdateWorkflowDto } from "./dto/update-workflow.dto";

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    workspaceId: string,
    createWorkflowDto: CreateWorkflowDto,
  ) {
    return this.prisma.workflow.create({
      data: {
        ...createWorkflowDto,
        user: { connect: { id: userId } },
        workspace: { connect: { id: workspaceId } },
      },
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.workflow.findMany({
      where: { workspaceId },
    });
  }

  async findOne(id: string, workspaceId: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id, workspaceId },
    });
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    return workflow;
  }

  async update(
    id: string,
    workspaceId: string,
    updateWorkflowDto: UpdateWorkflowDto,
  ) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id, workspaceId },
    });
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    return this.prisma.workflow.update({
      where: { id },
      data: updateWorkflowDto,
    });
  }

  async remove(id: string, workspaceId: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id, workspaceId },
    });
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    await this.prisma.workflow.delete({
      where: { id },
    });
  }

  async duplicate(id: string, userId: string, workspaceId: string) {
    const workflowToDuplicate = await this.prisma.workflow.findUnique({
      where: { id, workspaceId },
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
