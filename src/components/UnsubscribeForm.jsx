import { useState, useEffect } from 'react'
import { Mail, Loader2, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'

const UnsubscribeForm = ({ token }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    // If token is provided in URL, automatically process unsubscribe
    if (token) {
      handleTokenUnsubscribe()
    }
  }, [token])

  const handleTokenUnsubscribe = async () => {
    setLoading(true)
    try {
      const response = await axios.post('/api/unsubscribe', { token })
      setStatus({
        type: 'success',
        message: `Successfully unsubscribed ${response.data.email}`,
        email: response.data.email
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Invalid or expired unsubscribe link'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManualUnsubscribe = async (e) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setStatus(null)

    try {
      // For manual unsubscribe, we'd need to implement email verification
      // For now, we'll show a message
      setStatus({
        type: 'info',
        message: 'Please check your email for an unsubscribe link'
      })
      
      // In a real implementation, you'd send a verification email here
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to process unsubscribe request'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && token) {
    return (
      <div className="unsubscribe-form">
        <div className="status-message">
          <Loader2 size={48} className="spinning" />
          <p>Processing your unsubscribe request...</p>
        </div>
      </div>
    )
  }

  if (status && token) {
    return (
      <div className="unsubscribe-form">
        <div className={`status-message ${status.type}`}>
          {status.type === 'success' ? (
            <>
              <CheckCircle size={48} />
              <h2>Unsubscribed Successfully</h2>
              <p>{status.message}</p>
              <p>We're sorry to see you go! You won't receive any more satellite alerts.</p>
              <a href="/" className="back-link">← Back to Home</a>
            </>
          ) : (
            <>
              <XCircle size={48} />
              <h2>Unsubscribe Failed</h2>
              <p>{status.message}</p>
              <a href="/" className="back-link">← Back to Home</a>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="unsubscribe-form">
      <h2>Unsubscribe from Alerts</h2>
      <p>Enter your email to unsubscribe from satellite alerts</p>

      <form onSubmit={handleManualUnsubscribe}>
        <div className="form-group">
          <label htmlFor="unsubscribe-email">
            <Mail size={18} />
            Email Address
          </label>
          <input
            type="email"
            id="unsubscribe-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
        </div>

        {status && (
          <div className={`message ${status.type}`}>
            {status.message}
          </div>
        )}

        <button 
          type="submit" 
          className="submit-button"
          disabled={loading || !email}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="spinning" />
              Processing...
            </>
          ) : (
            'Unsubscribe'
          )}
        </button>
      </form>

      <div className="back-to-home">
        <a href="/" onClick={(e) => {
          e.preventDefault()
          window.location.href = '/'
        }}>
          ← Back to Home
        </a>
      </div>
    </div>
  )
}

export default UnsubscribeForm