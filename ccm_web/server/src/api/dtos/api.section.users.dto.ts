import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsNotEmpty, ValidateNested } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class SectionUserDto {
  @ApiProperty()
  @IsNotEmpty()
  loginId: string

  @ApiProperty()
  @IsNotEmpty()
  @IsIn(['StudentEnrollment', 'TeacherEnrollment', 'TaEnrollment', 'ObserverEnrollment', 'DesignerEnrollment'])
  type: string

  constructor (loginId: string, type: string) {
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
