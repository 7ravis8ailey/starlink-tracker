import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const resendApiKey = process.env.RESEND_API_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const resend = new Resend(resendApiKey)

export const handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { email, latitude, longitude, locationName } = JSON.parse(event.body)

    // Validate input
    if (!email || !latitude || !longitude) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      }
    }

    // Check if email already exists
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('email', email)
      .single()

    if (existingSubscriber && existingSubscriber.active) {
      // Update location if subscriber exists and is active
      const { error: updateError } = await supabase
        .from('subscribers')
        .update({
          latitude,
          longitude,
          location_name: locationName,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)

      if (updateError) throw updateError

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Location updated successfully',
          isUpdate: true 
        })
      }
    } else if (existingSubscriber && !existingSubscriber.active) {
      // Reactivate subscriber
      const { error: reactivateError } = await supabase
        .from('subscribers')
        .update({
          active: true,
          latitude,
          longitude,
          location_name: locationName,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)

      if (reactivateError) throw reactivateError

      // Send welcome back email
      await sendWelcomeEmail(email, locationName, existingSubscriber.unsubscribe_token)

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Successfully resubscribed!',
          isReactivation: true 
        })
      }
    } else {
      // Create new subscriber
      const { data: newSubscriber, error: insertError } = await supabase
        .from('subscribers')
        .insert({
          email,
          latitude,
          longitude,
          location_name: locationName
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }

      // Send welcome email
      await sendWelcomeEmail(email, locationName, newSubscriber.unsubscribe_token)

      return {
        statusCode: 201,
        body: JSON.stringify({ 
          message: 'Successfully subscribed!',
          isNew: true 
        })
      }
    }
  } catch (error) {
    console.error('Subscribe error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to subscribe' })
    }
  }
}

async function sendWelcomeEmail(email, locationName, unsubscribeToken) {
  const unsubscribeUrl = `${process.env.VITE_APP_URL}/unsubscribe?token=${unsubscribeToken}`
  
  try {
    await resend.emails.send({
      from: 'Starlink Tracker <noreply@starlinktracker.app>',
      to: email,
      subject: 'Welcome to Starlink Tracker! 🚀',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0e27; color: #ffffff; padding: 20px; border-radius: 10px;">
          <h1 style="text-align: center; color: #4a9eff;">Welcome to Starlink Tracker!</h1>
          <p style="font-size: 18px; text-align: center;">You're all set to receive satellite alerts!</p>
          
          <div style="background-color: #1a1f3a; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Hi there!</p>
            <p>You've successfully subscribed to receive alerts for Starlink satellites passing over:</p>
            <p style="font-size: 20px; text-align: center; margin: 20px 0;"><strong>${locationName || 'your location'}</strong></p>
            <p>We'll send you an email 1 hour before each visible pass, so you have time to prepare and head outside!</p>
          </div>
          
          <p style="text-align: center; margin-top: 30px; font-size: 14px; color: #888;">
            <a href="${unsubscribeUrl}" style="color: #4a9eff;">Unsubscribe</a>
          </p>
        </div>
      `
    })
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }
}