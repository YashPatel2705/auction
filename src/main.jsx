// src/main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'
import { installGlobalErrorHandlers, reportClientError } from './lib/errorLogger'

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    reportClientError(error, {
      kind: 'react_error_boundary',
      meta: {
        component: 'RootErrorBoundary',
        action: 'componentDidCatch',
        section: 'app_bootstrap',
        page: window.location.pathname,
        sdkStep: 'render',
        status: 'failed',
        flow: 'root_render',
        errorCode: info?.componentStack ? 'COMPONENT_STACK' : 'NO_STACK',
      },
    })
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh.</div>
    }
    return this.props.children
  }
}

installGlobalErrorHandlers()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
)
