import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Role } from '../../../generated/prisma/index';

export class NewMessageDTO {
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@IsString()
	@IsNotEmpty()
	sender_name: string;

	@IsString()
	@IsNotEmpty()
	sender_uin: string;

	@IsEnum(Role)
	@IsNotEmpty()
	user_role: Role;
}

export class OAuthDTO {
	@IsEmail()
	@IsNotEmpty()
	email: string;
}

export class UpdateUserDTO {
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@IsString()
	@IsNotEmpty()
	message: string;
}
