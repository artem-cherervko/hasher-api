import {
	forwardRef,
	HttpException,
	HttpStatus,
	Inject,
	Injectable,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { NewMessageDTO, OAuthDTO } from './dto/emails.dto';
import { UserService } from '../user/user.service';
import { getDate } from '../configs/dayjs';
import { generateCode } from '../configs/generateOAuthCode';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class EmailService {
	constructor(
		private readonly emailService: MailerService,
		@Inject(forwardRef(() => UserService))
		private readonly userService: UserService,
		private readonly redis: RedisService,
	) {}

	async sendNewMessage(data: NewMessageDTO) {
		try {
			await this.emailService.sendMail({
				to: data.email,
				subject: 'You have a new message!',
				html: `<h1>A new message from ${data.sender_name}</h1>
							 <h3>Sender UIN: ${data.sender_uin}</h3>
							 <p>time: ${await getDate()}</p>
				`,
			});
		} catch (e) {
			throw new HttpException(
				`An error occurred while sending email: ${e}`,
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	async sendOAuth(data: OAuthDTO) {
		try {
			const code = await generateCode();
			await this.redis.addWithExpiry(
				`${process.env.REDIS_PREFIX}:${data.email}`,
				String(code),
				60 * 5,
			);
			await this.emailService.sendMail({
				to: data.email,
				subject: 'OAuth code!',
				html: `<h1>OAuth code!</h1> <p>Code: ${code}</p> <p>This code will expire in 5 minutes!</p>`,
			});
			return {
				status: HttpStatus.OK,
				message: 'Email sent',
			};
		} catch (e) {
			throw new HttpException(
				`Error while sending email: ${e}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async sendCredentials(data: { uin: string; email: string }) {
		try {
			await this.emailService.sendMail({
				to: data.email,
				subject: 'Registration information!',
				html: `<h1>Hello, account successful registered!</h1> <p>UIN: ${data.uin}</p> <p>This UIN you must input in login page.</p> <p><bold>Have a nice day!)</bold></p>`,
			});
		} catch (e) {
			throw new HttpException(
				`Error while sending email: ${e}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
