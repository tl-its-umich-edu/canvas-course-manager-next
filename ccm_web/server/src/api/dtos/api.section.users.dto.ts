import { IsNotEmpty, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SectionUsersDto {
  @ApiProperty({ type: [String] })
  @IsNotEmpty({ each: true })
  @MaxLength(400, { each: true })
  users: string[]

  constructor (users: string[]) {
    this.users = users
  }
}
