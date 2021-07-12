import { IsNotEmpty, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateSectionsDto {
  @ApiProperty({ type: [String] })
  @IsNotEmpty({ each: true })
  @MaxLength(250, { each: true })
  sections: string[]

  constructor (sections: string[]) {
    this.sections = sections
  }
}
