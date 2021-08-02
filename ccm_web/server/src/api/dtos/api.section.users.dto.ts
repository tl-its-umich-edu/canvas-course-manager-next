import { ArrayMaxSize, IsNotEmpty, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SectionUserDto {
  @IsNotEmpty()
  loginId: string

  // FIXME: Allow only valid Canvas role names
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
  @ArrayMaxSize(400)
  users: SectionUserDto[]

  constructor (users: SectionUserDto[]) {
    this.users = users
  }
}
