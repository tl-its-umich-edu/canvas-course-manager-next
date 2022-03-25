import { Transform } from 'class-transformer'
import { IsInt, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class GetSectionsInstructorQueryDto {
  @ApiProperty({ type: Number })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '') ? '' : Number(value))
  @IsNotEmpty()
  @IsInt()
  term_id: number

  constructor (termId: number) {
    this.term_id = termId
  }
}
