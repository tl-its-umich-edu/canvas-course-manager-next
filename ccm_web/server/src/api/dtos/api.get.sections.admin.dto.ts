import { Transform } from 'class-transformer'
import { IsOptional, IsInt, IsNotEmpty, MaxLength, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class GetSectionsAdminQueryDto {
  @ApiProperty({ type: Number })
  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => Number.parseInt(value))
  term_id: number

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @MinLength(3)
  @MaxLength(255)
  instructor?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @MinLength(3)
  @MaxLength(255)
  course_name?: string

  constructor (termId: number, instructor?: string, courseName?: string) {
    this.term_id = termId
    this.instructor = instructor
    this.course_name = courseName
  }
}
