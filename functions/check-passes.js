import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import axios from 'axios'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const resendApiKey = process.env.RESEND_API_KEY
const N2YO_API_KEY = process.env.N2YO_API_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const resend = new Resend(resendApiKey)

const N2YO_BASE_URL = 'https://api.n2yo.com/rest/v1/satellite'

// This is a scheduled function that runs every 15 minutes
export const handler = async (event) => {
  console.log('Checking for upcoming satellite passes...')

  try {
    // Get all active subscribers
    const { data: subscribers, error: fetchError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('active', true)

    if (fetchError) throw fetchError

    console.log(`Found ${subscribers.length} active subscribers`)

    // Check passes for each subscriber
    for (const subscriber of subscribers) {
      await checkSubscriberPasses(subscriber)
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Pass check completed',
        subscribersChecked: subscribers.length 
      })
    }
  } catch (error) {
    console.error('Check passes error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to check passes' })
    }
  }
}

async function checkSubscriberPasses(subscriber) {
  try {
    // Get visible passes for the next 2 hours
    // We'll check a selection of Starlink satellites
    const starlinkSatellites = [44235, 44236, 44237, 44238, 44239] // Sample NORAD IDs

    for (const satId of starlinkSatellites) {
      const response = await axios.get(
        `${N2YO_BASE_URL}/visualpasses/${satId}/${subscriber.latitude}/${subscriber.longitude}/0/0.1/300/&apiKey=${N2YO_API_KEY}`
      )

      if (response.data.passes && response.data.passes.length > 0) {
        for (const pass of response.data.passes) {
          // Check if pass is between 45-75 minutes from now
          const passTime = new Date(pass.startUTC * 1000)
          const now = new Date()
          const minutesUntilPass = (passTime - now) / (1000 * 60)

          if (minutesUntilPass >= 45 && minutesUntilPass <= 75) {
            // Check if we've already sent an email for this pass
            const { data: existingLog } = await supabase
              .from('email_logs')
              .select('*')
              .eq('subscriber_id', subscriber.id)
              .eq('satellite_name', response.data.info.satname)
              .gte('pass_time', new Date(passTime.getTime() - 30 * 60000).toISOString())
              .lte('pass_time', new Date(passTime.getTime() + 30 * 60000).toISOString())
              .single()

            if (!existingLog) {
              // Send notification email
              await sendPassNotification(subscriber, response.data.info, pass)

              // Log the email
              await supabase
                .from('email_logs')
                .insert({
                  subscriber_id: subscriber.id,
                  satellite_name: response.data.info.satname,
                  pass_time: passTime.toISOString(),
                  status: 'sent'
                })
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error checking passes for subscriber ${subscriber.email}:`, error)
  }
}

async function sendPassNotification(subscriber, satelliteInfo, pass) {
  const passTime = new Date(pass.startUTC * 1000)
  const unsubscribeUrl = `${process.env.VITE_APP_URL}/unsubscribe?token=${subscriber.unsubscribe_token}`

  try {
    await resend.emails.send({
      from: 'Starlink Tracker <noreply@starlinktracker.app>',
      to: subscriber.email,
      subject: '🛰️ Starlink satellite passing overhead soon!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0e27; color: #ffffff; padding: 20px; border-radius: 10px;">
          <h1 style="text-align: center; color: #4a9eff;">🛰️ Starlink Alert!</h1>
          <p style="font-size: 18px; text-align: center;">Get ready to look up!</p>
          
          <div style="background-color: #1a1f3a; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Satellite:</strong> ${satelliteInfo.satname}</p>
            <p style="margin: 10px 0;"><strong>Pass Time:</strong> ${passTime.toLocaleString()}</p>
            <p style="margin: 10px 0;"><strong>Your Location:</strong> ${subscriber.location_name || 'Your saved location'}</p>
            <p style="margin: 10px 0;"><strong>Max Elevation:</strong> ${pass.maxEl}°</p>
            <p style="margin: 10px 0;"><strong>Duration:</strong> ${pass.duration} seconds</p>
          </div>
          
          <div style="background-color: #1a1f3a; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Start:</strong> Azimuth ${pass.startAz}° (${pass.startAzCompass})</p>
            <p style="margin: 5px 0;"><strong>Maximum:</strong> Azimuth ${pass.maxAz}° (${pass.maxAzCompass})</p>
            <p style="margin: 5px 0;"><strong>End:</strong> Azimuth ${pass.endAz}° (${pass.endAzCompass})</p>
          </div>
          
          <p style="text-align: center; font-size: 16px;">
            The satellite will be visible for approximately ${Math.round(pass.duration / 60)} minutes, 
            reaching a maximum elevation of ${pass.maxEl}° above the horizon.
          </p>
          
          <p style="text-align: center; margin-top: 30px; font-size: 14px; color: #888;">
            <a href="${unsubscribeUrl}" style="color: #4a9eff;">Unsubscribe</a>
          </p>
        </div>
      `
    })

    console.log(`Sent pass notification to ${subscriber.email} for ${satelliteInfo.satname}`)
  } catch (error) {
    console.error(`Failed to send pass notification to ${subscriber.email}:`, error)
  }
}