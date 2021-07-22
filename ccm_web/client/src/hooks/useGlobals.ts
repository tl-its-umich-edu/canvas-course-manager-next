import { useEffect, useState } from 'react'

import usePromise from './usePromise'
import * as api from '../api'
import { Globals } from '../models/models'

/*
Hook for fetching global data, checking whether user is authenticated, and
requesting that the backend set the CSRF token cookie
*/
function useGlobals (): [
  Globals | undefined,
  boolean | undefined,
  boolean,
  Error | undefined,
  Error | undefined
] {
  const [globals, setGlobals] = useState(undefined as Globals | undefined)

  const getGlobals = async (): Promise<Globals> => await api.getGlobals()
  const [doGetGlobals, getGlobalsLoading, getGlobalsError] = usePromise(
    getGlobals,
    (value: Globals) => setGlobals(value)
  )
  const setCSRFTokenCookie = async (): Promise<void> => await api.setCSRFTokenCookie()
  const [doSetCSRFTokenCookie, setCSRFTokenCookieLoading, setCSRFTokenCookieError] = usePromise(setCSRFTokenCookie)

  useEffect(() => {
    void doGetGlobals()
  }, [])

  useEffect(() => {
    void doSetCSRFTokenCookie()
  }, [])

  let isAuthenticated
  if (globals !== undefined) {
    isAuthenticated = true
  } else if (getGlobalsError !== undefined) {
    isAuthenticated = false
  }

  const loading = getGlobalsLoading || setCSRFTokenCookieLoading
  return [globals, isAuthenticated, loading, getGlobalsError, setCSRFTokenCookieError]
}

export default useGlobals
