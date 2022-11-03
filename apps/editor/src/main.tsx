import {Routes} from 'generouted'
import * as React from 'react'
import ReactDOM from 'react-dom/client'

import '/src/styles/global.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Routes />
  </React.StrictMode>,
)
