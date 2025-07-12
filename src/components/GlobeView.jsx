import { useEffect, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import * as THREE from 'three'
import axios from 'axios'

const GlobeView = ({ userLocation }) => {
  const globeEl = useRef()
  const [satellites, setSatellites] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch satellite data - using realistic mock data for now (CORS prevents direct API calls)
  useEffect(() => {
    const fetchSatellites = async () => {
      setLoading(true)
      try {
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Generate realistic mock Starlink constellation data
        const generateStarlinkSatellites = () => {
          const satellites = []
          
          // Starlink satellites are typically in orbit planes at ~550km altitude
          // Generate satellites across multiple orbital planes
          for (let plane = 0; plane < 12; plane++) {
            for (let sat = 0; sat < 15; sat++) {
              const id = plane * 15 + sat + 1
              const lng = (plane * 30 + sat * 2 + Date.now() / 60000) % 360 - 180 // Orbital motion
              const lat = Math.sin((sat * 24 + plane * 6) * Math.PI / 180) * 53 // ~53° inclination
              
              satellites.push({
                id: id,
                name: `Starlink-${id}`,
                lat: lat,
                lng: lng,
                alt: 0.086, // ~550km / 6371km = 0.086 globe units
                passes: []
              })
            }
          }
          
          return satellites
        }
        
        const satData = generateStarlinkSatellites()
        setSatellites(satData)
        console.log(`Loaded ${satData.length} simulated Starlink satellites`)
        
      } catch (error) {
        console.error('Failed to load satellites:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSatellites()
    // Refresh every 30 seconds
    const interval = setInterval(fetchSatellites, 30000)
    return () => clearInterval(interval)
  }, []) // Load immediately on component mount, not dependent on userLocation

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
    const satGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)
    const satMaterial = new THREE.MeshBasicMaterial({ color: '#4a9eff' })
    return new THREE.Mesh(satGeometry, satMaterial)
  }

  return (
    <div className="globe-container">
      {loading && (
        <div className="globe-loading">
          <p>Loading satellites...</p>
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
        objectLabel={d => `
          <div style="background: rgba(0,0,0,0.8); padding: 5px; border-radius: 3px;">
            <strong>${d.name}</strong><br/>
            Alt: ${(d.alt * 6371).toFixed(0)} km<br/>
            ${d.passes.length > 0 ? `Next pass in ${getNextPassTime(d.passes)}` : 'No visible passes'}
          </div>
        `}
        
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
        width={window.innerWidth > 768 ? 600 : window.innerWidth - 40}
        height={window.innerWidth > 768 ? 600 : 400}
      />
      
      {satellites.length > 0 && (
        <div className="satellite-info">
          <p>Tracking {satellites.length} satellites</p>
        </div>
      )}
    </div>
  )
}

// Helper function to calculate next pass time
const getNextPassTime = (passes) => {
  if (!passes || passes.length === 0) return 'No data'
  
  const now = Date.now() / 1000
  const nextPass = passes.find(pass => pass.startUTC > now)
  
  if (!nextPass) return 'No upcoming passes'
  
  const minutesUntil = Math.round((nextPass.startUTC - now) / 60)
  if (minutesUntil < 60) return `${minutesUntil} minutes`
  if (minutesUntil < 1440) return `${Math.round(minutesUntil / 60)} hours`
  return `${Math.round(minutesUntil / 1440)} days`
}

export default GlobeView