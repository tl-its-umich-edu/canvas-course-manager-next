import React, { useState } from 'react'

interface MessageData {
  message: string;
}

// Added for proof of concept
function ConsumerTest () {

  const [apiMessage, setApiMessage] = useState(undefined as string | undefined) 

  const handleClick = () => {
    fetch('/api/hello')
      .then(res => res.json())
      .then(data => {
        console.log(data)
        const messageData = data as MessageData
        setApiMessage(messageData.message)
      })
      .catch(error => console.log(error))
  }

  return (
    <div>
      <p>Hello API Message</p>
      <p>
        {apiMessage ? apiMessage : 'None'}
      </p>
      <button onClick={handleClick}>Call API</button>
      <button onClick={() => setApiMessage(undefined)}>Clear Message</button>
    </div>
  )
}

export default ConsumerTest
