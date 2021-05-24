import React from 'react'

interface AuthorizePromptProps {
  authURL: string
}

function AuthorizePrompt (props: AuthorizePromptProps): JSX.Element {
  const redirectURI = window.location.hostname
  return (
    <div className='App'>
      <p>
        To gain full access to the Canvas Course Manager, you need to tell
        Canvas to let the tool make changes on your behalf.
      </p>
      <p>
        Click <a href={`${props.authURL}&redirect_uri=https://${redirectURI}`}>here</a> and follow the prompts.
        You will be redirected back to the tool once you have completed the process.
      </p>
    </div>
  )
}

export default AuthorizePrompt
