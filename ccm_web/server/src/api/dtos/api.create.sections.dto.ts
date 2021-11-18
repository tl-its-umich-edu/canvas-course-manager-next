import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateSectionsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(60)
  sections: string[]

  constructor (sections: string[]) {
    this.sections = sections
  }
}

