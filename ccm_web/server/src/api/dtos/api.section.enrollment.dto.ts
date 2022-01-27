import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsIn, IsInt, IsNotEmpty, MaxLength, ValidateNested
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'

import { UserEnrollmentType } from '../../canvas/canvas.interfaces'

export class SectionEnrollmentDto {
  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(255)
  loginId: string

  @ApiProperty({ enum: UserEnrollmentType })
  @IsNotEmpty()
  @IsIn(Object.values(UserEnrollmentType))
  type: UserEnrollmentType

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  sectionId: number

  constructor (loginId: string, type: UserEnrollmentType, sectionId: number) {
    this.loginId = loginId
    this.type = type
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
