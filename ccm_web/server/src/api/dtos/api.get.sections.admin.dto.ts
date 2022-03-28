import { Transform } from 'class-transformer'
import { IsInt, IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class GetSectionsAdminQueryDto {
  @ApiProperty({ type: Number })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '') ? '' : Number(value))
  @IsNotEmpty()
  @IsInt()
  term_id: number

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @MinLength(3)
  @MaxLength(255)
  instructor_name?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @MinLength(3)
  @MaxLength(255)
  course_name?: string

  constructor (termId: number, instructorName?: string, courseName?: string) {
    this.term_id = termId
    this.instructor_name = instructorName
    this.course_name = courseName
  }
}
