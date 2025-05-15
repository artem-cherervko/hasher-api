import { Body, Controller, Patch, Query } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { PrismaService } from '../prisma.service';

@Controller('chats')
export class ChatsController {
	constructor(
		private readonly chatsService: ChatsService,
		private readonly prismaService: PrismaService,
	) {}

	@Patch('updateMessage')
	async updateMessage(
		@Query('message_id') message_id: string,
		@Body() new_text: string,
	) {}
}
