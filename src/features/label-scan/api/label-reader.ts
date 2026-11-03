import type Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

import { labelReadingSchema, type LabelReading } from '../schemas';

export const LABEL_MODEL = 'claude-haiku-5-5';

const SYSTEM_PROMPT = `You read the label on a tin or packet of matcha or hojicha and report what is printed on it.
- Labels are often in Japanese. Report every text field in English: transliterate names (romaji) and translate descriptive words (for example 濃茶 becomes "koicha grade").
- maker is the brand or producer. name is the product's own name, without the maker and without the category word unless it is part of the name.
- category is "matcha" or "hojicha" only when the label says so; otherwise null.
- netWeightGrams is the net weight in grams; convert ounces. harvest is a season or year such as "first flush 2025".
- Return null for any field you cannot read. Never guess or infer a value that is not printed on the label.
- confidence is how legible and complete the label was: low, medium or high.
- If the image is not a tea label, return null for every field and confidence "low".`;

export type LabelMediaType = 'image/jpeg' | 'image/png' | 'image/webp';

export type LabelReaderClient = Pick<Anthropic, 'messages'>;

// Null means the model had nothing usable to report: a refusal, an unparseable answer, or a
// photo with neither maker nor name legible.
export async function readLabel(
  client: LabelReaderClient,
  image: { base64: string; mediaType: LabelMediaType }
): Promise<LabelReading | null> {
  const response = await client.messages.parse({
    model: LABEL_MODEL,
    // Thinking tokens count against this, so leave room beyond the short JSON answer.
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    output_config: { effort: 'low', format: zodOutputFormat(labelReadingSchema) },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: image.mediaType, data: image.base64 },
          },
          { type: 'text', text: 'Read this label.' },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal') return null;
  const parsed = labelReadingSchema.safeParse(response.parsed_output);
  if (!parsed.success) return null;
  return parsed.data.maker || parsed.data.name ? parsed.data : null;
}
