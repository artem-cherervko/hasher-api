import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsGateway } from './chats.gateway';
import { RedisModule } from '../redis/redis.module';
import { EmailModule } from '../email/email.module';

@Module({
	imports: [RedisModule, EmailModule],
	providers: [ChatsGateway, ChatsService],
})
export class ChatsModule {}
