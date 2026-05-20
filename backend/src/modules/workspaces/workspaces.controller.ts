import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Get()
  async getWorkspace(@Request() req: any) {
    return this.workspacesService.findByUserId(req.user.id);
  }

  @Get('members')
  async getMembers(@Request() req: any) {
    const workspace = await this.workspacesService.findByUserId(req.user.id);
    return this.workspacesService.getWorkspaceMembers(workspace.id);
  }
}