import React from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { SnackbarProvider } from 'notistack'

import ConsumerTest from './components/ConsumerTest'
import Home, { mergeSectionProps } from './pages/Home'
import MergeSections from './pages/MergeSections'
import './App.css'

function App (): JSX.Element {
  return (
    <div className='App'>
      <SnackbarProvider maxSnack={3}>
        <Router>
          <Switch>
            <Route exact={true} path="/" component={Home} />
            <Route path={mergeSectionProps.route} component={MergeSections} />
            <Route render={() => (<div><em>Under Construction</em></div>)} />
          </Switch>
        </Router>
        <ConsumerTest/>
      </SnackbarProvider>
    </div>
  )
}

export default App
