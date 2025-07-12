import axios from 'axios'

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    console.log('Fetching Starlink TLE data from CelesTrak...')
    
    // Fetch TLE data from CelesTrak
    const response = await axios.get(
      'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle',
      { timeout: 30000 }
    )

    const tleData = response.data
    console.log(`Received TLE data: ${tleData.length} characters`)

    // Parse TLE data into individual satellites
    const lines = tleData.trim().split('\n')
    const satellites = []

    // TLE format: Name line, Line 1, Line 2 (repeat)
    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 < lines.length) {
        const name = lines[i].trim()
        const line1 = lines[i + 1].trim()
        const line2 = lines[i + 2].trim()

        // Validate TLE format
        if (line1.startsWith('1 ') && line2.startsWith('2 ')) {
          satellites.push({
            name: name,
            line1: line1,
            line2: line2,
            satrec: null // Will be computed client-side
          })
        }
      }
    }

    console.log(`Parsed ${satellites.length} Starlink satellites from TLE data`)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=21600' // Cache for 6 hours
      },
      body: JSON.stringify({
        satellites: satellites,
        totalCount: satellites.length,
        timestamp: new Date().toISOString(),
        source: 'CelesTrak',
        cacheExpiry: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
      })
    }

  } catch (error) {
    console.error('TLE fetch error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to fetch TLE data',
        details: error.message
      })
    }
  }
}