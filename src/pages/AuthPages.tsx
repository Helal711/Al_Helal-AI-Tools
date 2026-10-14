import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Sparkles, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AuthPageProps {
  mode: 'login' | 'register' | 'forgot-password' | 'profile';
  setActiveView: (view: string) => void;
}

export const AuthPages: React.FC<AuthPageProps> = ({ mode, setActiveView }) => {
  const { user, loginWithGoogle, loginWithEmail, logout, updateProfile } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Profile fields
  const [profileName, setProfileName] = useState(user?.displayName || '');
  const [defaultFormat, setDefaultFormat] = useState<'png' | 'webp' | 'jpeg'>(user?.preferences.defaultFormat || 'png');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      success('Logged in successfully! Welcome to Al_Helal AI Tools.');
      const redirect = sessionStorage.getItem('pf_auth_redirect') || 'dashboard';
      sessionStorage.removeItem('pf_auth_redirect');
      setActiveView(redirect);
    } catch {
      error('Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      error('Passwords do not match. Please re-enter.');
      return;
    }
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      updateProfile({ displayName: name });
      success('Account created! Welcome to Al_Helal AI Tools.');
      const redirect = sessionStorage.getItem('pf_auth_redirect') || 'dashboard';
      sessionStorage.removeItem('pf_auth_redirect');
      setActiveView(redirect);
    } catch {
      error('Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      success('Signed in with Google! Welcome.');
      const redirect = sessionStorage.getItem('pf_auth_redirect') || 'dashboard';
      sessionStorage.removeItem('pf_auth_redirect');
      setActiveView(redirect);
    } catch {
      error('Google sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setResetSent(true);
    success(`Reset instructions sent to ${email}`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      displayName: profileName,
      preferences: {
        theme: 'light',
        autoEnhance: true,
        defaultFormat,
      },
    });
    success('Profile updated successfully!');
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {mode === 'login' && 'Sign In to PixelForge'}
            {mode === 'register' && 'Create Free Account'}
            {mode === 'forgot-password' && 'Reset Your Password'}
            {mode === 'profile' && 'User Account Profile'}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login' && 'Access your visual projects, cutouts, and history.'}
            {mode === 'register' && 'Join thousands of creators. 100% free with unlimited fair-use access.'}
            {mode === 'forgot-password' && 'Enter your email address to receive password reset link.'}
            {mode === 'profile' && 'Manage your name, defaults, and account details.'}
          </p>
        </div>

        {/* 1. LOGIN VIEW */}
        {mode === 'login' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <span className="relative bg-white px-3 text-[11px] font-medium text-slate-400 dark:bg-slate-900">
                or use email
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveView('forgot-password')}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded-sm text-indigo-600 accent-indigo-600 cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  Remember session on this device
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In to Dashboard'}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setActiveView('register')}
                className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Create Account Free
              </button>
            </p>
          </div>
        )}

        {/* 2. REGISTER VIEW */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <div className="relative mt-1">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Confirm Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Register & Enter Studio'}
            </button>

            <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setActiveView('login')}
                className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Sign In
              </button>
            </p>
          </form>
        )}

        {/* 3. FORGOT PASSWORD VIEW */}
        {mode === 'forgot-password' && (
          <div className="space-y-4">
            {resetSent ? (
              <div className="text-center space-y-3 py-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Check Your Inbox</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We sent password recovery instructions to <strong className="text-slate-900 dark:text-slate-100">{email}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveView('login')}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Account Email
                  </label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                >
                  Send Recovery Link
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveView('login')}
                    className="flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 mx-auto"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Back to login</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 4. PROFILE VIEW */}
        {mode === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Display Name
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                type="email"
                disabled
                value={user?.email || 'alex.creator@pixelforge.ai'}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/50"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Preferred Export Format
              </label>
              <div className="mt-1 flex gap-2">
                {(['png', 'webp', 'jpeg'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setDefaultFormat(fmt)}
                    className={`rounded-xl border px-4 py-1.5 text-xs font-bold uppercase transition-all ${
                      defaultFormat === fmt ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setActiveView('home');
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-slate-700"
              >
                Sign Out
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
