import { IsNotEmpty, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SectionUserDto {
  @IsNotEmpty()
  loginId: string

  @IsNotEmpty()
  role: string

  constructor (loginId: string, role: string) {
    this.loginId = loginId
    this.role = role
  }
}

export class SectionUsersDto {
  @ApiProperty({ type: [SectionUserDto] })
  @IsNotEmpty({ each: true })
  @MaxLength(400, { each: true })
  users: SectionUserDto[]

  constructor (users: SectionUserDto[]) {
    this.users = users
  }
}
