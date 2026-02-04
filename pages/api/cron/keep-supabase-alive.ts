import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Cron job to keep Supabase project alive
 * Runs daily to prevent free tier from pausing after 7 days inactivity
 * 
 * Schedule: Daily at 2 AM UTC (6 PM PST)
 * 
 * Serves: Centaurus Drum Machine + PixelBoop Jam Sessions
 * Both projects share the same Supabase instance (Realtime channels)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify this is a Vercel cron request
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid cron secret' 
    });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Step 1: Read from _keep_alive table
    const { data: readData, error: readError } = await supabase
      .from('_keep_alive')
      .select('*')
      .single();

    if (readError && readError.code !== 'PGRST116') {
      // PGRST116 = row not found (expected on first run)
      throw readError;
    }

    // Step 2: Write/update last_ping timestamp
    const { error: writeError } = await supabase
      .from('_keep_alive')
      .upsert({
        id: 1,
        last_ping: new Date().toISOString()
      });

    if (writeError) {
      throw writeError;
    }

    // Success
    return res.status(200).json({
      ok: true,
      projects: ['centaurus', 'pixelboop'],
      timestamp: new Date().toISOString(),
      previous_ping: readData?.last_ping || 'first run'
    });

  } catch (error) {
    console.error('[Cron] Keep-alive failed:', error);
    
    return res.status(500).json({
      ok: false,
      error: String(error),
      timestamp: new Date().toISOString()
    });
  }
}
