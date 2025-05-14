import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AddUserDto, DeleteUserDto, UpdateUserDto } from './dto/user.dto';
import { uinGenerator } from './generators/uin.generator';

@Injectable()
export class UserService {
	constructor(private readonly prisma: PrismaService) {}

	async addUser(user: AddUserDto) {
		try {
			await this.prisma.user.create({
				data: {
					uin: String(uinGenerator()),
					...user,
				},
			});
		} catch (e) {
			throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
		}
	}

	async findUserByUIN(uin: string) {
		try {
			const user = await this.prisma.user.findUnique({
				where: {
					uin: uin,
				},
			});
			return user;
		} catch (e) {
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
			});
			return user;
		} catch (e) {
			throw new HttpException(
				'No user based on the provided user name',
				HttpStatus.NOT_FOUND,
			);
		}
	}

	async updateUser(user: UpdateUserDto, uin: string) {
		try {
			await this.prisma.user.update({
				where: {
					uin: uin,
				},
				data: {
					...user,
				},
			});
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
					sended_chats: true,
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
						sended_chats: true,
						received_chats: true,
						sended_messages: true,
						received_messages: true,
					},
				});
			}
		} catch (e) {
			throw new HttpException(e, HttpStatus.BAD_REQUEST);
		}
	}
}
