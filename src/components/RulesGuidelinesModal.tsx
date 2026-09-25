'use client';

import React from 'react';
import {
  ShieldAlert,
  CalendarCheck,
  HeartHandshake,
  Sparkles,
  ShieldCheck,
  Ban,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';

interface RulesGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  canDismissDirectly?: boolean;
}

export default function RulesGuidelinesModal({
  isOpen,
  onClose,
  canDismissDirectly = false,
}: RulesGuidelinesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white px-6 py-5 sm:px-8 sm:py-6 flex-shrink-0">
          {canDismissDirectly && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-1.5 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-600/50 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-emerald-200 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <span className="inline-block text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 mb-1">
                Company Court Policy
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-white">
                Rules & Guidelines
              </h2>
            </div>
          </div>

          <p className="mt-3 text-xs sm:text-sm text-emerald-50/95 leading-relaxed font-normal">
            The pickleball court is a shared company facility intended to promote{' '}
            <strong className="font-bold text-white underline decoration-emerald-300 underline-offset-2">
              health, teamwork, camaraderie, and work-life balance
            </strong>
            . Please observe the following before playing:
          </p>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto px-6 py-5 sm:px-8 sm:py-6 space-y-5 text-slate-700 text-xs sm:text-sm leading-relaxed divide-y divide-slate-100">
          
          {/* 1. RESERVATION */}
          <div className="space-y-2 pt-1 first:pt-0">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm uppercase tracking-wide">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              <span>1. RESERVATION</span>
            </div>
            <ul className="space-y-1.5 pl-6 list-disc text-slate-700 text-xs sm:text-[13px] marker:text-emerald-500">
              <li>
                <strong className="font-semibold text-slate-900">Reservation is required</strong> through the official app.
              </li>
              <li>
                <strong className="font-semibold text-slate-900">1 reservation = 1 hour only</strong>.
              </li>
              <li>
                Playing hours: <strong className="font-semibold text-slate-900">5:30 PM – 8:30 PM</strong>.
              </li>
              <li>
                Reservations are <strong className="font-semibold text-slate-900">first come, first served</strong>.
              </li>
              <li>Use only your reserved time and vacate the court promptly.</li>
              <li>Cancel your booking if you cannot play.</li>
              <li>Repeated no-shows or booking abuse may result in suspension of reservation privileges.</li>
            </ul>
          </div>

          {/* 2. SPORTSMANSHIP & PROFESSIONALISM */}
          <div className="space-y-2 pt-4">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm uppercase tracking-wide">
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
              <span>2. SPORTSMANSHIP & PROFESSIONALISM</span>
            </div>
            <ul className="space-y-1.5 pl-6 list-disc text-slate-700 text-xs sm:text-[13px] marker:text-emerald-500">
              <li>Play fairly and respect all players.</li>
              <li>No fighting, bullying, harassment, discrimination, or offensive language.</li>
              <li>No throwing or intentionally damaging equipment.</li>
              <li>Respect different skill levels and maintain a positive attitude.</li>
              <li>
                <strong className="font-semibold text-emerald-800">Colleagues first, competitors second.</strong>
              </li>
            </ul>
          </div>

          {/* 3. 5S & CLEANLINESS */}
          <div className="space-y-2 pt-4">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>3. 5S & CLEANLINESS</span>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 space-y-1 text-xs sm:text-[13px]">
              <p><strong className="font-bold text-slate-900">• Sort:</strong> Remove unnecessary items.</p>
              <p><strong className="font-bold text-slate-900">• Set in Order:</strong> Return equipment to its proper place.</p>
              <p><strong className="font-bold text-slate-900">• Shine:</strong> Keep the court clean.</p>
              <p><strong className="font-bold text-slate-900">• Standardize:</strong> Follow the same standards every time.</p>
              <p><strong className="font-bold text-slate-900">• Sustain:</strong> Make cleanliness everyone&apos;s responsibility.</p>
            </div>
            <p className="text-xs sm:text-[13px] font-semibold text-emerald-900 italic pt-0.5">
              Leave the court cleaner and more organized than when you arrived.
            </p>
          </div>

          {/* 4. SAFETY & EQUIPMENT */}
          <div className="space-y-2 pt-4">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm uppercase tracking-wide">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              <span>4. SAFETY & EQUIPMENT</span>
            </div>
            <ul className="space-y-1.5 pl-6 list-disc text-slate-700 text-xs sm:text-[13px] marker:text-emerald-500">
              <li>Wear proper sports attire and court shoes.</li>
              <li>Use company equipment responsibly.</li>
              <li>Do not sit, climb, or hang on the net.</li>
              <li>Report damaged equipment or unsafe conditions immediately.</li>
              <li>Keep personal belongings secure.</li>
            </ul>
          </div>

          {/* 5. STRICTLY PROHIBITED */}
          <div className="space-y-2 pt-4">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm uppercase tracking-wide">
              <Ban className="w-4 h-4 text-rose-600" />
              <span>5. STRICTLY PROHIBITED</span>
            </div>
            <p className="text-xs font-semibold text-rose-900">No:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-[13px]">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-900">
                <span className="text-rose-500 font-bold">•</span> Smoking or vaping
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-900">
                <span className="text-rose-500 font-bold">•</span> Alcohol or illegal substances
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-900">
                <span className="text-rose-500 font-bold">•</span> Gambling or betting
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-900">
                <span className="text-rose-500 font-bold">•</span> Fighting or threatening behavior
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-900">
                <span className="text-rose-500 font-bold">•</span> Intentional property damage
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-900">
                <span className="text-rose-500 font-bold">•</span> Unauthorized activities
              </div>
            </div>
          </div>

          {/* 6. ACCOUNTABILITY */}
          <div className="space-y-2 pt-4">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>6. ACCOUNTABILITY</span>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-700 pl-6">
              Violation of these rules may result in loss of court privileges and, when applicable, appropriate company disciplinary action.
            </p>
          </div>

          {/* Core Mottos */}
          <div className="pt-4 text-center space-y-1.5 bg-gradient-to-b from-slate-50 to-slate-100/70 p-4 rounded-2xl border border-slate-200">
            <p className="text-xs sm:text-sm font-black tracking-wider text-slate-900 uppercase">
              PLAY HARD. PLAY FAIR. KEEP IT CLEAN.
            </p>
            <p className="text-[11px] sm:text-xs font-bold tracking-widest text-emerald-700 uppercase">
              RESPECT • SPORTSMANSHIP • 5S • SAFETY • PROFESSIONALISM
            </p>
          </div>
        </div>

        {/* Footer with "I Understand" Button */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <p className="text-[11px] text-slate-500 text-center sm:text-left">
            By proceeding, you agree to uphold and respect all court rules during your session.
          </p>
          <button
            onClick={onClose}
            type="button"
            className="w-full sm:w-auto min-w-[180px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I Understand</span>
          </button>
        </div>

      </div>
    </div>
  );
}
