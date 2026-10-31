'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import Link from 'next/link';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession } from '@/features/auth';
import { createClient } from '@/integrations/supabase/client';

import {
  describeNotification,
  listNotifications,
  markAllRead,
  notificationHref,
} from '../api/notifications-service';

// In-app notifications (follows, likes, comments, review outcomes). Opening the menu marks
// them read. Signed-out visitors see nothing.
export function NotificationBell() {
  const { session } = useSession();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const key = ['notifications', userId];

  const { data: notifications = [] } = useQuery({
    queryKey: key,
    queryFn: () => listNotifications(createClient()),
    enabled: Boolean(userId),
    refetchInterval: 60_000,
  });
  const markRead = useMutation({
    mutationFn: () => markAllRead(createClient(), userId as string),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  if (!userId) return null;
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu onOpenChange={(open) => open && unread > 0 && markRead.mutate()}>
      <DropdownMenuTrigger
        className="hover:bg-muted relative rounded-full p-3"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      >
        <Bell aria-hidden="true" className="h-5 w-5" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="bg-brand text-brand-foreground absolute -top-0.5 -right-0.5 min-w-4 rounded-full px-1 text-[10px] leading-4 font-bold"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>Nothing new yet.</DropdownMenuItem>
        ) : (
          notifications.map((n) => {
            const href = notificationHref(n);
            const text = describeNotification(n);
            return (
              <DropdownMenuItem key={n.id} asChild={Boolean(href)} className="whitespace-normal">
                {href ? (
                  <Link href={href} className={n.read ? 'text-muted-foreground' : 'font-semibold'}>
                    {text}
                  </Link>
                ) : (
                  <span className={n.read ? 'text-muted-foreground' : 'font-semibold'}>{text}</span>
                )}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
