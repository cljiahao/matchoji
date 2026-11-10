import { z } from 'zod';

// Café and drink slugs are lowercase words joined by hyphens. Route params are visitor input, so
// anything else is not a café and never reaches a query or a redirect target.
export const SlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
