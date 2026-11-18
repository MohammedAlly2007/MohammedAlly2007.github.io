import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Keep a breadcrumb in the console for debugging without blocking the user.
    console.error('SmartSoko app error:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-navy-900 via-primary-900 to-navy-800">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h1 className="text-xl font-bold text-navy-900 mb-2">Kuna hitilafu kidogo</h1>
          <p className="text-sm text-gray-600 mb-5">
            Ukurasa haukuweza kupakia vizuri. Data yako iko salama kwenye kifaa chako — pakia upya ukurasa.
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary w-full">Pakia Upya</button>
          <button
            onClick={() => { localStorage.removeItem('theme'); window.location.href = '/login' }}
            className="mt-2 text-xs text-gray-500 underline"
          >
            Rudi kwenye ukurasa wa kuingia
          </button>
        </div>
      </div>
    )
  }
}
