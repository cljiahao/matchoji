import { ExternalLink } from 'lucide-react';

// Links out rather than embedding: Instagram's embed script would need CSP changes.
export function InstagramPostLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand inline-flex items-center gap-1 text-sm font-semibold hover:underline"
    >
      See the post on Instagram
      <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
    </a>
  );
}
