import { Controller, Post, Param, Body, Req, HttpCode } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { WebhooksService } from "./webhooks.service";

@ApiTags("Webhooks")
@Controller("webhooks")
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post(":webhookId")
  @HttpCode(200)
  @ApiOperation({ summary: "Trigger a workflow via webhook" })
  async trigger(
    @Param("webhookId") webhookId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.webhooksService.triggerByWebhookId(webhookId, {
      headers: req.headers as Record<string, string>,
      body,
      method: req.method,
      query: req.query as Record<string, string>,
    });
  }
}
