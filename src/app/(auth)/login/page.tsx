'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAction, getPublicSettingsAction } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase/client';
import { SystemSettings } from '@/lib/types';
import { AlertCircle, Loader2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { useUIProperties } from '@/components/UIPropertiesProvider';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const unauthorizedAdmin = searchParams.get('error') === 'unauthorized_admin';
  const { label } = useUIProperties();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    unauthorizedAdmin ? 'Admin portal access requires administrative credentials.' : null
  );

  const [settings, setSettings] = useState<SystemSettings>({
    id: 1,
    company_name: 'NISSAN SOUTH',
    court_brand: '',
    company_logo_url: 'https://autocentralgroup.com/wp/wp-content/uploads/2021/02/autocentral.png',
    max_advance_days: 7,
    max_active_reservations_per_employee: 2,
    updated_at: new Date().toISOString(),
  });

  useEffect(() => {
    getPublicSettingsAction().then((res) => {
      if (res?.data) {
        setSettings(res.data);
      }
    });
  }, []);

  const companyName = settings.company_name?.trim() || 'NISSAN SOUTH';
  const courtBrand = settings.court_brand?.trim() || '';
  const logoUrl = settings.company_logo_url?.trim() || 'https://autocentralgroup.com/wp/wp-content/uploads/2021/02/autocentral.png';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check if account is deactivated
        const { data: profile } = await supabase
          .from('profiles')
          .select('status, role')
          .eq('id', data.user.id)
          .single();

        if (profile?.status === 'Deactivated') {
          await supabase.auth.signOut();
          setError('Your employee account has been deactivated. Please contact Facilities & HR.');
          setLoading(false);
          return;
        }

        // Also sync server action in background for server-side cookies
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('redirectTo', redirectTo);
        await loginAction(formData).catch(() => {});

        // Direct navigation
        const target = profile?.role === 'admin' && redirectTo === '/dashboard' ? '/admin' : redirectTo;
        router.push(target);
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-b from-slate-50 via-emerald-50/20 to-slate-100 font-sans">
      <div className="w-full max-w-md">
        {/* Prominent Company Branding & Logo Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          {logoUrl ? (
            <div className="mb-4 p-3.5 bg-white rounded-2xl shadow-md border border-slate-200/90 inline-flex items-center justify-center transition-all">
              <img
                src={logoUrl}
                alt={`${companyName} Logo`}
                className="h-20 max-h-24 w-auto max-w-[280px] object-contain"
                onError={() => {
                  setSettings(prev => ({ ...prev, company_logo_url: null }));
                }}
              />
            </div>
          ) : (
            <div className="relative mb-5 group">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 text-white flex items-center justify-center shadow-xl shadow-emerald-600/30 border-2 border-emerald-400/40 ring-4 ring-emerald-100 transition-transform group-hover:scale-105">
                <svg
                  className="w-11 h-11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="11" r="8" />
                  <path d="M12 19v3" strokeWidth="2.6" />
                  <path d="M10 22h4" strokeWidth="2.6" />
                  <circle cx="9" cy="9" r="1.2" fill="currentColor" />
                  <circle cx="15" cy="9" r="1.2" fill="currentColor" />
                  <circle cx="12" cy="14" r="1.2" fill="currentColor" />
                  <path d="M4 11h16" strokeDasharray="2 2" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {companyName} {courtBrand ? <span className="text-emerald-600">{courtBrand}</span> : null}
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold tracking-wider uppercase border border-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>{label('registration_header', 'EMPLOYEE COURT RESERVATION PORTAL')}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium pt-0.5">
              {label('facility_subtitle', 'Sports Annex Facilities • Asia/Manila (PHT, UTC+8)')}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">{label('booking_header', 'Sign in to your corporate account')}</h2>
            <p className="text-xs text-slate-500 mt-1">
              {label('booking_sub', 'Enter your corporate credentials to book court sessions and view schedules.')}
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {label('field_corporate_email', 'Corporate Email Address')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3.5 py-3 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {label('field_password', 'Password')}
                </label>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3.5 py-3 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.01]"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Authenticating...' : label('btn_sign_in', 'Sign In to Court Schedule')}</span>
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-slate-500">
            First time using the court portal?{' '}
            <Link href="/register" className="font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-2">
              Register here
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          {label('operating_schedule_footer', 'Operating Schedule: 5:30 PM – 8:30 PM (PHT) • Sports Annex')}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
