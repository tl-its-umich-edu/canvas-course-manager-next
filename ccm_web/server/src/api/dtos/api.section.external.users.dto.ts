import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  MaxLength,
  ValidateNested
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { UserEnrollmentType } from '../../canvas/canvas.interfaces'

export class SectionExternalUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(255)
  email: string

  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(255)
  givenName: string

  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(255)
  surname: string

  @ApiProperty({ enum: UserEnrollmentType })
  @IsNotEmpty()
  @IsIn(Object.values(UserEnrollmentType))
  type: UserEnrollmentType

  constructor (email: string, givenName: string, surname: string, type: UserEnrollmentType) {
    this.email = email
    this.givenName = givenName
    this.surname = surname
    this.type = type
  }
}

export class SectionExternalUsersDto {
  @ApiProperty({ type: [SectionExternalUserDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => SectionExternalUserDto)
  users: SectionExternalUserDto[]

  constructor (users: SectionExternalUserDto[]) {
    this.users = users
  }
}
