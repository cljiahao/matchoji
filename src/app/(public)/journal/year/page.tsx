import { redirect } from 'next/navigation';

// "Year in tea" with no year is the current one.
export default function YearIndexPage() {
  redirect(`/journal/year/${new Date().getUTCFullYear()}`);
}
