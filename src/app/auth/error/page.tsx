import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function AuthErrorPage() {
  return (
    <div className="flex-center min-h-screen flex-col gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Sign-in failed</h1>
      <p className="text-muted-foreground max-w-sm">
        Something went wrong signing you in. Please try again.
      </p>
      <Button asChild>
        <Link href="/">Back to Matchoji</Link>
      </Button>
    </div>
  );
}
