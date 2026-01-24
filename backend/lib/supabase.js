const { createClient } = require('@supabase/supabase-js');

// Singleton Supabase client with optimized configuration
// This ensures connection pooling and reuse across all routes
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false, // We handle auth ourselves
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-client-info': 'blood-donation-system',
      },
    },
  }
);

module.exports = supabase;
