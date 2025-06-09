import {
	Body,
	Controller,
	Delete,
	Get,
	HttpException,
	HttpStatus,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AddUserDto, DeleteUserDto, UpdateUserDto } from './dto/user.dto';
import * as argon2 from 'argon2';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt.auth';

@Controller('user')
export class UserController {
	constructor(
		private readonly userService: UserService,
		private readonly authService: AuthService,
	) {}

	@Post('add')
	async addUser(@Body() user: AddUserDto) {
		try {
			user.password = await argon2.hash(user.password);
			const createdUser = await this.userService.addUser(user);
			// const tokenGen = await this.authService.generateTokens(createdUser.uin);

			return {
				status: HttpStatus.OK,
				message: 'User created and tokens issued.',
				user: { uin: createdUser.uin, user_name: createdUser.user_name },
			};
		} catch (e) {
			const message =
				typeof e === 'object' && e !== null && 'message' in e
					? (e as { message: string }).message
					: String(e);
			throw new HttpException(message, HttpStatus.BAD_REQUEST);
		}
	}
	@UseGuards(JwtAuthGuard)
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

	@UseGuards(JwtAuthGuard)
	@Patch('updateUser')
	async updateUser(
		@Body() user_data: UpdateUserDto,
		@Query() data: { uin: string; password: string },
	) {
		const user = await this.userService.findUserByUIN(data.uin);
		if (!user) {
			throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		} else {
			const password_verify = await argon2.verify(user.password, data.password);
			if (!password_verify)
				throw new HttpException('Password not valid!', HttpStatus.BAD_REQUEST);
			else {
				try {
					return await this.userService.updateUser(user_data, data.uin);
				} catch (e) {
					throw new HttpException(
						`An error occurred while updating user: ${e}`,
						HttpStatus.BAD_REQUEST,
					);
				}
			}
		}
	}

	@UseGuards(JwtAuthGuard)
	@Delete('deleteUser')
	async deleteUser(user_to_delete: DeleteUserDto) {
		try {
			await this.userService.deleteUser(user_to_delete);
		} catch (e) {
			throw new HttpException(`Error: ${e}`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@UseGuards(JwtAuthGuard)
	@Get('findUser')
	async findUser(@Query() data: { user_name: string | null }) {
		return await this.userService.findUser(data.user_name);
	}
}
