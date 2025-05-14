import {
	Body,
	Controller,
	Get,
	HttpException,
	HttpStatus,
	Patch,
	Post,
	Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AddUserDto, UpdateUserDto } from './dto/user.dto';
import * as argon2 from 'argon2';

@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Post('add')
	async addUser(@Body() user: AddUserDto) {
		try {
			user.password = await argon2.hash(user.password);
			return await this.userService.addUser(user);
		} catch (e) {
			throw new HttpException(e, HttpStatus.BAD_REQUEST);
		}
	}

	@Get('getUser')
	async getUser(
		@Query() data: { uin: string | null; user_name: string | null },
	) {
		if (!data)
			throw new HttpException('No data provided!', HttpStatus.BAD_REQUEST);
		else if (data.uin) {
			const user_by_uin = await this.userService.findUserByUIN(data.uin);
			if (!user_by_uin)
				throw new HttpException('User not found', HttpStatus.NOT_FOUND);
			else return user_by_uin;
		} else if (data.user_name) {
			const user_by_user_name = await this.userService.findUserByUName(
				data.user_name,
			);
			if (!user_by_user_name)
				throw new HttpException('User not found', HttpStatus.NOT_FOUND);
			else return user_by_user_name;
		} else {
			throw new HttpException(
				'User not found or data not provided',
				HttpStatus.NOT_FOUND,
			);
		}
	}

	@Patch('updateUser')
	async updateUser(
		@Body() user_data: UpdateUserDto,
		@Query() data: { uin: string; password: string },
	) {
		const user = await this.userService.findUserByUIN(data.uin);
		if (!user) {
			throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		} else {
			const password_verify = await argon2.verify(data.password, user.password);
			if (!password_verify)
				throw new HttpException('Password not valid!', HttpStatus.BAD_REQUEST);
			else {
				try {
					await this.userService.updateUser(user_data, data.uin);
				} catch (e) {
					throw new HttpException(
						`An error occurred while updating user: ${e}`,
						HttpStatus.BAD_REQUEST,
					);
				}
			}
		}
	}
}
