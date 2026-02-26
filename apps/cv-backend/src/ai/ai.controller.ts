import { Controller, Post, Body, UseGuards, Param } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('api/ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('chat')
  async chat(
    @Body('messages')
    messages: { role: 'user' | 'assistant'; content: string }[],
    @Body('cvContext') cvContext?: any,
  ) {
    const response = await this.aiService.chatAboutCv(messages, cvContext);
    return { message: response };
  }
}
