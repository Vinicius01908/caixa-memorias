const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nizsmqzkqdtupezqwdsv.supabase.co').trim().replace(/\/+$/, '');
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5penNtcXprcWR0dXBlenF3ZHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MTk3NzQsImV4cCI6MjEwNDI5NTc3NH0.6mkuHC8iECT8I_91s-hifiL8PFGb-FG19MUl9PWTcAc').trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;
