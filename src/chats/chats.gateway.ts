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

@WebSocketGateway(3002, {
	cors: {
		origin: '*',
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
		const keys = await this.redis.getAll('chats:*');
		for (const key of keys) {
			await this.userService.updateOnlineStatus({ uin: key.split(':')[1] });
			await this.redis.delete(key);
		}
		console.log('[WS] Redis cleaned: chats:*');
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
			}),
				await this.redis.add(`chats:${uin}`, client.id);
			console.log(`[WS] Client connected: uin=${uin}, socket=${client.id}`);
		}
	}

	async handleDisconnect(client: Socket) {
		const keys = await this.redis.getAll('chats:*');

		for (const key of keys) {
			const result = await this.redis.getKey(key);

			if (result.status === 200 && result.data === client.id) {
				await this.userService.updateOnlineStatus({
					uin: key.split(':')[1],
				});

				await this.redis.delete(key);
				console.log(`[WS] Client disconnected: removed key ${key}`);
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
					`chats:${data.receiver_uin}`,
				);
				if (user_online.data === 'null') {
					await this.email.sendNewMessage({
						sender_uin: uin,
						sender_name: user.name,
						email: String(receiver?.email),
					});

					client.emit('message', {
						status: HttpStatus.OK,
						sender: uin,
						message: data.message,
						time: await getDate(),
					});

					return await this.chatsService.addMessage({
						sender_uin: uin,
						receiver_uin: data.receiver_uin,
						message: data.message,
					});
				} else {
					this.server.to(user_online.data).emit('message', {
						status: HttpStatus.OK,
						sender: uin,
						message: data.message,
						time: await getDate(),
					});

					return await this.chatsService.addMessage({
						sender_uin: uin,
						receiver_uin: data.receiver_uin,
						message: data.message,
					});
				}
			}
		} catch (e) {
			throw new HttpException(`Error ${e}`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
