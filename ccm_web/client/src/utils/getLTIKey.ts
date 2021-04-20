// https://github.com/Cvmcosta/ltijs-demo-client/blob/master/src/pages/home.js

function getLTIKey (): string | undefined {
  const searchParams = new URLSearchParams(window.location.search)
  const ltiKey = searchParams.get('ltik')
  if (ltiKey === null) {
    console.error('LTI Key was not found!')
    return undefined
  }
  return ltiKey
}

export default getLTIKey
