'use client';

import React from 'react';
import { CourtSlot, Court, Reservation, CourtBlock } from '@/lib/types';
import { isSlotPast } from '@/lib/timezone';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldAlert,
  Ban,
  ArrowRight,
  Info,
  CalendarCheck,
} from 'lucide-react';

interface SlotCardProps {
  slot: CourtSlot;
  court: Court;
  date: string;
  currentUserId?: string;
  reservations: Reservation[];
  block?: CourtBlock | null;
  userHasActiveBooking: boolean;
  onReserve: (slot: CourtSlot) => void;
  onWithdraw: (reservationId: string) => void;
  onCancelBooking?: (reservationId: string) => void;
}

export default function SlotCard({
  slot,
  court,
  date,
  currentUserId,
  reservations,
  block,
  userHasActiveBooking,
  onReserve,
  onWithdraw,
  onCancelBooking,
}: SlotCardProps) {
  const isPast = isSlotPast(date, slot.end_time);

  // 1. Check if Court or Slot is Blocked / In Maintenance
  const isCourtMaintenance = court.status === 'MAINTENANCE';
  const isBlocked = !!block || isCourtMaintenance;
  const blockReason = isCourtMaintenance
    ? 'Court is currently offline for scheduled maintenance.'
    : block?.reason || 'Court slot closed for private corporate event or facility maintenance.';

  // 2. Identify confirmed reservation
  const confirmedReservation = reservations.find((r) => r.status === 'CONFIRMED');

  // 3. Identify user's own reservation for this slot
  const myReservation = reservations.find(
    (r) => r.user_id === currentUserId && (r.status === 'PENDING' || r.status === 'CONFIRMED')
  );

  // 4. Pending reservations from others
  const otherPendingReservations = reservations.filter(
    (r) => r.status === 'PENDING' && r.user_id !== currentUserId
  );

  // Render State 1: Court Closed / Maintenance / Blocked
  if (isBlocked) {
    return (
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-red-200 bg-red-50/50 p-5 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-red-700 font-bold text-base">
            <Clock className="w-5 h-5 text-red-600" />
            <span>{slot.display_label}</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
            <Ban className="w-3.5 h-3.5" /> COURT CLOSED
          </span>
        </div>

        <div className="mt-4 rounded-xl bg-white/80 p-3.5 border border-red-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-800">Facility Notice</p>
              <p className="text-xs text-slate-600 mt-0.5">{blockReason}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>{court.name}</span>
          <span>Unavailable</span>
        </div>
      </div>
    );
  }

  // Render State: Past Slot
  if (isPast) {
    return (
      <div className="relative rounded-2xl border border-slate-200 bg-slate-50/70 p-5 opacity-70">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-slate-500 font-bold text-base">
            <Clock className="w-5 h-5" />
            <span>{slot.display_label}</span>
          </div>
          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            SESSION PASSED
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          This operating slot has concluded in Manila time (PHT).
        </p>
      </div>
    );
  }

  // Render State 2: CONFIRMED (Booked)
  if (confirmedReservation) {
    const isMine = confirmedReservation.user_id === currentUserId;
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border-2 p-5 shadow-sm transition-all ${
          isMine
            ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
            : 'border-slate-200 bg-slate-50/80'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 font-bold text-base text-slate-800">
            <Clock className="w-5 h-5 text-emerald-600" />
            <span>{slot.display_label}</span>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
              isMine
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isMine ? 'YOUR BOOKING (CONFIRMED)' : 'CONFIRMED (BOOKED)'}
          </span>
        </div>

        {/* Booker Info Card */}
        <div className="mt-4 rounded-xl bg-white p-3.5 border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Booked By</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {confirmedReservation.profile?.full_name || 'Corporate Employee'}
              </p>
              <p className="text-xs text-slate-500">
                {confirmedReservation.profile?.department || 'Staff'}
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              {confirmedReservation.id}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-start gap-2">
            <Users className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Teammates:</span>{' '}
              {confirmedReservation.teammates}
            </p>
          </div>
        </div>

        {isMine && onCancelBooking && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-emerald-700 font-semibold">Locked in for your match</span>
            <button
              onClick={() => onCancelBooking(confirmedReservation.id)}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
            >
              Cancel Booking
            </button>
          </div>
        )}
      </div>
    );
  }

  // Render State 3: YOUR REQUEST (Pending)
  if (myReservation && myReservation.status === 'PENDING') {
    return (
      <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-amber-50/50 p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 font-bold text-base text-slate-800">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>{slot.display_label}</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-3 py-1 text-xs font-bold shadow-sm">
            <AlertCircle className="w-3.5 h-3.5" /> YOUR REQUEST PENDING
          </span>
        </div>

        <div className="mt-4 rounded-xl bg-white p-3.5 border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Awaiting Facilities Admin Review
            </p>
            <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
              {myReservation.id}
            </span>
          </div>
          <div className="mt-2.5 flex items-start gap-2 text-xs text-slate-600">
            <Users className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-700">Your Co-Players:</strong> {myReservation.teammates}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {otherPendingReservations.length > 0
              ? `${otherPendingReservations.length} other pending request(s)`
              : 'You are currently the sole applicant'}
          </p>
          <button
            onClick={() => onWithdraw(myReservation.id)}
            className="text-xs font-bold text-slate-700 hover:text-red-600 hover:bg-red-50 px-3.5 py-1.5 rounded-lg border border-slate-300 hover:border-red-200 transition-colors"
          >
            Withdraw Request
          </button>
        </div>
      </div>
    );
  }

  // Render State 4: PENDING APPROVAL (Other users applied, but current user hasn't)
  if (otherPendingReservations.length > 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/30 p-5 transition-all hover:border-amber-500">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 font-bold text-base text-slate-800">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>{slot.display_label}</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-bold border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5" /> PENDING APPROVAL ({otherPendingReservations.length})
          </span>
        </div>

        {/* Existing applicant notice */}
        <div className="mt-3 rounded-xl bg-white/90 p-3 border border-amber-200/80">
          <p className="text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Existing applicant(s):</span>{' '}
            {otherPendingReservations.map((r) => r.profile?.full_name || 'Employee').join(', ')}
          </p>
          <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1 font-medium">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            Additional requests can still be submitted before admin approval.
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Competition open</span>
          <button
            onClick={() => onReserve(slot)}
            disabled={userHasActiveBooking}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              userHasActiveBooking
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 hover:scale-[1.02]'
            }`}
          >
            {userHasActiveBooking ? 'Active Limit Reached' : 'Submit Contending Request'}
            {!userHasActiveBooking && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  // Render State 5: AVAILABLE
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-400 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 font-bold text-base text-slate-800">
          <Clock className="w-5 h-5 text-emerald-600" />
          <span>{slot.display_label}</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> AVAILABLE
        </span>
      </div>

      <div className="mt-3 rounded-xl bg-emerald-50/60 p-3 border border-emerald-100">
        <p className="text-xs text-emerald-900 font-medium flex items-center gap-1.5">
          <CalendarCheck className="w-4 h-4 text-emerald-600" />
          Court is open for booking. Reserve your slot now!
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">{court.name}</span>
        <button
          onClick={() => onReserve(slot)}
          disabled={userHasActiveBooking}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
            userHasActiveBooking
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:scale-[1.02]'
          }`}
        >
          {userHasActiveBooking ? 'Active Booking Limit' : 'Reserve Slot'}
          {!userHasActiveBooking && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
