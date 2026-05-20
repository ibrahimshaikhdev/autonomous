import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from "@nestjs/common";
import { WorkflowsService } from "./workflows.service";
import { CreateWorkflowDto } from "./dto/create-workflow.dto";
import { UpdateWorkflowDto } from "./dto/update-workflow.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("workspaces/:workspaceId/workflows")
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  create(
    @Param("workspaceId") workspaceId: string,
    @Req() req,
    @Body() createWorkflowDto: CreateWorkflowDto,
  ) {
    return this.workflowsService.create(
      req.user.id,
      workspaceId,
      createWorkflowDto,
    );
  }

  @Get()
  findAll(@Param("workspaceId") workspaceId: string) {
    return this.workflowsService.findAll(workspaceId);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Param("workspaceId") workspaceId: string) {
    return this.workflowsService.findOne(id, workspaceId);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Param("workspaceId") workspaceId: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
  ) {
    return this.workflowsService.update(id, workspaceId, updateWorkflowDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Param("workspaceId") workspaceId: string) {
    return this.workflowsService.remove(id, workspaceId);
  }

  @Post(":id/duplicate")
  duplicate(
    @Param("id") id: string,
    @Param("workspaceId") workspaceId: string,
    @Req() req,
  ) {
    return this.workflowsService.duplicate(id, req.user.id, workspaceId);
  }
}
