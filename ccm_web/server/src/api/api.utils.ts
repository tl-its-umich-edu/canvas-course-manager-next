import { CanvasApiError } from '@kth/canvas-api'
import { HttpStatus } from '@nestjs/common'
import pLimit from 'p-limit'

import {
  APIErrorData, APIErrorPayload, isAPIErrorData
} from './api.interfaces'
import { isCanvasErrorBody } from '../canvas/canvas.interfaces'

import baseLogger from '../logger'

const logger = baseLogger.child({ filePath: __filename })

export const NS_PER_SEC = BigInt(1e9)

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
    const defaultMessage = 'A non-HTTP error occurred while communicating with Canvas.'
    return { canvasStatusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: defaultMessage, failedInput: failedInput }
  }
}

export function parseErrorBody (body: unknown): string {
  if (body === null || body === undefined || String(body).startsWith('<!DOCTYPE html>')) return 'No response body was found.'
  if (!isCanvasErrorBody(body)) {
    return `Response body had unexpected shape: ${JSON.stringify(body)}`
  }
  let errorMessage: string
  try {
    errorMessage = body.errors.map(e => e.message).join(' ')
  } catch (e) {
    errorMessage = JSON.stringify(body)
    logger.debug(errorMessage)
  }
  return errorMessage
}

export function determineStatusCode (codes: HttpStatus[]): HttpStatus {
  if (codes.length === 0) throw new Error('determineStatusCode received an array with length 0.')
  const uniqueStatusCodes: Set<HttpStatus> = new Set(codes)
  return uniqueStatusCodes.size > 1 ? HttpStatus.BAD_GATEWAY : [...uniqueStatusCodes][0]
}

export function makeResponse<T> (multipleResults: Array<APIErrorData | T>): T[] | APIErrorData {
  const failures = []
  const statusCodes: HttpStatus[] = []
  const successes = []

  for (const result of multipleResults) {
    if (isAPIErrorData(result)) {
      const { statusCode, errors } = result
      failures.push(...errors)
      statusCodes.push(statusCode)
    } else {
      successes.push(result)
    }
  }

  if (failures.length === 0) {
    return successes
  } else {
    return {
      statusCode: determineStatusCode(statusCodes),
      errors: failures
    }
  }
}

/*
Convenience wrapper for p-limit: see https://github.com/sindresorhus/p-limit
*/
export function createLimitedPromises<T> (
  funcs: Array<() => Promise<T>>, maxConcurrentPromises = 20
): Array<Promise<T>> {
  const limit = pLimit(maxConcurrentPromises)
  const limitedPromises = funcs.map(async (func) => {
    return await limit<[], T>(async () => {
      logger.debug(`Promises still in queue: ${limit.pendingCount}`)
      return await func()
    })
  })
  return limitedPromises
}
