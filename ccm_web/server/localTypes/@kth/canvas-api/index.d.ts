/*
Types for @kth/canvas-api

@kth/canvas-api repository: https://github.com/KTH/canvas-api
(we'll hopefully contribute these types at some point)
got repository: https://github.com/sindresorhus/got

See also:
- https://stackoverflow.com/a/26955925
- https://stackoverflow.com/a/60797897
*/

declare module '@kth/canvas-api' {
  import { Got, Response as GotResponse, Options as GotOptions, Method as GotSupportedMethod } from 'got'

  class CanvasAPI {
    constructor (apiUrl: string, apiToken: string, options?: GotOptions)

    gotClient: Got

    requestUrl<T> (
      endpoint: string, method: GotSupportedMethod, body?: Record<string, unknown>, options?: GotOptions
    ): Promise<GotResponse<T>>

    get<T> (endpoint: string, queryParams?: Record<string, unknown>): Promise<GotResponse<T>>

    sendSis<T> (endpoint: string, attachment: string, body?: Record<string, unknown>): Promise<GotResponse<T>>

    listPaginated (endpoint: string, queryParams?: Record<string, unknown>, options?: GotOptions): string[]

    list (endpoint: string, queryParams?: Record<string, unknown>, options?: GotOptions): string[]
  }

  export = CanvasAPI
}
