import { ExternalLink } from 'lucide-react';

// The link is stored data, so only a real Instagram post URL is rendered as one.
function isInstagramUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && hostname === 'www.instagram.com';
  } catch {
    return false;
  }
}

// Links out rather than embedding: Instagram's embed script would need CSP changes.
export function InstagramPostLink({ url }: { url: string }) {
  if (!isInstagramUrl(url)) return null;
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
