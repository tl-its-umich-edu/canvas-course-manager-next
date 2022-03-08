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
import { ClientEnrollmentType } from '../../canvas/canvas.interfaces'

export class SectionUserDto {
  @ApiProperty()
  @IsNotEmpty()
  loginId: string

  @ApiProperty({ enum: ClientEnrollmentType })
  @IsNotEmpty()
  @IsIn(Object.values(ClientEnrollmentType))
  role: ClientEnrollmentType

  constructor (loginId: string, role: ClientEnrollmentType) {
    this.loginId = loginId
    this.role = role
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
