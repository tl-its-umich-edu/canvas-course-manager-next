import { SnackbarProvider } from 'notistack'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { ThemeProvider, StyledEngineProvider } from '@mui/material'

import App from './App.js'
import './index.css'
import ccmTheme from './theme.js'
import AccessDenied from './pages/AccessDenied.js'
import LaunchError from './pages/LaunchError.js'

const helpContactProps = {
  email: '4help@umich.edu',
  helpLink: 'https://its.umich.edu/help'
}

const ccmGlobalId = 'ccm_globals'
const ccmGlobalEl = document.getElementById(ccmGlobalId)
if (!ccmGlobalEl || !ccmGlobalEl.textContent) {
  throw new Error(`Error: Element with id '${ccmGlobalId}' not found or has no content.`);
}
const ccmGlobals = Object.freeze(JSON.parse(ccmGlobalEl.textContent))


const root = createRoot(document.getElementById('root') as Element)
root.render(
  <React.StrictMode>
   <StyledEngineProvider injectFirst>
     <ThemeProvider theme={ccmTheme}>
      <SnackbarProvider maxSnack={3}>
        <Router>
          <Routes>
            <Route path='/access-denied' element={<AccessDenied {...helpContactProps} />}/>
            <Route path='/launch-error' element={<LaunchError {...helpContactProps} />}/>
            <Route path='*' element={<App globals={ccmGlobals} />}/>
          </Routes>
        </Router>
      </SnackbarProvider>
     </ThemeProvider>
   </StyledEngineProvider>
  </React.StrictMode>
)
