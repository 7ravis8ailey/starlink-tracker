import { useState } from 'react'
import { MapPin, Mail, Loader2 } from 'lucide-react'
import axios from 'axios'

const SubscriptionForm = ({ onLocationSet }) => {
  const [email, setEmail] = useState('')
  const [location, setLocation] = useState('')
  const [coordinates, setCoordinates] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'Geolocation is not supported by your browser' })
      return
    }

    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setCoordinates({ lat: latitude, lng: longitude })
        
        // Reverse geocode to get location name
        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const locationName = response.data.display_name.split(',').slice(0, 3).join(',')
          setLocation(locationName)
          onLocationSet({ lat: latitude, lng: longitude, name: locationName })
        } catch (error) {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
          onLocationSet({ lat: latitude, lng: longitude, name: 'Your location' })
        }
        
        setGeoLoading(false)
      },
      (error) => {
        setMessage({ type: 'error', text: 'Unable to retrieve your location' })
        setGeoLoading(false)
      }
    )
  }

  const handleLocationInput = async (value) => {
    setLocation(value)
    
    // Simple geocoding using Nominatim (free alternative to Google Places)
    if (value.length > 3) {
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=1`
        )
        
        if (response.data.length > 0) {
          const result = response.data[0]
          const coords = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            name: result.display_name
          }
          setCoordinates(coords)
          onLocationSet(coords)
        }
      } catch (error) {
        console.error('Geocoding error:', error)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !coordinates) {
      setMessage({ type: 'error', text: 'Please provide both email and location' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await axios.post('/api/subscribe', {
        email,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        locationName: location
      })

      setMessage({
        type: 'success',
        text: response.data.isUpdate 
          ? 'Location updated successfully!' 
          : response.data.isReactivation
          ? 'Welcome back! Your subscription has been reactivated.'
          : 'Success! Check your email to confirm subscription.'
      })

      // Clear form on new subscription
      if (response.data.isNew) {
        setEmail('')
        setLocation('')
        setCoordinates(null)
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to subscribe. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="subscription-form">

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">
            <Mail size={18} />
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">
            <MapPin size={18} />
            Your Location
          </label>
          <div className="location-input-group">
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => handleLocationInput(e.target.value)}
              placeholder="Enter city or address"
              required
            />
            <button
              type="button"
              onClick={handleGeolocation}
              className="geo-button"
              disabled={geoLoading}
            >
              {geoLoading ? (
                <Loader2 size={18} className="spinning" />
              ) : (
                <MapPin size={18} />
              )}
              Use My Location
            </button>
          </div>
          {coordinates && (
            <small className="coordinates">
              📍 {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
            </small>
          )}
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <button 
          type="submit" 
          className="submit-button"
          disabled={loading || !coordinates}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="spinning" />
              Subscribing...
            </>
          ) : (
            'Subscribe to Alerts'
          )}
        </button>
      </form>

      <div className="privacy-note">
        <p>
          🔒 We respect your privacy. Your email is only used for satellite alerts.
          You can unsubscribe anytime.
        </p>
      </div>
    </div>
  )
}

export default SubscriptionForm