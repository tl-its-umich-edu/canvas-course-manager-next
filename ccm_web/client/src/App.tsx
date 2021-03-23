import React from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'

import ConsumerTest from './components/ConsumerTest'
import Home, { mergeSectionProps } from './pages/Home'
import MergeSections from './pages/MergeSections'
import './App.css'

function App (): JSX.Element {
  return (
    <div className='App'>
      <Router>
        <Switch>
          <Route exact={true} path="/" component={Home} />
          <Route path={mergeSectionProps.route} component={MergeSections} />
          <Route render={() => (<div><em>Under Construction</em></div>)} />
        </Switch>
      </Router>
      <ConsumerTest/>
    </div>
  )
}

export default App
