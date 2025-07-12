import axios from 'axios'

const N2YO_API_KEY = process.env.N2YO_API_KEY
const N2YO_BASE_URL = 'https://api.n2yo.com/rest/v1/satellite'

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { latitude, longitude } = event.queryStringParameters

    if (!latitude || !longitude) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing latitude or longitude' })
      }
    }

    // Get Starlink satellites above horizon
    // Category 52 is Starlink satellites
    const response = await axios.get(
      `${N2YO_BASE_URL}/above/${latitude}/${longitude}/0/70/52/&apiKey=${N2YO_API_KEY}`
    )

    const satellites = response.data.above || []

    // Get visual passes for the next 10 days for a few satellites
    // (We'll limit this to avoid rate limits)
    const passPromises = satellites.slice(0, 5).map(async (sat) => {
      try {
        const passResponse = await axios.get(
          `${N2YO_BASE_URL}/visualpasses/${sat.satid}/${latitude}/${longitude}/0/10/300/&apiKey=${N2YO_API_KEY}`
        )
        return {
          ...sat,
          passes: passResponse.data.passes || []
        }
      } catch (error) {
        console.error(`Failed to get passes for satellite ${sat.satid}:`, error)
        return {
          ...sat,
          passes: []
        }
      }
    })

    const satellitesWithPasses = await Promise.all(passPromises)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      },
      body: JSON.stringify({
        satellites: satellitesWithPasses,
        totalCount: satellites.length,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Get satellites error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch satellite data' })
    }
  }
}