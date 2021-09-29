import { ArrayMaxSize, ArrayUnique, IsArray, IsInt, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SectionIdsDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayMaxSize(250)
  @ArrayUnique()
  @IsInt({ each: true })
  @IsNotEmpty({ each: true })
  sectionIds: number[]

  constructor (sectionIds: number[]) {
    this.sectionIds = sectionIds
  }
}
