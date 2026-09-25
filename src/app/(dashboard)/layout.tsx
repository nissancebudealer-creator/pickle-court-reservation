import React from 'react';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import { Profile, SystemSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  let settings: SystemSettings | null = null;

  if (user) {
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = p;
  }

  const { data: s } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  settings = s;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        user={profile}
        companyName={settings?.company_name || 'COMPANY'}
        courtBrand={settings?.court_brand || 'PICKLEBALL'}
        logoUrl={settings?.company_logo_url}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">
              {settings?.company_name || 'COMPANY'} {settings?.court_brand || 'PICKLEBALL'} — Employee Court Reservation
            </p>
            <p className="text-slate-400 mt-0.5">
              Operating Schedule: Mon–Sun 5:30 PM – 8:30 PM • Sports Annex
            </p>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Timezone: Asia/Manila (PHT, UTC+8)</span>
            <span>•</span>
            <span>Policy: 1 Active Booking Per Employee</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
