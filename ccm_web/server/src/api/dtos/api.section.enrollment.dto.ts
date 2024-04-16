import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsNotEmpty, MaxLength, ValidateNested
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'

import { ClientEnrollmentType } from '../../canvas/canvas.interfaces.js'

export class SectionEnrollmentDto {
  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(255)
  loginId: string

  @ApiProperty({ enum: ClientEnrollmentType })
  @IsNotEmpty()
  @IsIn(Object.values(ClientEnrollmentType))
  role: ClientEnrollmentType

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  sectionId: number

  constructor (loginId: string, role: ClientEnrollmentType, sectionId: number) {
    this.loginId = loginId
    this.role = role
    this.sectionId = sectionId
  }
}

export class SectionEnrollmentsDto {
  @ApiProperty({ type: [SectionEnrollmentDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(400)
  @ValidateNested({ each: true })
  @Type(() => SectionEnrollmentDto)
  enrollments: SectionEnrollmentDto[]

  constructor (enrollments: SectionEnrollmentDto[]) {
    this.enrollments = enrollments
  }
}
