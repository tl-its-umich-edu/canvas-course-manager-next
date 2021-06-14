import waitPort from 'wait-port'

const params = {
  host: 'ccm_web_prod',
  port: 3360
}

waitPort(params)
  .then((open) => {
    if (open) console.log('The port is now open!')
    else console.log('The port did not open before the timeout...')
  })
  .catch((e) => {
    console.log('An unknown error occured while waiting for the port: ', e)
  })
