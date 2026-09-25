import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Profile } from '@/lib/types';
import {
  LayoutDashboard,
  CalendarCheck2,
  Users,
  Building2,
  Settings,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import Navbar from '@/components/Navbar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/admin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard?error=unauthorized_admin');
  }

  const { data: settings } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  const adminNav = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Reservations & Approvals', href: '/admin/reservations', icon: CalendarCheck2 },
    { label: 'Employee Directory', href: '/admin/employees', icon: Users },
    { label: 'Courts', href: '/admin/courts', icon: Building2 },
    { label: 'System Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar
        user={profile}
        companyName={settings?.company_name || 'COMPANY'}
        courtBrand={settings?.court_brand || 'PICKLEBALL'}
        logoUrl={settings?.company_logo_url}
      />

      {/* Admin Subheader Navigation Bar */}
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                FACILITIES ADMIN PORTAL
              </span>
              <span className="text-xs text-slate-600 font-medium">
                PHT (UTC+8) Management
              </span>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {adminNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 whitespace-nowrap transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
