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

    console.log('N2YO API Key:', N2YO_API_KEY ? 'Present' : 'Missing')
    
    // Try to get satellites from the requested location first
    try {
      const response = await axios.get(
        `${N2YO_BASE_URL}/above/${latitude}/${longitude}/0/90/52/&apiKey=${N2YO_API_KEY}`
      )
      
      const satellites = response.data.above || []
      console.log(`Found ${satellites.length} satellites above ${latitude}, ${longitude}`)
      console.log('First satellite example:', satellites[0])
      
      // Don't do pass predictions for now - just return the satellites
      const satellitesWithPasses = satellites.map(sat => ({
        ...sat,
        passes: []
      }))
      
      console.log(`Returning ${satellitesWithPasses.length} satellites`)
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60' // Cache for 1 minute
        },
        body: JSON.stringify({
          satellites: satellitesWithPasses,
          totalCount: satellites.length,
          timestamp: new Date().toISOString(),
          location: { latitude, longitude }
        })
      }
      
    } catch (apiError) {
      console.error('N2YO API Error:', apiError.response?.data || apiError.message)
      
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'N2YO API failed',
          details: apiError.response?.data || apiError.message
        })
      }
    }

  } catch (error) {
    console.error('Get satellites error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch satellite data' })
    }
  }
}