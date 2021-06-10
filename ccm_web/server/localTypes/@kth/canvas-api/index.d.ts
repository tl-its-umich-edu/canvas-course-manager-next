
declare module '@kth/canvas-api' {
  import Got, { Response as GotResponse } from 'got'

  type RequestMethod = 'POST' | 'PUT' | 'DELETE'

  class CanvasAPI {
    constructor (apiUrl: string, apiToken: string, options?: Record<string, unknown>)

    gotClient: Got

    requestUrl<T> (
      endpoint: string, method: RequestMethod, body?: Record<string, unknown>, options?: Record<string, unknown>
    ): Promise<GotResponse<T>>

    get<T> (endpoint: string, queryParams?: Record<string, unknown>): Promise<GotResponse<T>>

    sendSis<T> (endpoint: string, attachment: string, body?: Record<string, unknown>): Promise<GotResponse<T>>

    listPaginated (endpoint: string, queryParams?: Record<string, unknown>, options?: Record<string, unknown>): string[]

    list (endpoint: string, queryParams?: Record<string, unknown>, options?: Record<string, unknown>): string[]
  }

  export = CanvasAPI
}
