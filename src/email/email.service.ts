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
import { Resend } from 'resend';

@Injectable()
export class EmailService {
	private resend: Resend;

	constructor(
		private readonly emailService: MailerService,
		@Inject(forwardRef(() => UserService))
		private readonly userService: UserService,
		private readonly redis: RedisService,
	) {
		this.resend = new Resend(process.env.RESEND_API_KEY);
	}

	async sendNewMessage(data: NewMessageDTO) {
		try {
			await this.emailService.sendMail({
				from: 'Hasher-Chat <no-reply@hasher-chat.space>',
				to: data.email,
				subject: 'You have a new message!',
				html: `
					<!DOCTYPE html>
					<html>
					<body style="font-family: sans-serif; background: #051A27; color: white; padding: 32px">
						<div style="max-width: 600px; margin: auto; background: #0A2B44; border-radius: 16px; padding: 24px; box-shadow: 0 8px 20px rgba(0,0,0,0.3);">
							<h1 style="color: #F24822; font-size: 24px;">📨 New Message from ${data.sender_name}</h1>
							<p><strong>Sender UIN:</strong> ${data.sender_uin}</p>
							<p><strong>Time:</strong> ${await getDate()}</p>
							<hr style="border: none; border-top: 1px solid #F24822; margin: 24px 0;" />
							<p style="font-size: 14px; color: #bbb;">You received this email because someone sent you a message on Hasher-chat. Stay connected!</p>
						</div>
					</body>
					</html>
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

			await this.resend.emails.send({
				from: 'Hasher-Chat <no-reply@hasher-chat.space>',
				to: data.email,
				subject: 'OAuth code!',
				html: `
					<!DOCTYPE html>
					<html>
					<body style="font-family: sans-serif; background: #051A27; color: white; padding: 32px">
						<div style="max-width: 600px; margin: auto; background: #0A2B44; border-radius: 16px; padding: 24px; box-shadow: 0 8px 20px rgba(0,0,0,0.3);">
							<h1 style="color: #F24822; font-size: 24px;">🔐 Your Login Code</h1>
							<p style="font-size: 18px;"><strong>Code:</strong> <span style="color: #F24822; font-weight: bold;">${code}</span></p>
							<p>This code is valid for <strong>5 minutes</strong>. Please do not share it with anyone.</p>
							<hr style="border: none; border-top: 1px solid #F24822; margin: 24px 0;" />
							<p style="font-size: 14px; color: #bbb;">Hasher-chat 🧡 — Simple, Secure, and Fast.</p>
						</div>
					</body>
					</html>
				`,
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
			await this.resend.emails.send({
				from: 'Hasher-Chat <no-reply@hasher-chat.space>',
				to: data.email,
				subject: 'Registration information!',
				html: `
					<!DOCTYPE html>
					<html>
					<body style="font-family: sans-serif; background: #051A27; color: white; padding: 32px">
						<div style="max-width: 600px; margin: auto; background: #0A2B44; border-radius: 16px; padding: 24px; box-shadow: 0 8px 20px rgba(0,0,0,0.3);">
							<h1 style="color: #F24822; font-size: 24px;">🎉 Welcome to Hasher-chat!</h1>
							<p>Your account has been successfully registered.</p>
							<p><strong>UIN:</strong> <span style="color: #F24822; font-weight: bold;">${data.uin}</span></p>
							<p>Use this UIN on the login page to access your account.</p>
							<hr style="border: none; border-top: 1px solid #F24822; margin: 24px 0;" />
							<p style="font-size: 14px; color: #bbb;">Thank you for joining us. Stay safe & chat free 🧡</p>
						</div>
					</body>
					</html>
				`,
			});
		} catch (e) {
			throw new HttpException(
				`Error while sending email: ${e}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
