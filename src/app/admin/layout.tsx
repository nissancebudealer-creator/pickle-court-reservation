import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Profile } from '@/lib/types';
import Navbar from '@/components/Navbar';
import AdminNavBar from '@/components/AdminNavBar';

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


  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar
        user={profile}
        companyName={settings?.company_name || 'COMPANY'}
        courtBrand={settings?.court_brand || 'PICKLEBALL'}
        logoUrl={settings?.company_logo_url}
      />

      {/* Admin Subheader Navigation Bar — client component for active link detection */}
      <AdminNavBar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
