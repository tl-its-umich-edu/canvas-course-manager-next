import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  ValidateNested
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { UserEnrollmentType } from '../../canvas/canvas.interfaces'

export class SectionUserDto {
  @ApiProperty()
  @IsNotEmpty()
  loginId: string

  @ApiProperty({ enum: UserEnrollmentType })
  @IsNotEmpty()
  @IsIn(Object.values(UserEnrollmentType))
  type: UserEnrollmentType

  constructor (loginId: string, type: UserEnrollmentType) {
    this.loginId = loginId
    this.type = type
  }
}

export class SectionUsersDto {
  @ApiProperty({ type: [SectionUserDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(400)
  @ValidateNested({ each: true })
  @Type(() => SectionUserDto)
  users: SectionUserDto[]

  constructor (users: SectionUserDto[]) {
    this.users = users
  }
}
