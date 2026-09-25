'use client';

import React, { useState } from 'react';
import { Court, CourtSlot, Profile, Reservation } from '@/lib/types';
import { createReservationRequest } from '@/app/actions/reservations';
import { formatFriendlyDate } from '@/lib/timezone';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

interface ConfirmBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  court: Court;
  slot: CourtSlot;
  date: string;
  user: Profile;
  hasActiveBooking: boolean;
  activeBooking?: Reservation | null;
  onSuccess: (reservationId: string) => void;
}

export default function ConfirmBookingModal({
  isOpen,
  onClose,
  court,
  slot,
  date,
  user,
  hasActiveBooking,
  activeBooking,
  onSuccess,
}: ConfirmBookingModalProps) {
  const [teammates, setTeammates] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasActiveBooking) return;

    if (!teammates.trim()) {
      setErrorMessage('Please list at least one teammate or co-player.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await createReservationRequest({
        courtId: court.id,
        date,
        slotId: slot.id,
        teammates: teammates.trim(),
      });

      if (res.error) {
        setErrorMessage(res.error);
        setLoading(false);
      } else if (res.success && res.reservationId) {
        setLoading(false);
        onSuccess(res.reservationId);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while submitting.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Confirm Court Reservation</h3>
            <p className="text-xs text-slate-500">Pickleball Court Reservation Request</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Policy Enforcement Alert if active booking exists */}
          {hasActiveBooking && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Active Reservation Policy</h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Company policy allows <strong>1 active booking</strong> per employee at a time.
                    {activeBooking && (
                      <span className="block mt-1">
                        Active ticket: <strong>{activeBooking.id}</strong> on{' '}
                        <strong>{activeBooking.reservation_date}</strong> (
                        {activeBooking.status}).
                      </span>
                    )}
                    Please withdraw or complete your existing booking before requesting a new slot.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reservation Summary Box */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Court & Location</p>
                <p className="text-sm font-bold text-slate-800">
                  {court.name} <span className="text-xs font-normal text-slate-500">({court.location})</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-[11px] text-slate-500">Date</p>
                  <p className="text-xs font-bold text-slate-800">{formatFriendlyDate(date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-[11px] text-slate-500">Operating Time</p>
                  <p className="text-xs font-bold text-slate-800">{slot.display_label}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Details (Read-only verification) */}
          <div className="rounded-xl border border-slate-200 p-3.5 bg-white text-xs space-y-1.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Primary Requester
            </p>
            <div className="flex justify-between">
              <span className="text-slate-600">Employee:</span>
              <span className="font-bold text-slate-800">{user.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Department:</span>
              <span className="font-semibold text-slate-700">{user.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Contact:</span>
              <span className="text-slate-700">{user.mobile_number} • {user.email}</span>
            </div>
          </div>

          {/* Mandatory Teammates Field */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Co-Players / Teammates *</span>
              <span className="text-[11px] text-emerald-600 font-normal">Singles or Doubles</span>
            </label>
            <textarea
              required
              rows={3}
              value={teammates}
              onChange={(e) => setTeammates(e.target.value)}
              disabled={hasActiveBooking || loading}
              placeholder="e.g., Mark Ramos (Engineering), Sarah Lim (Marketing), Kevin Tan (HR)"
              className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100 disabled:text-slate-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Please include names and departments so security and front desk can verify attendees.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={hasActiveBooking || loading}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                hasActiveBooking || loading
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25 hover:scale-[1.02]'
              }`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Submitting...' : 'Submit Reservation Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
