import React, { useState } from 'react'

interface MessageData {
  message: string
  something: number
}

// Added for proof of concept
function ConsumerTest (): JSX.Element {
  const [apiMessage, setApiMessage] = useState(undefined as string | undefined)

  const handleClick = (): void => {
    fetch('/api/hello')
      .then(async res => await res.json())
      .then(data => {
        const messageData = data as MessageData
        setApiMessage(messageData.message)
      })
      .catch(error => console.log(error))
  }

  return (
    <div>
      <p>Hello API Message</p>
      <p>{ apiMessage !== undefined ? apiMessage : 'None' }</p>
      <button onClick={handleClick}>Call API</button>
      <button onClick={() => setApiMessage(undefined)}>Clear Message</button>
    </div>
  )
}

export default ConsumerTest
