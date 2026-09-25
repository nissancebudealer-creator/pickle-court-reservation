'use client';

import React, { useState } from 'react';
import { Court, CourtSlot, Profile } from '@/lib/types';
import { adminDirectBookAction } from '@/app/actions/admin';
import { getAvailableBookingDates, formatFriendlyDate, getManilaTodayString } from '@/lib/timezone';
import { X, CalendarPlus, AlertCircle, Loader2 } from 'lucide-react';

interface AdminBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  courts: Court[];
  slots: CourtSlot[];
  employees: Profile[];
  onSuccess: () => void;
}

export default function AdminBookModal({
  isOpen,
  onClose,
  courts,
  slots,
  employees,
  onSuccess,
}: AdminBookModalProps) {
  const [selectedCourtId, setSelectedCourtId] = useState(courts[0]?.id || '');
  const [selectedUserId, setSelectedUserId] = useState(employees[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(getManilaTodayString());
  const [selectedSlotId, setSelectedSlotId] = useState(slots[0]?.id || '');
  const [teammates, setTeammates] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const availableDates = getAvailableBookingDates(30);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teammates.trim()) {
      setError('Please specify players or match description.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await adminDirectBookAction({
        courtId: selectedCourtId,
        userId: selectedUserId,
        date: selectedDate,
        slotId: selectedSlotId,
        teammates: teammates.trim(),
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
      setError(err.message || 'Failed to complete direct booking.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Direct Admin Booking</h3>
              <p className="text-xs text-slate-500">Instantly schedule and confirm a court reservation</p>
            </div>
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

          {/* Court */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Court
            </label>
            <select
              value={selectedCourtId}
              onChange={(e) => setSelectedCourtId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
            >
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name} ({court.location})
                </option>
              ))}
            </select>
          </div>

          {/* Target Employee */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Book On Behalf Of (Primary Employee)
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} — {emp.department} ({emp.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Date
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
              >
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {formatFriendlyDate(d)}
                  </option>
                ))}
              </select>
            </div>

            {/* Slot */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Operating Slot
              </label>
              <select
                value={selectedSlotId}
                onChange={(e) => setSelectedSlotId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
              >
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.display_label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Teammates */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Co-Players / Event Details *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Leadership Match: Juan Dela Cruz, Alex Santos, Mike Lim"
              value={teammates}
              onChange={(e) => setTeammates(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
            />
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Direct Reservation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
