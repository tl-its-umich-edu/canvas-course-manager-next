import { IsOptional } from 'class-validator'

export class CanvasOAuthReturnQueryDto {
  @IsOptional()
  state?: string

  @IsOptional()
  code?: string

  @IsOptional()
  error?: string

  @IsOptional()
  error_description?: string

  constructor (
    code?: string,
    state?: string,
    error?: string,
    errorDescription?: string
  ) {
    this.state = state
    this.code = code
    this.error = error
    this.error_description = errorDescription
  }
}
