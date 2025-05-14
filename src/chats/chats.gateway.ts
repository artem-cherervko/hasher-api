import {
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

@WebSocketGateway({
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
	) {}

	@WebSocketServer()
	server: Server;

	async afterInit() {
		const keys = await this.redis.getAll('chats:*');
		for (const key of keys) {
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

		await this.redis.add(`chats:${uin}`, client.id);
		console.log(`[WS] Client connected: uin=${uin}, socket=${client.id}`);
	}

	async handleDisconnect(client: Socket) {
		const keys = await this.redis.getAll('chats:*');

		for (const key of keys) {
			const result = await this.redis.getKey(key);
			if (result.status === 200 && result.data === client.id) {
				await this.redis.delete(key);
				console.log(`[WS] Client disconnected: removed key ${key}`);
				break;
			}
		}
	}

	@SubscribeMessage('chats')
	async chatsMessages() {}
}
