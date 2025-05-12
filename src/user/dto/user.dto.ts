import {IsEmail, IsEnum, IsNotEmpty, IsString, IsUrl} from "class-validator";
import {Role} from "../../../generated/prisma/index"

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
    role: Role;
}

export class UserDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    user_name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsUrl()
    @IsNotEmpty()
    photo_url: string;

    @IsEnum(Role)
    role: Role;
}

export type UpdateUserDto = Partial<UserDto>;