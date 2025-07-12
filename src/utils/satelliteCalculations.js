import * as satellite from 'satellite.js'

/**
 * Parse TLE data and create satellite records
 */
export function parseTLEData(tleData) {
  const satellites = []
  
  tleData.forEach(tle => {
    try {
      // Create satellite record from TLE
      const satrec = satellite.twoline2satrec(tle.line1, tle.line2)
      
      if (satrec.error === 0) {
        satellites.push({
          name: tle.name,
          line1: tle.line1,
          line2: tle.line2,
          satrec: satrec,
          id: extractSatelliteId(tle.line1)
        })
      } else {
        console.warn(`Failed to parse TLE for ${tle.name}:`, satrec.error)
      }
    } catch (error) {
      console.warn(`Error parsing satellite ${tle.name}:`, error)
    }
  })
  
  return satellites
}

/**
 * Calculate current position for all satellites
 */
export function calculateSatellitePositions(satellites, time = new Date()) {
  const positions = []
  
  satellites.forEach(sat => {
    try {
      const position = calculateSingleSatellitePosition(sat.satrec, time)
      if (position) {
        positions.push({
          id: sat.id,
          name: sat.name,
          lat: position.latitude,
          lng: position.longitude,
          alt: position.altitude,
          velocity: position.velocity
        })
      }
    } catch (error) {
      // Skip satellites with calculation errors
      console.warn(`Error calculating position for ${sat.name}:`, error)
    }
  })
  
  return positions
}

/**
 * Calculate position for a single satellite
 */
export function calculateSingleSatellitePosition(satrec, time = new Date()) {
  try {
    // Propagate satellite to current time
    const positionAndVelocity = satellite.propagate(satrec, time)
    
    if (positionAndVelocity.error) {
      return null
    }
    
    const positionEci = positionAndVelocity.position
    const velocityEci = positionAndVelocity.velocity
    
    if (!positionEci || !velocityEci) {
      return null
    }
    
    // Convert ECI coordinates to geodetic (lat/lng/alt)
    const gmst = satellite.gstime(time)
    const positionGd = satellite.eciToGeodetic(positionEci, gmst)
    
    // Convert radians to degrees
    const latitude = satellite.degreesLat(positionGd.latitude)
    const longitude = satellite.degreesLong(positionGd.longitude)
    const altitude = positionGd.height // km above Earth
    
    // Calculate velocity magnitude
    const velocity = Math.sqrt(
      velocityEci.x * velocityEci.x +
      velocityEci.y * velocityEci.y +
      velocityEci.z * velocityEci.z
    ) // km/s
    
    return {
      latitude,
      longitude,
      altitude,
      velocity
    }
  } catch (error) {
    console.warn('Satellite position calculation error:', error)
    return null
  }
}

/**
 * Extract satellite ID from TLE line 1
 */
function extractSatelliteId(line1) {
  // Satellite catalog number is in columns 3-7 of line 1
  return parseInt(line1.substring(2, 7))
}

/**
 * Filter satellites that are currently above Earth (not decayed)
 */
export function filterActiveSatellites(satellites) {
  const now = new Date()
  return satellites.filter(sat => {
    const position = calculateSingleSatellitePosition(sat.satrec, now)
    return position && position.altitude > 100 // Above 100km altitude
  })
}

/**
 * Update satellite positions in real-time
 */
export class SatelliteTracker {
  constructor(satellites) {
    this.satellites = satellites
    this.positions = []
    this.updateInterval = null
  }
  
  startTracking(updateCallback, intervalMs = 5000) {
    // Initial calculation
    this.updatePositions()
    updateCallback(this.positions)
    
    // Set up real-time updates
    this.updateInterval = setInterval(() => {
      this.updatePositions()
      updateCallback(this.positions)
    }, intervalMs)
  }
  
  stopTracking() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }
  
  updatePositions() {
    this.positions = calculateSatellitePositions(this.satellites)
  }
  
  getSatelliteCount() {
    return this.satellites.length
  }
  
  getActiveSatelliteCount() {
    return this.positions.filter(pos => pos.alt > 100).length
  }
}