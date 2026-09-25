'use client';

import React, { useState } from 'react';
import { Court, CourtSlot, Reservation } from '@/lib/types';
import { rescheduleReservationAction } from '@/app/actions/reservations';
import { getAvailableBookingDates, formatFriendlyDate } from '@/lib/timezone';
import { X, Calendar, Clock, MapPin, Loader2, AlertCircle } from 'lucide-react';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation;
  courts: Court[];
  slots: CourtSlot[];
  onSuccess: () => void;
}

export default function RescheduleModal({
  isOpen,
  onClose,
  reservation,
  courts,
  slots,
  onSuccess,
}: RescheduleModalProps) {
  const [selectedCourtId, setSelectedCourtId] = useState(reservation.court_id);
  const [selectedDate, setSelectedDate] = useState(reservation.reservation_date);
  const [selectedSlotId, setSelectedSlotId] = useState(reservation.slot_id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const availableDates = getAvailableBookingDates(14);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await rescheduleReservationAction({
        reservationId: reservation.id,
        newCourtId: selectedCourtId,
        newDate: selectedDate,
        newSlotId: selectedSlotId,
      });

      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setLoading(false);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Reschedule Reservation</h3>
            <p className="text-xs text-slate-500">Ticket: {reservation.id} • {reservation.profile?.full_name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Court Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Court
            </label>
            <select
              value={selectedCourtId}
              onChange={(e) => setSelectedCourtId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
            >
              {courts
                .filter((c) => c.status === 'ACTIVE')
                .map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name} ({court.location})
                  </option>
                ))}
            </select>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select New Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
            >
              {availableDates.map((dateStr) => (
                <option key={dateStr} value={dateStr}>
                  {formatFriendlyDate(dateStr)} ({dateStr})
                </option>
              ))}
            </select>
          </div>

          {/* Slot Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Operating Slot
            </label>
            <select
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
            >
              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.display_label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save & Send Reschedule Notice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
