import { SnackbarProvider } from 'notistack'
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@material-ui/core'

import ccmTheme from './theme'
import App from './App'
import './index.css'

ReactDOM.render(
  <React.StrictMode>
   <ThemeProvider theme={ccmTheme}>
    <SnackbarProvider maxSnack={3}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SnackbarProvider>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
