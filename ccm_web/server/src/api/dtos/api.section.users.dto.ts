import { IsNotEmpty, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SectionUserDto {
  @IsNotEmpty()
  user: string

  @IsNotEmpty()
  role: string

  constructor (user: string, role: string) {
    this.user = user
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
