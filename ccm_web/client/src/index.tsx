import { SnackbarProvider } from 'notistack'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider, StyledEngineProvider } from '@mui/material'

import App from './App'
import './index.css'
import ccmTheme from './theme'
import AccessDenied from './pages/AccessDenied'
import LaunchError from './pages/LaunchError'

const helpContactProps = {
  email: '4help@umich.edu',
  helpLink: 'https://its.umich.edu/help'
}

const root = createRoot(document.getElementById('root') as Element)
root.render(
  <React.StrictMode>
   <StyledEngineProvider injectFirst>
     <ThemeProvider theme={ccmTheme}>
      <SnackbarProvider maxSnack={3}>
        <BrowserRouter>
          <Routes>
            <Route path='/access-denied' element={<AccessDenied {...helpContactProps} />}/>
            <Route path='/launch-error' element={<LaunchError {...helpContactProps} />}/>
            <Route path='*' element={<App />}/>
          </Routes>
        </BrowserRouter>
      </SnackbarProvider>
     </ThemeProvider>
   </StyledEngineProvider>
  </React.StrictMode>
)
