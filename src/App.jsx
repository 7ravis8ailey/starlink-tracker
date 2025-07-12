import { useState } from 'react'
import GlobeView from './components/GlobeView'
import SubscriptionForm from './components/SubscriptionForm'
import UnsubscribeForm from './components/UnsubscribeForm'
import './App.css'

function App() {
  const [userLocation, setUserLocation] = useState(null)
  const [showUnsubscribe, setShowUnsubscribe] = useState(false)

  // Check if unsubscribe token is in URL
  const urlParams = new URLSearchParams(window.location.search)
  const unsubscribeToken = urlParams.get('token')

  if (unsubscribeToken && !showUnsubscribe) {
    setShowUnsubscribe(true)
  }

  const handleLocationSet = (location) => {
    setUserLocation(location)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🛰️ Starlink Tracker</h1>
        <p>Real-time Starlink satellite positions around the globe</p>
      </header>

      <main className="app-main">
        {showUnsubscribe || unsubscribeToken ? (
          <UnsubscribeForm token={unsubscribeToken} />
        ) : (
          <>
            <section className="hero-section">
              <div className="globe-section">
                <GlobeView userLocation={userLocation} />
              </div>
            </section>

            <section className="form-section">
              <div className="form-container">
                <h2 className="form-title">Get Personal Alerts</h2>
                <p className="form-description">Subscribe for location-based notifications when Starlink satellites pass overhead</p>
                <SubscriptionForm onLocationSet={handleLocationSet} />
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Track SpaceX Starlink satellites in real-time</p>
        <p>
          <a href="?unsubscribe=true" onClick={(e) => {
            e.preventDefault()
            setShowUnsubscribe(true)
          }}>
            Unsubscribe
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
