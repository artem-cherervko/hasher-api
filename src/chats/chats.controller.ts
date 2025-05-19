import { Body, Controller, Patch, Query, UseGuards } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/guards/jwt.auth';

@Controller('chats')
export class ChatsController {
	constructor(private readonly chatsService: ChatsService) {}

	@UseGuards(JwtAuthGuard)
	@Patch('updateMessage')
	async updateMessage(
		@Query('message_id') message_id: string,
		@Body() new_text: string,
	) {
		return await this.chatsService.updateMessage({
			id: message_id,
			new_text: new_text,
		});
	}
}
