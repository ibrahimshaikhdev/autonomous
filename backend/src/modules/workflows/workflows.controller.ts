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
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { WorkflowsService } from "./workflows.service";
import { CreateWorkflowDto } from "./dto/create-workflow.dto";
import { UpdateWorkflowDto } from "./dto/update-workflow.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@ApiTags("Workflows")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("workspaces/:workspaceId/workflows")
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new workflow" })
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
  @ApiOperation({ summary: "List all workflows in a workspace" })
  findAll(@Param("workspaceId") workspaceId: string, @Req() req) {
    return this.workflowsService.findAll(workspaceId, req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a workflow by ID" })
  findOne(@Param("id") id: string, @Param("workspaceId") workspaceId: string, @Req() req) {
    return this.workflowsService.findOne(id, workspaceId, req.user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a workflow" })
  update(
    @Param("id") id: string,
    @Param("workspaceId") workspaceId: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
    @Req() req,
  ) {
    return this.workflowsService.update(id, workspaceId, req.user.id, updateWorkflowDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a workflow" })
  remove(@Param("id") id: string, @Param("workspaceId") workspaceId: string, @Req() req) {
    return this.workflowsService.remove(id, workspaceId, req.user.id);
  }

  @Post(":id/duplicate")
  @ApiOperation({ summary: "Duplicate a workflow" })
  duplicate(
    @Param("id") id: string,
    @Param("workspaceId") workspaceId: string,
    @Req() req,
  ) {
    return this.workflowsService.duplicate(id, req.user.id, workspaceId);
  }
}
