'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { ShieldIcon } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/plans';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        router.push(redirectPath);
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 pb-24 animate-fade-in">
      <div className="max-w-md w-full glass-card rounded-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[rgba(0,255,157,0.1)] flex items-center justify-center mb-4 neon-glow-sm">
            <ShieldIcon className="w-7 h-7 text-[#00ff9d]" />
          </div>
          <h1 className="text-2xl font-bold text-[#f0f4f8]">Admin Login</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[rgba(220,38,38,0.1)] border border-[rgba(220,38,38,0.3)] rounded-lg text-[#fca5a5] text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#f0f4f8] mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 glass-input rounded-lg text-[#f0f4f8] placeholder-[#8b9bb4] transition-all focus:ring-2 focus:ring-[rgba(0,255,157,0.3)]"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#f0f4f8] mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 glass-input rounded-lg text-[#f0f4f8] placeholder-[#8b9bb4] transition-all focus:ring-2 focus:ring-[rgba(0,255,157,0.3)]"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[58px] rounded-[300px] font-medium text-[#060a13] bg-[#00ff9d] hover:scale-[1.02] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-[#060a13] border-t-transparent rounded-full animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <ShieldIcon className="w-5 h-5" />
                Login
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-[#00d2ff] hover:text-[#00ff9d] transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}