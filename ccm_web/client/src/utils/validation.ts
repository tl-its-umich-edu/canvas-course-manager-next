import { number, NumberSchema, string, StringSchema, ValidationError } from 'yup'

// Yup: https://github.com/jquense/yup

// Schemas

const createExceededMessage = (fieldName: string, max: number): string => {
  return `Value for the ${fieldName} must be ${max} characters in length or less.`
}

const createBlankMessage = (fieldName: string): string => `Value for the ${fieldName} may not be blank.`
const createBlankMessageCommand = (fieldName: string): string => `Please enter ${fieldName}.`

export const createInvalidIDMessage = (fieldName: string): string => {
  return `Value for the ${fieldName} must be a positive integer.`
}

const canvasMaxNameLength = 255
const createCanvasNameSchema = (fieldName: string, command?: boolean): StringSchema => {
  const createBlank = command === true ? createBlankMessageCommand : createBlankMessage
  return string().required(createBlank(fieldName))
    .max(canvasMaxNameLength, ({ max }) => createExceededMessage(fieldName, max))
}

const createCanvasIdentifierSchema = (fieldName: string): NumberSchema => {
  const message = createInvalidIDMessage(fieldName)
  return number().typeError(`Value for the ${fieldName} must be a number (e.g., it cannot contain letters).`)
    .required(createBlankMessage(fieldName)).truncate().positive(message).integer(message)
}

const createEmailSchema = (command?: boolean): StringSchema => {
  return createCanvasNameSchema('email address', command)
    .email('The value is not a valid email address.')
    .matches(/^(?!.*@[a-z.]*umich.edu).*$/i, 'The email address must not be from the University of Michigan.')
}

export const courseNameInputSchema = createCanvasNameSchema('course name', true)
export const assignmentHeaderSchema = createCanvasNameSchema('assignment header')
export const sectionIdSchema = createCanvasIdentifierSchema('section ID')
export const sectionNameSchema = createCanvasNameSchema('section name')
export const loginIDSchema = createCanvasNameSchema('login ID')
export const loginIDInputSchema = createCanvasNameSchema('login ID', true)
export const emailSchema = createEmailSchema()
export const emailInputSchema = createEmailSchema(true)
export const firstNameSchema = createCanvasNameSchema('first name')
export const firstNameInputSchema = createCanvasNameSchema('first name', true)
export const lastNameSchema = createCanvasNameSchema('last name')
export const lastNameInputSchema = createCanvasNameSchema('last name', true)

// Type validator(s)

export interface ValidationResult<T = string> {
  transformedValue: T | undefined
  isValid: boolean
  messages: readonly string[]
}

export function validateString (value: string | undefined, schema: StringSchema): ValidationResult<string> {
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

export function validateNumberString (value: string | undefined, schema: NumberSchema): ValidationResult<number> {
  let isValid = true
  let messages: string[] = []

  const valueToTest = value === undefined ? value : value.trim() === '' ? NaN : Number(value)
  try {
    schema.validateSync(valueToTest, { strict: true })
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw new Error(String(error))
    } else {
      isValid = false
      messages = error.errors
    }
  }
  return { transformedValue: valueToTest, isValid, messages }
}
