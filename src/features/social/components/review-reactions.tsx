'use client';

import { Flag, Heart, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSession, useSignInPrompt } from '@/features/auth';
import { createClient } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

import {
  addComment,
  deleteComment,
  reportContent,
  setLiked,
  type Reactions,
  type ReviewComment,
} from '../api/reactions-service';

interface ReviewReactionsProps {
  reviewId: string;
  reviewAuthorId: string | null;
  initial: Reactions;
}

const MAX_COMMENT = 1000;
const MAX_REASON = 500;

function ReportForm({
  target,
  targetId,
  onDone,
}: {
  target: 'review' | 'comment';
  targetId: string;
  onDone: () => void;
}) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await reportContent(createClient(), target, targetId, reason);
      toast.success('Thanks. We will look at it and let you know.');
      onDone();
    } catch {
      toast.error('Could not send the report. You may have reported this already.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full space-y-2" aria-label={`Report this ${target}`}>
      <Textarea
        aria-label={`What is wrong with this ${target}?`}
        placeholder="Spam, abuse, not about this tea…"
        value={reason}
        maxLength={MAX_REASON}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy || !reason.trim()}>
          Send report
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// Like, comment and report under a review, as on Vivino. Visitors are asked to sign in.
export function ReviewReactions({ reviewId, reviewAuthorId, initial }: ReviewReactionsProps) {
  const { session } = useSession();
  const promptSignIn = useSignInPrompt();
  const me = session?.user.id ?? null;
  const [likes, setLikes] = useState(initial.likes);
  const [liked, setLikedState] = useState(initial.liked);
  const [comments, setComments] = useState<ReviewComment[]>(initial.comments);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState<{ target: 'review' | 'comment'; id: string } | null>(
    null
  );

  function needSession(reason: string): string | null {
    if (me) return me;
    promptSignIn({ reason });
    return null;
  }

  async function toggleLike() {
    const user = needSession('Sign in to like tastings.');
    if (!user) return;
    const next = !liked;
    setLikedState(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      await setLiked(createClient(), user, reviewId, next);
    } catch {
      setLikedState(!next);
      setLikes((n) => n - (next ? 1 : -1));
      toast.error('Could not update your like.');
    }
  }

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!needSession('Sign in to comment.')) return;
    setBusy(true);
    try {
      const row = await addComment(createClient(), reviewId, draft);
      setComments((list) => [
        ...list,
        {
          id: row.id,
          reviewId,
          body: row.body,
          authorId: row.user_id,
          authorName: 'You',
          createdAt: row.created_at,
        },
      ]);
      setDraft('');
    } catch {
      toast.error('Could not post your comment. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function removeComment(id: string) {
    try {
      await deleteComment(createClient(), id);
      setComments((list) => list.filter((c) => c.id !== id));
    } catch {
      toast.error('Could not delete the comment.');
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-1 text-sm">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={liked}
          aria-label={`Like (${likes})`}
          onClick={toggleLike}
        >
          <Heart aria-hidden="true" className={cn(liked && 'fill-current text-red-600')} />
          <span className="tabular-nums">{likes}</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <MessageCircle aria-hidden="true" />
          {comments.length === 1 ? '1 comment' : `${comments.length} comments`}
        </Button>
        {me && me !== reviewAuthorId && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setReporting({ target: 'review', id: reviewId })}
          >
            <Flag aria-hidden="true" />
            Report
          </Button>
        )}
      </div>

      {reporting && (
        <ReportForm
          target={reporting.target}
          targetId={reporting.id}
          onDone={() => setReporting(null)}
        />
      )}

      {open && (
        <div className="space-y-3">
          {comments.length > 0 && (
            <ul className="space-y-2">
              {comments.map((c) => (
                <li key={c.id} className="bg-muted rounded-xl px-3 py-2 text-sm">
                  <Link href={`/u/${c.authorId}`} className="font-semibold hover:underline">
                    {c.authorName}
                  </Link>{' '}
                  <span className="whitespace-pre-line">{c.body}</span>
                  <span className="mt-1 flex gap-3 text-xs">
                    {(me === c.authorId || me === reviewAuthorId) && (
                      <button
                        type="button"
                        className="text-muted-foreground hover:underline"
                        onClick={() => removeComment(c.id)}
                      >
                        Delete
                      </button>
                    )}
                    {me && me !== c.authorId && (
                      <button
                        type="button"
                        className="text-muted-foreground hover:underline"
                        onClick={() => setReporting({ target: 'comment', id: c.id })}
                      >
                        Report
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={submitComment} className="space-y-2" aria-label="Add a comment">
            <Textarea
              aria-label="Your comment"
              placeholder="Add a comment…"
              value={draft}
              maxLength={MAX_COMMENT}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={busy || !draft.trim()}>
              Post comment
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
