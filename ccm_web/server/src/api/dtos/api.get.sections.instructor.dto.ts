import { Transform } from 'class-transformer'
import { IsInt, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class GetSectionsInstructorQueryDto {
  @ApiProperty({ type: Number })
  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => Number.parseInt(value))
  term_id: number

  constructor (termId: number) {
    this.term_id = termId
  }
}
