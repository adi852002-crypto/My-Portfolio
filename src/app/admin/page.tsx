import type { Metadata } from 'next';
import { Dashboard } from '@/components/admin/Dashboard';

/* Private: Cloudflare Access asks for a sign-in before this page loads, and
   the data behind it is checked again by the server. Kept out of search. */
export const metadata: Metadata = {
  title: 'Site analytics',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main id="main" className="mx-auto max-w-[1400px] px-4 sm:px-6">
      <Dashboard />
    </main>
  );
}
