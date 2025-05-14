import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { NewMessageDTO, OAuthDTO } from './dto/emails.dto';
import { UserService } from '../user/user.service';
import { getDate } from '../configs/dayjs';
import { generateCode } from '../configs/generateOAuthCode';

@Injectable()
export class EmailService {
	constructor(
		private readonly emailService: MailerService,
		private readonly userService: UserService,
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
			await this.emailService.sendMail({
				to: data.email,
				subject: 'OAuth code!',
				html: `<h1>OAuth code!</h1> <p>Code: ${await generateCode()}</p>`,
			});
		} catch (e) {
			throw new HttpException(
				`Error while sending email: ${e}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
