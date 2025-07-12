# Starlink Tracker 🛰️

A real-time Starlink satellite tracker that sends email alerts 1 hour before satellites pass overhead.

## Features

- 🌍 Interactive 3D globe showing real-time satellite positions
- 📧 Email alerts 1 hour before visible satellite passes
- 📍 Location input with autocomplete or device geolocation
- 🌙 Beautiful dark space-themed UI
- 📱 Mobile-friendly responsive design
- 🔒 Privacy-focused with easy unsubscribe

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   N2YO_API_KEY=your_n2yo_api_key
   RESEND_API_KEY=your_resend_api_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   VITE_APP_URL=http://localhost:5173
   ```

4. Set up your Supabase database with the following tables:
   ```sql
   CREATE TABLE subscribers (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     email VARCHAR(255) NOT NULL UNIQUE,
     latitude DECIMAL(10, 8) NOT NULL,
     longitude DECIMAL(11, 8) NOT NULL,
     location_name VARCHAR(255),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
     active BOOLEAN DEFAULT true,
     unsubscribe_token UUID DEFAULT gen_random_uuid()
   );

   CREATE TABLE email_logs (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
     sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
     satellite_name VARCHAR(255),
     pass_time TIMESTAMP WITH TIME ZONE,
     status VARCHAR(50)
   );
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. For local testing of Netlify functions:
   ```bash
   netlify dev
   ```

## Deployment

1. Push to GitHub
2. Connect repository to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy!

## API Keys Required

- **N2YO API**: Get your API key from [n2yo.com](https://www.n2yo.com/api/)
- **Resend**: Sign up at [resend.com](https://resend.com/)
- **Supabase**: Create a project at [supabase.com](https://supabase.com/)

## Technologies Used

- React + Vite
- react-globe.gl for 3D visualization
- Netlify Functions for backend
- Supabase for database
- Resend for email delivery
- N2YO API for satellite data
