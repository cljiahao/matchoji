import { type NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/integrations/supabase/server';
import { withLogging } from '@/lib/utils/with-logging';

// Public by design (load balancers and uptime probes call it without a session); it reveals
// only whether the database answers. Every route handler is wrapped in withLogging, which the
// lint gate (see AGENTS.md) enforces.
async function databaseUp(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('health');
    return !error && data === true;
  } catch {
    // Missing configuration or an unreachable project both count as down.
    return false;
  }
}

export const GET = withLogging(async (_req: NextRequest): Promise<NextResponse> => {
  const database = await databaseUp();
  return NextResponse.json(
    {
      status: database ? 'ok' : 'degraded',
      checks: { database: database ? 'ok' : 'down' },
      timestamp: new Date().toISOString(),
    },
    { status: database ? 200 : 503 }
  );
});
