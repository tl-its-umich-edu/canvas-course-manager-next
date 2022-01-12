import { string, StringSchema, ValidationError } from 'yup'

// Yup: https://github.com/jquense/yup

// Schemas

const createExceededMessage = (fieldName: string, max: number): string => {
  return `Value for the ${fieldName} must be ${max} characters in length or less.`
}

const createBlankMessage = (fieldName: string): string => `Value for the ${fieldName} may not be blank.`

const canvasMaxNameLength = 255
const createCanvasNameSchema = (fieldName: string): StringSchema => {
  return string().required(createBlankMessage(fieldName))
    .max(canvasMaxNameLength, ({ max }) => createExceededMessage(fieldName, max))
}

export const courseNameSchema = createCanvasNameSchema('course name')
export const assignmentHeaderSchema = createCanvasNameSchema('assignment header')
export const sectionIDSchema = string().matches(/^\d+$/, 'Value for the section ID must be an integer (i.e. contain only digits).')
export const sectionNameSchema = createCanvasNameSchema('section name')
export const loginIDSchema = createCanvasNameSchema('login ID')
export const emailSchema = createCanvasNameSchema('email address')
  .email('The value is not a valid email address.')
  .matches(/^(?!.*@[a-z.]*umich.edu).*$/i, 'The email address must not be from the University of Michigan.')
export const firstNameSchema = createCanvasNameSchema('first name')
export const lastNameSchema = createCanvasNameSchema('last name')

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
