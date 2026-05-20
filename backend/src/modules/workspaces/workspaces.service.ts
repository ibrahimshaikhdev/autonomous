import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workspace: true,
      },
    });

    if (!user || !user.workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return user.workspace;
  }

  async getWorkspaceMembers(workspaceId: string) {
    const users = await this.prisma.user.findMany({
      where: { workspaceId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return users;
  }
}