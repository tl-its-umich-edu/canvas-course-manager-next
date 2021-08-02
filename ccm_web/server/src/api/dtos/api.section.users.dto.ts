import { ArrayMaxSize, IsNotEmpty, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/*
FIXME: Swagger UI doesn't show `SectionUserDto` properties.
Maybe that means this nested class isn't initialized properly and the
validator might not use this class at all.
 */
// FIXME: Check that this catches errors in the data.
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
