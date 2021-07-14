import { HTTPError } from 'got'
import { APIErrorData } from './api.interfaces'

import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

export function handleAPIError (error: unknown): APIErrorData {
  if (error instanceof HTTPError) {
    const { statusCode, statusMessage } = error.response
    logger.error(`Received unusual status code ${String(statusCode)}`)
    logger.error(`Response body: ${JSON.stringify(statusMessage)}`)
    return { statusCode, message: `Error(s) from Canvas: ${String(statusMessage)}` }
  } else {
    logger.error(`An error occurred while making a request to Canvas: ${JSON.stringify(error)}`)
    return { statusCode: 500, message: 'A non-HTTP error occurred while communicating with Canvas.' }
  }
}
