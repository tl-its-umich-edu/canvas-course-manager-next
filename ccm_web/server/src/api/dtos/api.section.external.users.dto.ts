import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  ValidateNested
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { UserEnrollmentType } from '../../canvas/canvas.interfaces'

export class SectionExternalUserDto {
  @ApiProperty()
  @IsNotEmpty()
  email: string

  @ApiProperty()
  @IsNotEmpty()
  givenName: string

  @ApiProperty()
  @IsNotEmpty()
  surname: string

  @ApiProperty({ enum: UserEnrollmentType })
  @IsNotEmpty()
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
  @ArrayMaxSize(400)
  @ValidateNested({ each: true })
  @Type(() => SectionExternalUserDto)
  users: SectionExternalUserDto[]

  constructor (users: SectionExternalUserDto[]) {
    this.users = users
  }
}
