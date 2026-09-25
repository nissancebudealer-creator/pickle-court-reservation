'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck2,
  Users,
  Building2,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useUIProperties } from '@/components/UIPropertiesProvider';


export default function AdminNavBar() {
  const pathname = usePathname();
  const { nav } = useUIProperties();

  const adminNav = [
    { label: nav('admin_overview', 'Overview'), href: '/admin', icon: LayoutDashboard },
    { label: nav('admin_reservations', 'Reservations & Approvals'), href: '/admin/reservations', icon: CalendarCheck2 },
    { label: nav('admin_employees', 'Employee Directory'), href: '/admin/employees', icon: Users },
    { label: nav('admin_courts', 'Courts & Slots'), href: '/admin/courts', icon: Building2 },
    { label: nav('admin_settings', 'UI & System Settings'), href: '/admin/settings', icon: Settings },
  ];

  // Exact match for overview (/admin), startsWith for sub-routes
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <div className="border-b border-slate-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {nav('admin_portal', 'FACILITIES ADMIN PORTAL').toUpperCase()}
            </span>
            <span className="text-xs text-slate-600 font-medium">PHT (UTC+8) Management</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
