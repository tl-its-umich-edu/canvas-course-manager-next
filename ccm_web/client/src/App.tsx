import React from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'

import ConsumerTest from './components/ConsumerTest'
import Home from './pages/Home'
import Merge from './pages/Merge'
import './App.css'

function App (): JSX.Element {
  return (
    <div className='App'>
      <Router>
        <Switch>
          <Route exact={true} path="/" component={Home} />
          <Route path='/merge' component={Merge} />
          <Route render={() => (<div><em>Under Construction</em></div>)}/>
        </Switch>
      </Router>

      {/* <Home/> */}
      <ConsumerTest/>
    </div>
  )
}

export default App
