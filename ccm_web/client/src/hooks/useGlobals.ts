import { useEffect, useState } from 'react'

import usePromise from './usePromise'
import * as api from '../api'
import { Globals, CsrfToken } from '../models/models'

/*
Hook for fetching global data, checking whether user is authenticated, and
requesting that the backend set the CSRF token cookie
*/
function useGlobals (): [
  Globals | undefined,
  CsrfToken | undefined,
  boolean | undefined,
  boolean,
  Error | undefined,
  Error | undefined
] {
  const [globals, setGlobals] = useState(undefined as Globals | undefined)
  const [csrfToken, setCsrfToken] = useState(undefined as CsrfToken | undefined)

  const getGlobals = async (): Promise<Globals> => await api.getGlobals()
  const [doGetGlobals, getGlobalsLoading, getGlobalsError] = usePromise(
    getGlobals,
    (value: Globals) => setGlobals(value)
  )
  const getCSRFTokenResponse = async (): Promise<CsrfToken> => await api.getCSRFTokenResponse()
  const [doGetCSRFTokenResponse, getCSRFTokenReponseLoading, getCSRFTokenResponseError] = usePromise(
    getCSRFTokenResponse,
    (value: CsrfToken) => setCsrfToken(value)
  )

  useEffect(() => {
    void doGetGlobals()
  }, [])

  useEffect(() => {
    void doGetCSRFTokenResponse()
  }, [])

  let isAuthenticated
  if (globals !== undefined) {
    isAuthenticated = true
  } else if (getGlobalsError !== undefined) {
    isAuthenticated = false
  }

  const loading = getGlobalsLoading || getCSRFTokenReponseLoading
  return [globals, csrfToken, isAuthenticated, loading, getGlobalsError, getCSRFTokenResponseError]
}

export default useGlobals
