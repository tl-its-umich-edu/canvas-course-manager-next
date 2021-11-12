import { SnackbarProvider } from 'notistack'
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import './index.css'

ReactDOM.render(
  <React.StrictMode>
    <SnackbarProvider maxSnack={3}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SnackbarProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
