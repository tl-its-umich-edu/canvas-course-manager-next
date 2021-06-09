import { ApiProperty } from '@nestjs/swagger'

export class CourseNameDto {
  @ApiProperty()
  newName: string

  constructor (newName: string) {
    this.newName = newName
  }
}
