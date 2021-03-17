import React, { useState } from 'react'

import * as api from '../api'
import { usePromise } from '../hooks/usePromise'
import { HelloMessageData } from '../models'

// Added for proof of concept
function ConsumerTest (): JSX.Element {
  const [apiMessage, setApiMessage] = useState(undefined as string | undefined)

  const [doGetHelloData, getHelloLoading, getHelloError] = usePromise(
    api.getHelloMessageData,
    (value: HelloMessageData) => setApiMessage(value.message)
  )
  const isLoading = getHelloLoading

  const errors = [getHelloError]
  for (const e of errors) {
    if (e !== undefined) console.error(e)
  }

  return (
    <div>
      <p>Hello API Message</p>
      <p>{ apiMessage !== undefined ? apiMessage : 'None' }</p>
      <button disabled={isLoading} onClick={doGetHelloData}>Call API</button>
      <button disabled={isLoading} onClick={() => setApiMessage(undefined)}>Clear Message</button>
    </div>
  )
}

export default ConsumerTest
