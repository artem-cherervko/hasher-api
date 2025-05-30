import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

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
