import { useEffect, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import * as THREE from 'three'
import axios from 'axios'
import { parseTLEData, SatelliteTracker } from '../utils/satelliteCalculations'

const GlobeView = ({ userLocation }) => {
  const globeEl = useRef()
  const [satellites, setSatellites] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [satelliteCount, setSatelliteCount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(null)
  const trackerRef = useRef(null)

  // Fetch TLE data and start real-time tracking
  useEffect(() => {
    const initializeSatelliteTracking = async () => {
      setLoading(true)
      setLoadingProgress(0)
      setLoadingMessage('Connecting to orbital database...')
      
      try {
        console.log('Fetching Starlink TLE data from CelesTrak...')
        setLoadingProgress(25)
        setLoadingMessage('Downloading constellation data...')
        
        const response = await axios.get('/api/get-tle-data', {
          timeout: 30000
        })
        
        console.log('TLE Response:', response.data)
        setLoadingProgress(50)
        setLoadingMessage('Processing satellite orbits...')
        
        if (response.data && response.data.satellites && response.data.satellites.length > 0) {
          console.log(`Received ${response.data.satellites.length} Starlink satellites`)
          
          setLoadingProgress(75)
          setLoadingMessage('Initializing tracking system...')
          
          // Parse TLE data into satellite records
          const parsedSatellites = parseTLEData(response.data.satellites)
          console.log(`Successfully parsed ${parsedSatellites.length} satellites`)
          
          setSatelliteCount(parsedSatellites.length)
          setLoadingProgress(90)
          
          // Initialize satellite tracker
          if (trackerRef.current) {
            trackerRef.current.stopTracking()
          }
          
          trackerRef.current = new SatelliteTracker(parsedSatellites)
          
          // Start real-time position updates
          trackerRef.current.startTracking((positions) => {
            // Transform positions for globe visualization
            const satData = positions.map(pos => ({
              id: pos.id,
              name: pos.name,
              lat: pos.lat,
              lng: pos.lng,
              alt: pos.alt / 6371, // Convert km to globe units (Earth radius = 6371km)
              altitude: pos.alt, // Keep original altitude for tooltip
              velocity: pos.velocity
            }))
            
            setSatellites(satData)
            setLastUpdated(new Date())
            console.log(`Updated positions for ${satData.length} active satellites`)
            
            // Complete loading on first position update
            if (loading) {
              setLoadingProgress(100)
              setLoadingMessage('System ready - tracking active')
              setTimeout(() => setLoading(false), 500)
            }
          }, 5000) // Update every 5 seconds
          
        } else {
          console.log('No TLE data received')
          setSatellites([])
        }
        
      } catch (error) {
        console.error('Failed to fetch TLE data:', error)
        setSatellites([])
      }
      
      setLoading(false)
    }

    initializeSatelliteTracking()

    // Cleanup on unmount
    return () => {
      if (trackerRef.current) {
        trackerRef.current.stopTracking()
      }
    }
  }, [])

  // Auto-rotate globe
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true
      globeEl.current.controls().autoRotateSpeed = 0.5

      // Point to user location if available
      if (userLocation) {
        globeEl.current.pointOfView({
          lat: userLocation.lat,
          lng: userLocation.lng,
          altitude: 2.5
        }, 1000)
      }
    }
  }, [userLocation])

  const satelliteObject = () => {
    // Use smaller, more efficient spheres for better performance with thousands of satellites
    const satGeometry = new THREE.SphereGeometry(0.3, 8, 6) // Lower poly count for performance
    const satMaterial = new THREE.MeshBasicMaterial({ 
      color: '#4a9eff',
      transparent: true,
      opacity: 0.8
    })
    return new THREE.Mesh(satGeometry, satMaterial)
  }

  return (
    <div className="globe-container">
      {loading && (
        <div className="globe-loading">
          <div className="sonar-container">
            <div className="sonar-ping"></div>
          </div>
          <div className="loading-text">Tracking Starlink</div>
          <div className="loading-text">Real-Time Locations</div>
          <div className="loading-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <div className="loading-subtext">{loadingMessage}</div>
          </div>
        </div>
      )}
      
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // Satellite layer
        objectsData={satellites}
        objectLat="lat"
        objectLng="lng"
        objectAltitude="alt"
        objectThreeObject={satelliteObject}
        objectLabel={() => null}
        
        // User location marker
        labelsData={userLocation ? [{
          lat: userLocation.lat,
          lng: userLocation.lng,
          text: '📍 Your Location',
          color: '#ff4444',
          size: 15
        }] : []}
        labelLat="lat"
        labelLng="lng"
        labelText="text"
        labelColor="color"
        labelSize="size"
        labelDotRadius={0.4}
        labelAltitude={0.01}
        
        // Atmosphere
        atmosphereColor="#4a9eff"
        atmosphereAltitude={0.15}
        
        // Controls
        enablePointerInteraction={true}
        width={Math.min(600, window.innerWidth - 40)}
        height={window.innerWidth > 768 ? 600 : Math.min(400, window.innerHeight * 0.4)}
      />
      
      <div className="satellite-info">
        {loading ? (
          <div className="technical-loading">
            <p>INITIALIZING ORBITAL TRACKING SYSTEM...</p>
          </div>
        ) : satelliteCount > 0 ? (
          <>
            <p><strong>◉ ACTIVE TRACKING: {satellites.length} STARLINK SATELLITES</strong></p>
            {lastUpdated && (
              <p>LAST ORBITAL UPDATE: {lastUpdated.toLocaleTimeString()}</p>
            )}
            <p className="technical-status">● REAL-TIME SGP4 PROPAGATION ACTIVE</p>
          </>
        ) : (
          <p>⚠ SATELLITE DATA UNAVAILABLE</p>
        )}
      </div>
    </div>
  )
}


export default GlobeView