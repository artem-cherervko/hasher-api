import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma.service';
import { MessageDTO, UpdateMessageDTO } from './dto/chats.dto';

@Injectable()
export class ChatsService {
	constructor(
		private readonly userService: UserService,
		private readonly prismaService: PrismaService,
	) {}

	async addMessage(data: MessageDTO) {
		const [sender, receiver] = await this.prismaService.user.findMany({
			where: {
				uin: {
					in: [data.sender_uin, data.receiver_uin],
				},
			},
			orderBy: {
				uin: 'asc',
			},
		});

		if (!sender && !receiver) {
			throw new HttpException('No users found', HttpStatus.NOT_FOUND);
		} else {
			const chat = await this.prismaService.chat.findMany({
				where: {
					first_user_id: sender.id,
					second_user_id: receiver.id,
				},
			});

			if (!chat) {
				try {
					const chat = await this.prismaService.chat.create({
						data: {
							first_user_id: sender.id,
							second_user_id: receiver.id,
						},
					});

					await this.prismaService.message.create({
						data: {
							chat_id: chat.id,
							sended_by_id: sender.id,
							received_by_id: receiver.id,
							content: data.message,
						},
					});

					return {
						status: HttpStatus.OK,
						message: 'Message added successfully',
					};
				} catch (e) {
					throw new HttpException(
						`Error while adding a chat`,
						HttpStatus.INTERNAL_SERVER_ERROR,
					);
				}
			} else {
				await this.prismaService.message.create({
					data: {
						chat_id: chat[0].id,
						sended_by_id: sender.id,
						received_by_id: receiver.id,
						content: data.message,
					},
				});

				return {
					status: HttpStatus.OK,
					message: 'Message added successfully',
				};
			}
		}
	}

	async updateMessage(data: UpdateMessageDTO) {
		try {
			const chat = await this.prismaService.chat.findMany();
		} catch (e) {
			throw new HttpException(`Error ${e}`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
