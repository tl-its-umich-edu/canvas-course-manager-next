import { CanvasApiError } from '@kth/canvas-api'
import pLimit from 'p-limit'

import {
  APIErrorData, APIErrorPayload, isAPIErrorData
} from './api.interfaces'
import { isCanvasErrorBody } from '../canvas/canvas.interfaces'

import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

export enum HttpMethod {
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Delete = 'DELETE'
}

export function handleAPIError (error: unknown, input?: string): APIErrorPayload {
  const failedInput = input === undefined ? null : input
  if (error instanceof CanvasApiError && error.response !== undefined) {
    const { statusCode, body } = error.response
    const bodyText = parseErrorBody(body)
    logger.error(`Received error status code: (${String(statusCode)})`)
    logger.error(`Response body: (${bodyText})`)
    logger.error(`Failed input: (${String(failedInput)})`)
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

export function makeResponse<T> (multipleResults: Array<APIErrorData | T>): T[] | APIErrorData {
  const failures = []
  const statusCodes: Set<number> = new Set()
  const successes = []

  for (const result of multipleResults) {
    if (isAPIErrorData(result)) {
      const { statusCode, errors } = result
      failures.push(...errors)
      statusCodes.add(statusCode)
    } else {
      successes.push(result)
    }
  }

  if (failures.length === 0) {
    return successes
  } else {
    return {
      statusCode: statusCodes.size > 1 ? 502 : [...statusCodes][0],
      errors: failures
    }
  }
}

/*
Convenience wrapper for p-limit: see https://github.com/sindresorhus/p-limit
*/
export function limitPromises<T extends unknown | APIErrorData> (
  funcs: Array<() => Promise<T>>, maxConcurrentRequest = 5
): Array<Promise<T>> {
  const limit = pLimit(maxConcurrentRequest)
  const limitedPromises = funcs.map(async (func) => {
    return await limit<[], T>(async () => {
      logger.debug(`Promises still in queue: ${limit.pendingCount}`)
      return await func()
    })
  })
  return limitedPromises
}
