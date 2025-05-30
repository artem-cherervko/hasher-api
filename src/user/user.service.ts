import {
	forwardRef,
	HttpException,
	HttpStatus,
	Inject,
	Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
	AddUserDto,
	DeleteUserDto,
	UpdateUserDto,
	UpdateUserStatusDTO,
} from './dto/user.dto';
import { uinGenerator } from './generators/uin.generator';
import { getDate } from '../configs/dayjs';
import { User } from '../../generated/prisma/index';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class UserService {
	constructor(
		private readonly prisma: PrismaService,
		@Inject(forwardRef(() => EmailService))
		private readonly email: EmailService,
	) {}

	async addUser(data: AddUserDto): Promise<User> {
		try {
			const user = await this.prisma.user.create({
				data: {
					uin: String(await uinGenerator()),
					...data,
				},
			});

			await this.email.sendCredentials({ uin: user.uin, email: user.email });

			return user;
		} catch (e) {
			throw new HttpException(
				`User already exists, ${e}`,
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	async findUserByUIN(uin: string) {
		try {
			const user = await this.prisma.user.findUnique({
				where: {
					uin: uin,
				},
				include: {
					my_chats: true,
					received_chats: true,
					sended_messages: true,
					received_messages: true,
				},
			});
			return user;
		} catch {
			throw new HttpException(
				'No user based on the provided UIN',
				HttpStatus.NOT_FOUND,
			);
		}
	}

	async findUserByUName(user_name: string) {
		try {
			const user = await this.prisma.user.findUnique({
				where: {
					user_name: user_name,
				},
				include: {
					my_chats: true,
					received_chats: true,
					sended_messages: true,
					received_messages: true,
				},
			});
			return user;
		} catch {
			throw new HttpException(
				'No user based on the provided user name',
				HttpStatus.NOT_FOUND,
			);
		}
	}

	async updateUser(user: UpdateUserDto, uin: string) {
		try {
			const { password, ...safeData } = user as Record<string, any>;

			await this.prisma.user.update({
				where: { uin },
				data: safeData,
			});

			return {
				status: HttpStatus.OK,
				response: 'Updated successfully',
			};
		} catch (e) {
			throw new HttpException(
				`An error occurred while updating user: ${e}`,
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	async deleteUser(userDto: DeleteUserDto) {
		try {
			const user = await this.prisma.user.findUnique({
				where: {
					email: userDto.email,
				},
				include: {
					my_chats: true,
					received_chats: true,
					sended_messages: true,
					received_messages: true,
				},
			});

			if (!user) {
				return new HttpException('User not found', HttpStatus.NOT_FOUND);
			} else {
				await this.prisma.user.delete({
					where: {
						email: userDto.email,
					},
					include: {
						my_chats: true,
						received_chats: true,
						sended_messages: true,
						received_messages: true,
					},
				});
			}
		} catch (e) {
			throw new HttpException(String(e), HttpStatus.BAD_REQUEST);
		}
	}

	async updateOnlineStatus(data: UpdateUserStatusDTO) {
		try {
			const user = await this.prisma.user.findUnique({
				where: { uin: data.uin },
			});

			if (!user) {
				return new HttpException('User not found', HttpStatus.NOT_FOUND);
			} else {
				const date = await getDate();

				await this.prisma.user.update({
					where: { uin: data.uin },
					data: {
						isOnline: data.isOnline,
						last_seen: date,
					},
				});
			}
		} catch (e) {
			throw new HttpException(`Error ${e}`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
