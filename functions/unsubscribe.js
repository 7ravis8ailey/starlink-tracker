import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const handler = async (event) => {
  // Allow both GET and POST
  if (!['GET', 'POST'].includes(event.httpMethod)) {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Get token from query params or body
    let token
    if (event.httpMethod === 'GET') {
      token = event.queryStringParameters?.token
    } else {
      const body = JSON.parse(event.body)
      token = body.token
    }

    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing unsubscribe token' })
      }
    }

    // Find subscriber by token
    const { data: subscriber, error: findError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('unsubscribe_token', token)
      .single()

    if (findError || !subscriber) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Invalid unsubscribe token' })
      }
    }

    // Mark subscriber as inactive
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('unsubscribe_token', token)

    if (updateError) throw updateError

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Successfully unsubscribed',
        email: subscriber.email
      })
    }
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to unsubscribe' })
    }
  }
}