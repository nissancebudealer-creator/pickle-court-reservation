'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SystemSettings } from '@/lib/types';
import { updateSystemSettingsAction } from '@/app/actions/admin';
import { Settings, Building, Image, Calendar, ShieldCheck, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface SettingsClientProps {
  initialSettings: SystemSettings;
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const router = useRouter();

  const [companyName, setCompanyName] = useState(initialSettings.company_name);
  const [courtBrand, setCourtBrand] = useState(initialSettings.court_brand);
  const [logoUrl, setLogoUrl] = useState(initialSettings.company_logo_url || '');
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(initialSettings.max_advance_days);
  const [maxActiveReservations, setMaxActiveReservations] = useState(
    initialSettings.max_active_reservations_per_employee
  );

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const res = await updateSystemSettingsAction({
        companyName,
        courtBrand,
        companyLogoUrl: logoUrl.trim() || null,
        maxAdvanceDays,
        maxActiveReservations,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-black text-slate-900">Corporate Branding & Policy Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure branding, booking window horizons, and reservation quotas across the platform.
        </p>
      </div>

      {savedSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">
            System configuration and corporate policies successfully updated!
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-xs text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* Branding Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Building className="w-4 h-4 text-emerald-600" />
            Corporate Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Company Name Prefix
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. ACME CORP"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Court Brand Suffix
              </label>
              <input
                type="text"
                required
                value={courtBrand}
                onChange={(e) => setCourtBrand(e.target.value)}
                placeholder="e.g. PICKLEBALL"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Custom Logo Image URL (Optional)
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://company.com/assets/logo.png"
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              If left blank, the portal displays the default high-resolution SVG corporate badge.
            </p>
          </div>
        </div>

        {/* Booking Window & Quotas */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Reservation Window & Employee Policies
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Booking Window (Max Days in Advance)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                required
                value={maxAdvanceDays}
                onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Default: 7 days. Employees cannot view or book dates beyond this horizon.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Max Active Bookings Per Employee
              </label>
              <input
                type="number"
                min={1}
                max={5}
                required
                value={maxActiveReservations}
                onChange={(e) => setMaxActiveReservations(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Default: 1 active booking. Prevents hoarding and ensures fair court access.
              </p>
            </div>
          </div>
        </div>

        {/* Live Preview Pill */}
        <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Header Branding Preview
          </p>
          <div className="flex items-center gap-2 font-black text-slate-900 text-lg">
            <span>{companyName}</span>
            <span className="text-emerald-600">{courtBrand}</span>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
