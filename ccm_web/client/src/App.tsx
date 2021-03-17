import React from 'react'

import ConsumerTest from './components/ConsumerTest'
import Home from './pages/Home'
import './App.css'

function App (): JSX.Element {
  return (
    <div className='App'>
      <Home/>
      <ConsumerTest/>
    </div>
  )
}

export default App
