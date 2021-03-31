import { useEffect, useState } from 'react'

import usePromise from './usePromise'
import * as api from '../api'
import { Globals } from '../models/models'

/* Hook for fetching global data and checking whether user is authenticated. */
function useGlobals (ltiKey: string | undefined): [
  Globals | undefined,
  boolean | undefined,
  boolean,
  Error | undefined
] {
  const [globals, setGlobals] = useState(undefined as Globals | undefined)

  const getGlobals = async (): Promise<Globals> => await api.getGlobals(ltiKey)
  const [doGetGlobals, getGlobalsLoading, getGlobalsError] = usePromise(
    getGlobals,
    (value: Globals) => setGlobals(value)
  )
  useEffect(() => {
    /* eslint-disable @typescript-eslint/no-floating-promises */
    doGetGlobals()
  }, [])

  let isAuthenticated
  if (ltiKey !== undefined && globals !== undefined) {
    isAuthenticated = true
  } else if (getGlobalsError !== undefined) {
    isAuthenticated = false
  }

  return [globals, isAuthenticated, getGlobalsLoading, getGlobalsError]
}

export default useGlobals
