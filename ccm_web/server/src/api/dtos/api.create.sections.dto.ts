import {
  IsNotEmpty,
  MaxLength,
  ArrayMaxSize,
  ArrayMinSize,
  IsArray
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateSectionsDto {
  @ApiProperty({ type: [String] })
  @IsNotEmpty({ each: true })
  @MaxLength(250, { each: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(60)
  sections: string[]

  constructor (sections: string[]) {
    this.sections = sections
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 0d3bb07 (issue-217 changes based on code reivews)
