import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Database schema for reference:
// 
// CREATE TABLE subscribers (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   email VARCHAR(255) NOT NULL UNIQUE,
//   latitude DECIMAL(10, 8) NOT NULL,
//   longitude DECIMAL(11, 8) NOT NULL,
//   location_name VARCHAR(255),
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
//   updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
//   active BOOLEAN DEFAULT true,
//   unsubscribe_token UUID DEFAULT gen_random_uuid()
// );
// 
// CREATE TABLE email_logs (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
//   sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
//   satellite_name VARCHAR(255),
//   pass_time TIMESTAMP WITH TIME ZONE,
//   status VARCHAR(50)
// );