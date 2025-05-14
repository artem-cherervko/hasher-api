import {
	IsEmail,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUrl,
} from 'class-validator';
import { Role } from '../../../generated/prisma/index';

export class AddUserDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsString()
	@IsNotEmpty()
	user_name: string;

	@IsEmail()
	@IsNotEmpty()
	email: string;

	@IsString()
	@IsNotEmpty()
	password: string;

	@IsEnum(Role)
	@IsOptional()
	role: Role;
}

export class UserDto {
	@IsString()
	@IsOptional()
	name: string;

	@IsString()
	@IsOptional()
	user_name: string;

	@IsEmail()
	@IsOptional()
	email: string;

	@IsUrl()
	@IsOptional()
	photo_url: string;

	@IsEnum(Role)
	@IsOptional()
	role: Role;

	password?: never;
}

export type UpdateUserDto = Partial<Omit<UserDto, 'password'>>;

export class DeleteUserDto {
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@IsString()
	@IsNotEmpty()
	uin: string;

	@IsString()
	@IsNotEmpty()
	password: string;
}
