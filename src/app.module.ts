import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ChatsModule } from './chats/chats.module';
import { EmailModule } from './email/email.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PremiumModule } from './premium/premium.module';

@Module({
	imports: [
		UserModule,
		ChatsModule,
		EmailModule,
		ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
		RedisModule,
		AuthModule,
		PremiumModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
