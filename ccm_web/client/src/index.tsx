import React from 'react'
import ReactDOM from 'react-dom'

import App from './App'
import './index.css'
import getLTIKey from './utils/getLTIKey'

const ltiKey = getLTIKey()

ReactDOM.render(
  <React.StrictMode>
    <App ltiKey={ltiKey} />
  </React.StrictMode>,
  document.getElementById('root')
)
