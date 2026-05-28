import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { WorkspacesModule } from "./modules/workspaces/workspaces.module";
import { WorkflowsModule } from "./modules/workflows/workflows.module";
import { ExecutionModule } from "./modules/execution/execution.module";
import { WebhooksModule } from "./modules/webhooks/webhooks.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    WorkflowsModule,
    ExecutionModule,
    WebhooksModule,
  ],
})
export class AppModule {}
