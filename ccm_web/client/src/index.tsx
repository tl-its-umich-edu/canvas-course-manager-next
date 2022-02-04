import { SnackbarProvider } from 'notistack'
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { ThemeProvider } from '@material-ui/core'

import App from './App'
import './index.css'
import ccmTheme from './theme'
import AccessDenied from './pages/AccessDenied'
import LaunchError from './pages/LaunchError'

ReactDOM.render(
  <React.StrictMode>
   <ThemeProvider theme={ccmTheme}>
    <SnackbarProvider maxSnack={3}>
      <BrowserRouter>
        <Switch>
          <Route exact={true} path='/access-denied'>
            <AccessDenied email='4help@umich.edu' helpLink='https://its.umich.edu/help' />
          </Route>
          <Route exact={true} path='/launch-error'>
            <LaunchError />
          </Route>
          <Route><App /></Route>
        </Switch>
      </BrowserRouter>
    </SnackbarProvider>
   </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
