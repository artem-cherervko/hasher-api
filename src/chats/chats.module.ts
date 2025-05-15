import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsGateway } from './chats.gateway';
import { RedisModule } from '../redis/redis.module';
import { EmailModule } from '../email/email.module';
import { UserModule } from '../user/user.module';
import { PrismaService } from '../prisma.service';
import { ChatsController } from './chats.controller';

@Module({
	imports: [RedisModule, EmailModule, UserModule],
	providers: [ChatsGateway, ChatsService, PrismaService],
	controllers: [ChatsController],
})
export class ChatsModule {}
