import { string, StringSchema, ValidationError } from 'yup'

// Yup: https://github.com/jquense/yup

// Schemas

const createExceededMessage = (fieldName: string, max: number): string => {
  return `Value for the ${fieldName} must be ${max} characters in length or less.`
}

const createBlankMessage = (fieldName: string): string => `Value for the ${fieldName} may not be blank.`

const canvasMaxNameLength = 255
const createCanvasEntityNameSchema = (fieldName: string): StringSchema => {
  return string().required(createBlankMessage(fieldName))
    .max(canvasMaxNameLength, ({ max }) => createExceededMessage(fieldName, max))
}

export const courseNameSchema = createCanvasEntityNameSchema('course name')
export const assignmentHeaderSchema = createCanvasEntityNameSchema('assignment header')
export const sectionNameSchema = createCanvasEntityNameSchema('section name')
export const emailSchema = createCanvasEntityNameSchema('email address')
  .email('The value is not a valid email address.')
  .matches(/^(?!.*@[a-z.]*umich.edu).*$/i, 'The email address must not be from the University of Michigan.')

// Type validator(s)

export interface ValidationResult {
  transformedValue: string | undefined
  isValid: boolean
  messages: readonly string[]
}

export function validateString (value: string | undefined, schema: StringSchema): ValidationResult {
  let transformedValue: string | undefined
  let isValid = true
  let messages: string[] = []
  try {
    transformedValue = schema.validateSync(value)
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw new Error(String(error))
    } else {
      transformedValue = error.value as string | undefined
      isValid = false
      messages = error.errors
    }
  }
  return { transformedValue, isValid, messages }
}
