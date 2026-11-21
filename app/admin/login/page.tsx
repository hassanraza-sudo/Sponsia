'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/site/site-footer';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const notAdmin = params.get('error') === 'not_admin';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return toast.error('Enter your email and password.');
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return toast.error(error.message === 'Invalid login credentials'
        ? 'Invalid email or password.'
        : error.message);

      const { data: isAdmin } = await supabase.rpc('is_admin');
      if (!isAdmin) {
        await supabase.auth.signOut();
        return toast.error('This account does not have administrator access.');
      }
      router.push('/admin');
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest-deep px-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-10 shadow-2xl">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <h1 className="text-center font-display text-2xl font-semibold text-forest-deep">Administrator Sign In</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Private area — authorised personnel only.
        </p>

        {notAdmin && (
          <p className="mt-6 rounded-xl bg-destructive/10 p-4 text-center text-sm text-destructive">
            This account does not have administrator access.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-forest py-3 text-white hover:bg-forest-deep"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
            ) : (
              <><Lock className="h-4 w-4" /> Sign in</>
            )}
          </Button>
        </form>

        <Link href="/" className="mt-6 block text-center text-sm text-muted-foreground hover:text-forest">
          ← Back to website
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
