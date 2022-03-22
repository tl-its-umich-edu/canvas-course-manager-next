import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsNotEmpty,
  MaxLength,
  ValidateNested
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class ExternalUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(255)
  @IsEmail()
  email: string

  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(255)
  givenName: string

  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(255)
  surname: string

  constructor (email: string, givenName: string, surname: string) {
    this.email = email
    this.givenName = givenName
    this.surname = surname
  }
}

export class ExternalUsersDto {
  @ApiProperty({ type: [ExternalUserDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @ArrayUnique((i: ExternalUserDto) => i.email)
  @Type(() => ExternalUserDto)
  users: ExternalUserDto[]

  constructor (users: ExternalUserDto[]) {
    this.users = users
  }
}
