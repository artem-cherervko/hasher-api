import { Body, Controller, Patch, Get, Query, UseGuards } from '@nestjs/common';
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

	@UseGuards(JwtAuthGuard)
	@Patch('deleteMessage')
	async deleteMessage(@Query('message_id') message_id: string) {
		return await this.chatsService.deleteMessage(message_id);
	}

	@UseGuards(JwtAuthGuard)
	@Get('getAllChats')
	async getAllChats(@Query('uin') uin: string) {
		return await this.chatsService.getAllChats(uin);
	}

	@UseGuards(JwtAuthGuard)
	@Get('getAllMessages')
	async getAllMessages(
		@Query('uin') uin: string,
		@Query('sender') sender: string,
	) {
		return await this.chatsService.getAllMessagesFromChat(uin, sender);
	}

	@Get('getChatUserName')
	async getChatUserName(@Query('uin') uin: string) {
		return await this.chatsService.getChatUserName(uin);
	}

	@UseGuards(JwtAuthGuard)
	@Patch('readAllMessages')
	async readAllMessages(
		@Query('chat_with_uin') chat_with_uin: string,
		@Query('uin') uin: string,
	) {
		return await this.chatsService.readAllMessages(chat_with_uin, uin);
	}
}
