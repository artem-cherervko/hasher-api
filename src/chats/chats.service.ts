import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma.service';
import { UpdateMessageDTO } from './dto/chats.dto';

@Injectable()
export class ChatsService {
	constructor(
		private readonly userService: UserService,
		private readonly prismaService: PrismaService,
	) {}

	async addMessage(data: {
		sender_uin: string;
		receiver_uin: string;
		message: string;
	}) {
		if (data.sender_uin === data.receiver_uin) {
			throw new HttpException(
				"The sender's UIN must not match the recipient's UIN",
				HttpStatus.BAD_REQUEST,
			);
		} else {
			const [sender, receiver] = await Promise.all([
				await this.userService.findUserByUIN(data.sender_uin),
				await this.userService.findUserByUIN(data.receiver_uin),
			]);

			let chat = await this.prismaService.chat.findFirst({
				where: {
					OR: [
						{ chat_user_one_id: sender?.id, chat_user_two_id: receiver?.id },
						{ chat_user_one_id: receiver?.id, chat_user_two_id: sender?.id },
					],
				},
			});

			if (!receiver && !sender) {
				throw new HttpException('No users found', HttpStatus.BAD_REQUEST);
			} else {
				if (!chat) {
					let chat = await this.prismaService.chat.create({
						data: {
							chat_user_one_id: String(sender?.id),
							chat_user_two_id: String(receiver?.id),
						},
					});
					await this.prismaService.message.create({
						data: {
							chat_id: chat.id,
							sended_by_id: String(sender?.id),
							received_by_id: String(receiver?.id),
							content: data.message,
						},
					});
				} else {
					await this.prismaService.message.create({
						data: {
							chat_id: chat.id,
							sended_by_id: String(sender?.id),
							received_by_id: String(receiver?.id),
							content: data.message,
						},
					});
				}
			}
		}
	}

	async updateMessage(data: UpdateMessageDTO) {
		try {
			const message = await this.prismaService.message.findUnique({
				where: {
					id: data.id,
				},
			});

			if (!message) {
				throw new HttpException('No message found', HttpStatus.NOT_FOUND);
			} else {
				await this.prismaService.message.update({
					where: {
						id: data.id,
					},
					data: {
						content: data.new_text,
					},
				});

				return {
					status: HttpStatus.OK,
					message: 'Message updated successfully',
				};
			}
		} catch (e) {
			throw new HttpException(`Error ${e}`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
