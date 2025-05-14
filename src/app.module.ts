import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ChatsModule } from './chats/chats.module';
import { EmailModule } from './email/email.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';

@Module({
	imports: [
		UserModule,
		ChatsModule,
		EmailModule,
		ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
		RedisModule,
	],
})
export class AppModule {}
