import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ExecutionService } from "./execution.service";

@Controller("workspaces/:workspaceId/executions")
@UseGuards(JwtAuthGuard)
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  // POST /api/workspaces/:workspaceId/executions
  // Body: { workflowId, triggerData? }
  @Post()
  async execute(
    @Param("workspaceId") workspaceId: string,
    @Body() body: { workflowId: string; triggerData?: any },
    @Request() req: any,
  ) {
    return this.executionService.execute(
      req.user.id,
      workspaceId,
      body.workflowId,
      body.triggerData,
    );
  }

  // GET /api/workspaces/:workspaceId/executions
  @Get()
  async findAll(
    @Param("workspaceId") workspaceId: string,
    @Query("workflowId") workflowId: string,
    @Query("status") status: string,
    @Request() req: any,
  ) {
    return this.executionService.findAll(req.user.id, workspaceId, workflowId, status);
  }

  // GET /api/workspaces/:workspaceId/executions/stats
  @Get("stats")
  async getStats(
    @Param("workspaceId") workspaceId: string,
    @Request() req: any,
  ) {
    return this.executionService.getStats(req.user.id, workspaceId);
  }

  // POST /api/workspaces/:workspaceId/executions/:id/retry
  @Post(":id/retry")
  async retry(
    @Param("workspaceId") workspaceId: string,
    @Param("id") id: string,
    @Request() req: any,
  ) {
    return this.executionService.retry(req.user.id, workspaceId, id);
  }

  // GET /api/workspaces/:workspaceId/executions/:id
  @Get(":id")
  async findOne(
    @Param("workspaceId") workspaceId: string,
    @Param("id") id: string,
    @Request() req: any,
  ) {
    return this.executionService.findOne(req.user.id, workspaceId, id);
  }
}
