import { HTTPError } from 'got'

import { APIErrorPayload } from './api.interfaces'
import { isCanvasErrorBody } from '../canvas/canvas.interfaces'

import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

export function handleAPIError (error: unknown, input?: string): APIErrorPayload {
  const failedInput = input === undefined ? null : input
  if (error instanceof HTTPError) {
    const { statusCode, body } = error.response
    const bodyText = `${parseErrorBody(body)}`
    logger.error(`Response body: ${bodyText}`)
    logger.error(`Received unusual status code ${String(statusCode)}`)
    return { canvasStatusCode: statusCode, message: bodyText, failedInput: failedInput }
  } else {
    logger.error(`An error occurred while making a request to Canvas: ${JSON.stringify(error)}`)
    return { canvasStatusCode: 500, message: 'A non-HTTP error occurred while communicating with Canvas.', failedInput: failedInput }
  }
}

export function parseErrorBody (body: unknown): string {
  if (body === null || body === undefined || String(body).startsWith('<!DOCTYPE html>')) return 'No response body was found.'
  if (!isCanvasErrorBody(body)) {
    return `Response body had unexpected shape: ${JSON.stringify(body)}`
  }
  return body.errors.map(e => e.message).join(' ')
}
