import {
	ConnectedSocket,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatsService } from './chats.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { Body, HttpException, HttpStatus } from '@nestjs/common';
import { NewMessageDTO } from './dto/chats.dto';
import { UserService } from '../user/user.service';
import { getDate } from '../configs/dayjs';

@WebSocketGateway({
	cors: {
		origin: process.env.ORIGIN,
	},
})
export class ChatsGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	constructor(
		private readonly chatsService: ChatsService,
		private readonly redis: RedisService,
		private readonly email: EmailService,
		private readonly userService: UserService,
	) {}

	@WebSocketServer()
	server: Server;

	async afterInit() {
		const keys = await this.redis.getAll(`${process.env.REDIS_PREFIX}:*`);
		for (const key of keys) {
			await this.userService.updateOnlineStatus({
				uin: key.split(':')[1],
				isOnline: false,
			});
			await this.redis.delete(key);
		}
		// console.log(`[WS] Redis cleaned: ${process.env.REDIS_PREFIX}:*`);
	}

	async handleConnection(client: Socket) {
		const uin = client.handshake.query?.uin as string;

		if (!uin) {
			console.warn('[WS] UIN not provided in query. Disconnecting client.');
			client.disconnect();
			return;
		}

		const user = await this.userService.findUserByUIN(uin);
		if (!user) {
			console.warn('[WS] UIN not walid. Disconnecting client.');
			client.disconnect();
			return;
		} else {
			if (user.isBlocked) {
				client.emit('message', {
					message: 'You are blocked',
				});
				client.disconnect();
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			await this.userService.updateOnlineStatus({
				uin: uin,
				isOnline: true,
			}),
				await this.redis.add(`${process.env.REDIS_PREFIX}:${uin}`, client.id);
			// console.log(`[WS] Client connected: uin=${uin}, socket=${client.id}`);
		}
	}

	async handleDisconnect(client: Socket) {
		const keys = await this.redis.getAll(`${process.env.REDIS_PREFIX}:*`);

		for (const key of keys) {
			const result = await this.redis.getKey(key);

			if (String(result.data) === client.id) {
				await this.userService.updateOnlineStatus({
					uin: key.split(':')[1],
					isOnline: false,
				});

				await this.redis.delete(key);
				// console.log(`[WS] Client disconnected: removed key ${key}`);
				break;
			}
		}
	}

	@SubscribeMessage('chat')
	async chatsMessages(
		@Body() data: NewMessageDTO,
		@ConnectedSocket() client: Socket,
	) {
		try {
			const uin = client.handshake.query?.uin as string;

			const user = await this.userService.findUserByUIN(uin);
			const receiver = await this.userService.findUserByUIN(data.receiver_uin);
			if (!user || !receiver) {
				client.emit('Sender uin or receiver uin not found');
				client.disconnect();
			} else {
				const user_online = await this.redis.getKey(
					`${process.env.REDIS_PREFIX}:${data.receiver_uin}`,
				);
				const message = await this.chatsService.addMessage({
					sender_uin: uin,
					receiver_uin: data.receiver_uin,
					message: data.message,
				});
				if (user_online.data === 'null') {
					await this.email.sendNewMessage({
						sender_uin: uin,
						sender_name: user.name,
						email: String(receiver?.email),
					});

					client.emit('message', {
						status: HttpStatus.OK,
						sender: uin,
						message_id: message.id,
						message: data.message,
						time: await getDate(),
					});

					return message;
				} else {
					this.server.to(user_online.data).emit('message', {
						status: HttpStatus.OK,
						sender: uin,
						message_id: message.id,
						message: data.message,
						time: await getDate(),
					});

					client.emit('message', {
						status: HttpStatus.OK,
						sender: uin,
						message_id: message.id,
						message: data.message,
						time: await getDate(),
					});

					return message;
				}
			}
		} catch (e) {
			throw new HttpException(`Error ${e}`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@SubscribeMessage('deleteMessage')
	async deleteMessage(
		@Body() data: { chat_with_uin: string; uin: string },
		@ConnectedSocket() client: Socket,
	) {
		const uin = client.handshake.query?.uin as string;

		const user = await this.userService.findUserByUIN(uin);
		const receiver = await this.userService.findUserByUIN(data.chat_with_uin);
		if (!user || !receiver) {
			client.emit('Sender uin or receiver uin not found');
			client.disconnect();
		} else {
			const user_online = await this.redis.getKey(
				`${process.env.REDIS_PREFIX}:${data.chat_with_uin}`,
			);

			if (user_online.data === 'null') {
				client.emit('delete', {
					status: HttpStatus.OK,
					message: 'Deleted',
				});
			} else {
				this.server.to(user_online.data).emit('delete', {
					status: HttpStatus.OK,
					message: 'Deleted',
				});
			}
		}
	}

	@SubscribeMessage('editMessage')
	async editMessage(
		@Body() data: { chat_with_uin: string; uin: string },
		@ConnectedSocket() client: Socket,
	) {
		const uin = client.handshake.query?.uin as string;

		const user = await this.userService.findUserByUIN(uin);
		const receiver = await this.userService.findUserByUIN(data.chat_with_uin);
		if (!user || !receiver) {
			client.emit('Sender uin or receiver uin not found');
			client.disconnect();
		} else {
			const user_online = await this.redis.getKey(
				`${process.env.REDIS_PREFIX}:${data.chat_with_uin}`,
			);

			if (user_online.data === 'null') {
				client.emit('edit', {
					status: HttpStatus.OK,
					message: 'Edited',
				});
			} else {
				this.server.to(user_online.data).emit('edit', {
					status: HttpStatus.OK,
					message: 'Edited',
				});
			}
		}
	}

	@SubscribeMessage('typingMessage')
	async typingMessage(
		@Body() data: { chat_with_uin: string },
		@ConnectedSocket() client: Socket,
	) {
		const user = await this.userService.findUserByUIN(data.chat_with_uin);

		if (user) {
			if (user.isOnline !== true) {
				client.emit('typing', {
					status: 400,
					message: 'Error! User not online!',
				});
			} else {
				this.server.to(data.chat_with_uin).emit('typing', {
					status: 200,
					message: 'I`m typing!',
				});
			}
		} else {
			client.emit('typing', {
				status: 400,
				message: 'Error! User not found!',
			});
		}
	}
}
