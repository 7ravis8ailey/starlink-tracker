// Starlink satellite NORAD IDs (sample - we'll fetch more from API)
export const STARLINK_NORAD_IDS = [
  44235, 44236, 44237, 44238, 44239, // Sample IDs
  44240, 44241, 44242, 44243, 44244
]

// N2YO Categories
export const N2YO_CATEGORIES = {
  STARLINK: 52 // Starlink satellites category
}

// Email templates
export const EMAIL_TEMPLATES = {
  PASS_NOTIFICATION: {
    subject: '🛰️ Starlink satellite passing overhead soon!',
    getHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0e27; color: #ffffff; padding: 20px; border-radius: 10px;">
        <h1 style="text-align: center; color: #4a9eff;">🛰️ Starlink Alert!</h1>
        <p style="font-size: 18px; text-align: center;">Get ready to look up!</p>
        
        <div style="background-color: #1a1f3a; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Satellite:</strong> ${data.satelliteName}</p>
          <p style="margin: 10px 0;"><strong>Pass Time:</strong> ${data.passTime}</p>
          <p style="margin: 10px 0;"><strong>Your Location:</strong> ${data.locationName}</p>
          <p style="margin: 10px 0;"><strong>Max Elevation:</strong> ${data.maxElevation}°</p>
          <p style="margin: 10px 0;"><strong>Duration:</strong> ${data.duration} minutes</p>
        </div>
        
        <p style="text-align: center; font-size: 16px;">
          The satellite will be visible for approximately ${data.duration} minutes, 
          reaching a maximum elevation of ${data.maxElevation}° above the horizon.
        </p>
        
        <p style="text-align: center; margin-top: 30px; font-size: 14px; color: #888;">
          <a href="${data.unsubscribeUrl}" style="color: #4a9eff;">Unsubscribe</a>
        </p>
      </div>
    `
  },
  WELCOME: {
    subject: 'Welcome to Starlink Tracker! 🚀',
    getHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0e27; color: #ffffff; padding: 20px; border-radius: 10px;">
        <h1 style="text-align: center; color: #4a9eff;">Welcome to Starlink Tracker!</h1>
        <p style="font-size: 18px; text-align: center;">You're all set to receive satellite alerts!</p>
        
        <div style="background-color: #1a1f3a; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>Hi there!</p>
          <p>You've successfully subscribed to receive alerts for Starlink satellites passing over:</p>
          <p style="font-size: 20px; text-align: center; margin: 20px 0;"><strong>${data.locationName}</strong></p>
          <p>We'll send you an email 1 hour before each visible pass, so you have time to prepare and head outside!</p>
        </div>
        
        <p style="text-align: center; margin-top: 30px; font-size: 14px; color: #888;">
          <a href="${data.unsubscribeUrl}" style="color: #4a9eff;">Unsubscribe</a>
        </p>
      </div>
    `
  }
}