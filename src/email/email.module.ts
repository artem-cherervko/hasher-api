import { forwardRef, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
	imports: [
		MailerModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				transport: {
					host: config.get<string>('EMAIL_HOST'),
					port: Number(config.get<string>('EMAIL_PORT')),
					auth: {
						user: config.get<string>('EMAIL_USERNAME'),
						pass: config.get<string>('EMAIL_PASSWORD'),
					},
				},
				defaults: {
					from: 'Hasher <hasher.development@gmail.com>',
				},
			}),
		}),
		forwardRef(() => UserModule),
		RedisModule,
	],
	providers: [EmailService],
	exports: [EmailService],
})
export class EmailModule {}
