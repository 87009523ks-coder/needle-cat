import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// index.html에 있는 <div id="root"></div>에 우리 앱을 그려주는 역할을 합니다.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
