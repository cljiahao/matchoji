import Anthropic from '@anthropic-ai/sdk';
import { NextResponse, type NextRequest } from 'next/server';

import {
  labelImageSchema,
  matchLabel,
  readLabel,
  recordScan,
  type LabelMediaType,
} from '@/features/label-scan/server';
import { createClient } from '@/integrations/supabase/server';
import { anthropicApiKey } from '@/lib/constants/env';
import { withLogging } from '@/lib/utils/with-logging';

// Signed-in only: each scan costs money. The feature is off (503 / enabled: false) until
// ANTHROPIC_API_KEY is set, so a deploy without the key behaves as before.
export const GET = withLogging(async (): Promise<NextResponse> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: 'Sign in to scan labels.' }, { status: 401 });
  return NextResponse.json({ enabled: Boolean(anthropicApiKey()) });
});

export const POST = withLogging(async (req: NextRequest): Promise<NextResponse> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: 'Sign in to scan labels.' }, { status: 401 });

  const apiKey = anthropicApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: 'Label scanning is not available.' }, { status: 503 });
  }

  const form = await req.formData().catch(() => null);
  const image = labelImageSchema.safeParse(form?.get('image'));
  if (!image.success) {
    return NextResponse.json(
      { error: image.error.issues[0]?.message ?? 'Attach a photo of the label.' },
      { status: 400 }
    );
  }

  // Counted before the model call so a failing or abusive client still spends its allowance.
  if ((await recordScan(supabase)) === 'limited') {
    return NextResponse.json({ error: 'Daily scan limit reached.' }, { status: 429 });
  }

  const bytes = Buffer.from(await image.data.arrayBuffer());
  let reading;
  try {
    reading = await readLabel(new Anthropic({ apiKey }), {
      base64: bytes.toString('base64'),
      mediaType: image.data.type as LabelMediaType,
    });
  } catch (error) {
    // 400 from the API means the bytes were not a decodable image of the declared type.
    if (error instanceof Anthropic.BadRequestError) {
      return NextResponse.json({ error: 'That photo could not be read.' }, { status: 422 });
    }
    throw error;
  }
  if (!reading) {
    return NextResponse.json({ error: 'No label could be read.' }, { status: 422 });
  }

  return NextResponse.json({ reading, match: await matchLabel(supabase, reading) });
});
