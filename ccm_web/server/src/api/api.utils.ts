import { HTTPError } from 'got'
import { APIErrorHandler } from './api.interfaces'

import baseLogger from '../logger'
import { isCanvasErrorBody } from '../canvas/canvas.interfaces'

const logger = baseLogger.child({ filePath: __filename })

export function handleAPIError (error: unknown): APIErrorHandler {
  if (error instanceof HTTPError) {
    const { statusCode, body } = error.response
    const parsedResponse = `${parseErrorBody(body)}`
    logger.error(`Response body: ${parsedResponse}`)
    logger.error(`Received unusual status code ${String(statusCode)}`)
    return { statusCode, message: parsedResponse }
  } else {
    logger.error(`An error occurred while making a request to Canvas: ${JSON.stringify(error)}`)
    return { statusCode: 500, message: 'A non-HTTP error occurred while communicating with Canvas.' }
  }
}

export function parseErrorBody (body: unknown): string {
  if (body === null || body === undefined || String(body).startsWith('<!DOCTYPE html>')) return 'No response body was found.'
  if (!isCanvasErrorBody(body)) {
    return `Response body had unexpected shape: ${JSON.stringify(body)}`
  }
  return body.errors.map(e => e.message).join(' ')
}
