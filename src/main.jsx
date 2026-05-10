import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // 확장자 없이 호출하여 에러 방지

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
