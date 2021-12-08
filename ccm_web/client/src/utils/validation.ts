import { string, StringSchema, ValidationError } from 'yup'

// Yup: https://github.com/jquense/yup

// Schemas

const createExceededMessage = (fieldName: string, max: number): string => {
  return `Value for the ${fieldName} must be ${max} characters in length or less.`
}

const createBlankMessage = (fieldName: string): string => `Value for the ${fieldName} may not be blank.`

const createCanvasNamedEntitySchema = (fieldName: string): StringSchema => {
  return string().required(createBlankMessage(fieldName))
    .max(255, ({ max }) => createExceededMessage(fieldName, max))
}

export const courseNameSchema = createCanvasNamedEntitySchema('course name')
export const assignmentHeaderSchema = createCanvasNamedEntitySchema('assignment header')
export const sectionNameSchema = createCanvasNamedEntitySchema('section name')

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
