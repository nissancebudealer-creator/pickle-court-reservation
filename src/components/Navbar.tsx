'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Profile } from '@/lib/types';
import { logoutAction } from '@/app/actions/auth';
import {
  CalendarDays,
  Clock,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  Layers,
  Building2,
  Settings,
  Users,
} from 'lucide-react';
import { useUIProperties } from '@/components/UIPropertiesProvider';

interface NavbarProps {
  user: Profile | null;
  companyName?: string;
  courtBrand?: string;
  logoUrl?: string | null;
}

export default function Navbar({
  user,
  companyName = 'COMPANY',
  courtBrand = 'PICKLEBALL',
  logoUrl,
}: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const { nav } = useUIProperties();

  const employeeNavItems = [
    { label: nav('court_schedule', 'Court Schedule'), href: '/dashboard', icon: CalendarDays },
    { label: nav('my_reservations', 'My Reservations'), href: '/my-reservations', icon: Clock },
  ];

  const adminNavItems = [
    { label: nav('admin_overview', 'Overview'), href: '/admin', icon: Layers },
    { label: nav('admin_reservations', 'Approvals & Bookings'), href: '/admin/reservations', icon: ShieldCheck },
    { label: nav('admin_employees', 'Employees'), href: '/admin/employees', icon: Users },
    { label: nav('admin_courts', 'Courts & Slots'), href: '/admin/courts', icon: Building2 },
    { label: nav('admin_settings', 'Settings'), href: '/admin/settings', icon: Settings },
  ];


  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${companyName} Logo`}
                  className="h-9 w-auto max-w-[140px] object-contain"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                    <circle cx="15" cy="9" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="15" r="1.5" fill="currentColor" />
                    <path d="M12 3v18" strokeDasharray="2 2" />
                    <path d="M3 12h18" />
                  </svg>
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-extrabold tracking-tight text-slate-900 text-base leading-none">
                  {companyName}{' '}
                  <span className="text-emerald-600 font-black">{courtBrand}</span>
                </span>
                <span className="text-[11px] font-medium text-slate-600 tracking-wider uppercase mt-1">
                  Employee Court Reservation
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {employeeNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                );
              })}

              {isAdmin && (
                <div className="ml-2 pl-3 border-l border-slate-200 flex items-center gap-1">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider px-2">
                    Admin:
                  </span>
                  <Link
                    href="/admin"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      pathname.startsWith('/admin')
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {nav('admin_portal', 'Admin Portal')}
                  </Link>
                </div>
              )}
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-sm font-semibold text-slate-800">
                      {user.full_name}
                    </span>
                    {isAdmin && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-300">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-600">
                    {user.department}
                  </span>
                </div>

                <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-sm shadow-inner">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>

                <form action={logoutAction}>
                  <button
                    type="submit"
                    title="Sign Out"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3">
          {user && (
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800 text-sm">{user.full_name}</p>
                <p className="text-xs text-slate-600">
                  {user.department} {isAdmin && '• Facilities Admin'}
                </p>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-md hover:bg-red-100"
                >
                  Sign Out
                </button>
              </form>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider px-2">
              Navigation
            </p>
            {employeeNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname === item.href
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>

          {isAdmin && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider px-2">
                Admin Control
              </p>
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    pathname === item.href
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
