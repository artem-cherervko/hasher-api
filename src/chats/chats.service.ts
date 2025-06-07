import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma.service';
import { UpdateMessageDTO } from './dto/chats.dto';
import { getDateObject } from 'src/configs/dayjs';
import * as dayjs from 'dayjs';

@Injectable()
export class ChatsService {
	constructor(
		private readonly userService: UserService,
		private readonly prismaService: PrismaService,
	) {}

	async getAllChats(uin: string) {
		const user = await this.userService.findUserByUIN(uin);
		if (!user) {
			throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		}
		const chats = await this.prismaService.chat.findMany({
			where: {
				OR: [{ chat_user_one_id: user.id }, { chat_user_two_id: user.id }],
			},
			include: {
				chat_user_one: true,
				chat_user_two: true,
			},
		});
		if (!chats || chats.length === 0) {
			throw new HttpException('No chats found', HttpStatus.NOT_FOUND);
		}
		return chats.map((chat) => ({
			id: chat.id,
			chat_user_one_id: chat.chat_user_one_id,
			chat_user_two_id: chat.chat_user_two_id,
			chat_user_one: {
				uin:
					chat.chat_user_one.uin === uin
						? chat.chat_user_two.uin
						: chat.chat_user_one.uin,
				name: chat.chat_user_one.name,
				user_name: chat.chat_user_one.user_name,
				isOnline:
					chat.chat_user_one.uin === uin
						? chat.chat_user_two.isOnline
						: chat.chat_user_one.isOnline,
				last_seen: chat.chat_user_one.last_seen,
			},
			chat_user_two: {
				uin:
					chat.chat_user_two.uin === uin
						? chat.chat_user_one.uin
						: chat.chat_user_two.uin,
				name: chat.chat_user_two.name,
				user_name: chat.chat_user_two.user_name,
				isOnline:
					chat.chat_user_two.uin === uin
						? chat.chat_user_one.isOnline
						: chat.chat_user_two.isOnline,
				last_seen:
					chat.chat_user_two.uin === uin
						? chat.chat_user_one.last_seen
						: chat.chat_user_two.last_seen,
			},
		}));
	}

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

			const chat = await this.prismaService.chat.findFirst({
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
					const chat = await this.prismaService.chat.create({
						data: {
							chat_user_one_id: String(sender?.id),
							chat_user_two_id: String(receiver?.id),
						},
					});
					const message = await this.prismaService.message.create({
						data: {
							chat_id: chat.id,
							sended_by_id: String(sender?.id),
							received_by_id: String(receiver?.id),
							content: data.message,
							created_at: await getDateObject(),
							updated_at: await getDateObject(),
						},
					});
					return message;
				} else {
					const message = await this.prismaService.message.create({
						data: {
							chat_id: chat.id,
							sended_by_id: String(sender?.id),
							received_by_id: String(receiver?.id),
							content: data.message,
							created_at: await getDateObject(),
							updated_at: await getDateObject(),
						},
					});
					return message;
				}
			}
		}
	}

	async updateMessage(data: UpdateMessageDTO) {
		try {
			const message = await this.prismaService.chat.findFirst({
				where: {
					messages: {
						some: {
							id: data.id,
						},
					},
				},
				include: {
					messages: true,
				},
			});

			if (!message) {
				throw new HttpException('No message found', HttpStatus.NOT_FOUND);
			} else {
				await this.prismaService.message.update({
					where: {
						id: message.messages.find((message) => message.id === data.id)?.id,
					},
					data: {
						content: data.new_text['new_text'],
						is_edited: true,
						updated_at: await getDateObject(),
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

	async deleteMessage(message_id: string) {
		try {
			const message = await this.prismaService.chat.findFirst({
				where: {
					messages: {
						some: {
							id: message_id,
						},
					},
				},
				include: {
					messages: true,
				},
			});

			if (!message) {
				throw new HttpException('No message found', HttpStatus.NOT_FOUND);
			} else {
				const message_to_delete = message?.messages.find(
					(message) => message.id === message_id,
				);
				await this.prismaService.message.delete({
					where: {
						id: message_to_delete?.id,
					},
				});

				return {
					status: HttpStatus.OK,
					message: 'Message deleted successfully',
				};
			}
		} catch (e) {
			throw new HttpException(`Error ${e}`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getAllMessagesFromChat(uin: string, sender: string) {
		const user = await this.userService.findUserByUIN(uin);
		const chat_sender = await this.userService.findUserByUIN(sender);

		if (!user || !chat_sender) {
			throw new HttpException('Users not found', HttpStatus.NOT_FOUND);
		}

		const chats = await this.prismaService.chat.findMany({
			where: {
				AND: [
					{
						OR: [
							{ chat_user_one_id: chat_sender.id },
							{ chat_user_one_id: user.id },
						],
					},
					{
						OR: [
							{ chat_user_two_id: user.id },
							{ chat_user_two_id: chat_sender.id },
						],
					},
				],
			},
			include: {
				messages: {
					include: {
						sended_by: true,
						received_by: true,
					},
				},
			},
		});

		if (!chats || chats.length === 0) {
			throw new HttpException('No chats found', HttpStatus.NOT_FOUND);
		}

		return Promise.all(
			chats.map(async (chat) => ({
				chat_id: chat.id,
				messages: await Promise.all(
					chat.messages.map((message) => ({
						id: message.id,
						content: message.content,
						sender: message.sended_by.uin,
						receiver: message.received_by.uin,
						is_read: message.is_read,
						is_edited: message.is_edited,
						created_at: dayjs(message.created_at).format('YYYY.MM.DD HH:mm:ss'),
						updated_at: dayjs(message.updated_at).format('YYYY.MM.DD HH:mm:ss'),
					})),
				),
			})),
		);
	}

	async getChatUserName(uin: string) {
		if (uin === '0') {
			return;
		}
		try {
			const user = await this.userService.findUserByUIN(uin);
			if (!user) {
				throw new HttpException('User not found', HttpStatus.NOT_FOUND);
			}
			return user.name;
		} catch (e) {
			throw new HttpException(`Error ${e}`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async readAllMessages(chat_with_uin: string, uin: string) {
		const user = await this.userService.findUserByUIN(uin);
		const chat_sender = await this.userService.findUserByUIN(chat_with_uin);

		if (!user || !chat_sender) {
			throw new HttpException('Users not found', HttpStatus.NOT_FOUND);
		}

		const chat = await this.prismaService.chat.findFirst({
			where: {
				OR: [
					{ chat_user_one_id: user.id, chat_user_two_id: chat_sender.id },
					{ chat_user_one_id: chat_sender.id, chat_user_two_id: user.id },
				],
			},
		});

		if (!chat) {
			throw new HttpException('Chat not found', HttpStatus.NOT_FOUND);
		}

		try {
			await this.prismaService.message.updateMany({
				where: {
					chat_id: chat.id,
					sended_by_id: chat_sender.id,
					received_by_id: user.id,
				},
				data: {
					is_read: true,
				},
			});

			return {
				status: HttpStatus.OK,
				message: 'Messages read successfully',
			};
		} catch (e) {
			throw new HttpException(
				`Error ${e.message}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
