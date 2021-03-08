import React from 'react'
import './App.css'

import ConsumerTest from './components/ConsumerTest'

function App (): JSX.Element {
  return (
    <div className='App'>
      <header className='App-header'>
        <p>
          Edit <code>src/App.tsx</code>, and refresh browser to reload!
        </p>
        <a
          className='App-link'
          href='https://reactjs.org'
          target='_blank'
          rel='noopener noreferrer'
        >
          Learn React
        </a>
        <br />
        <ConsumerTest />
      </header>
    </div>
  )
}

export default App
