import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { demoLogin, googleLogin } from '../services/api';

export default function Login() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(
    !import.meta.env.VITE_GOOGLE_CLIENT_ID
  );
  const [email, setEmail] = useState('demo@example.com');
  const [name, setName] = useState('Demo User');

  const save = (u: any) => {
    localStorage.setItem('reachinbox_user', JSON.stringify(u));
    nav('/dashboard');
  };

  const onGoogle = async (credential: string) => {
    try {
      setLoading(true);
      setError('');
      save(await googleLogin(credential));
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const onDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      save(await demoLogin(email, name));
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5faf7] px-5 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_24px_80px_rgba(20,70,40,0.10)] md:grid-cols-2">
          {/* Left Decorative Banner */}
          <div className="hidden bg-emerald-500 p-10 text-white md:block">
            <div className="flex items-center gap-2 font-semibold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
                <Mail size={18} />
              </span>
              ReachInbox
            </div>
            <div className="mt-24 max-w-sm">
              <Sparkles size={28} />
              <h1 className="mt-5 text-4xl font-semibold leading-tight">
                Schedule outreach without losing control.
              </h1>
              <p className="mt-5 text-sm leading-6 text-emerald-50">
                Queue campaigns, throttle delivery, search your email history
                and monitor every job from one clean workspace.
              </p>
              <div className="mt-10 flex items-center gap-3 text-sm text-emerald-50">
                <ShieldCheck size={18} />
                Persistent queue-backed delivery
              </div>
            </div>
          </div>

          {/* Right Form Container */}
          <div className="p-7 sm:p-10">
            <div className="mb-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 md:hidden">
                <Mail size={20} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-600">
                Workspace login
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Sign in to manage your scheduled campaigns.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={(r) => r.credential && onGoogle(r.credential)}
                  onError={() =>
                    setError('Google sign-in was cancelled or failed.')
                  }
                  useOneTap={false}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                Google OAuth is not configured yet. Add{' '}
                <b>VITE_GOOGLE_CLIENT_ID</b> to <b>frontend/.env.local</b> to
                enable real Google sign-in.
              </div>
            )}

            <div className="my-7 flex items-center gap-3 text-xs text-gray-400">
              <div className="h-px flex-1 bg-gray-100" />
              OR
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            <button
              className="w-full text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              onClick={() => setShowDemo((v) => !v)}
            >
              {showDemo ? 'Hide' : 'Use'} development credentials fallback
            </button>

            {showDemo && (
              <form onSubmit={onDemo} className="mt-5 space-y-4">
                <div>
                  <label className="label">Name</label>
                  <input
                    className="field"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    className="field"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Signing in…' : 'Continue to workspace'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}