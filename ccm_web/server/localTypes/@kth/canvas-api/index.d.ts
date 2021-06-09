
declare module '@kth/canvas-api' {
  import Got, { Response as GotResponse } from 'got'

  type RequestMethod = 'POST' | 'PUT' | 'DELETE'

  class CanvasAPI {
    constructor (apiUrl: str, apiToken: str, options?: Record<string, unknown>)

    gotClient: Got

    requestUrl<T> (
      endpoint: str, method: RequestMethod, body?: Record<string, unknown>, options?: Record<string, unknown>
    ): Promise<GotResponse<T>>

    get<T> (endpoint: string, queryParams?: Record<string, unknown>): Promise<GotResponse<T>>

    sendSis<T> (endpoint: str, attachment: string, body?: Record<string, unknown>): Promise<GotResponse<T>>

    listPaginated (endpoint: str, queryParams?: Record<string, unknown>, options?: Record<string, unknown>): str[]

    list (endpoint: str, queryParams?: Record<string, unknown>, options?: Record<string, unknown>): str[]
  }

  export = CanvasAPI
}
