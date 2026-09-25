'use client';

import React, { useState } from 'react';
import { Court, CourtSlot } from '@/lib/types';
import { blockSlotAction } from '@/app/actions/admin';
import { getAvailableBookingDates, formatFriendlyDate, getManilaTodayString } from '@/lib/timezone';
import { X, Ban, AlertCircle, Loader2 } from 'lucide-react';

interface BlockCourtModalProps {
  isOpen: boolean;
  onClose: () => void;
  courts: Court[];
  slots: CourtSlot[];
  onSuccess: () => void;
}

export default function BlockCourtModal({
  isOpen,
  onClose,
  courts,
  slots,
  onSuccess,
}: BlockCourtModalProps) {
  const [selectedCourtId, setSelectedCourtId] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(getManilaTodayString());
  const [selectedSlotId, setSelectedSlotId] = useState<string>('ALL');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const availableDates = getAvailableBookingDates(30);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for the block.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await blockSlotAction({
        courtId: selectedCourtId === 'ALL' ? null : selectedCourtId,
        date: selectedDate,
        slotId: selectedSlotId === 'ALL' ? null : selectedSlotId,
        reason: reason.trim(),
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
      setError(err.message || 'Failed to block court.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-100 text-red-600">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Block Slot / Day</h3>
              <p className="text-xs text-slate-500">Prevent bookings for maintenance or private events</p>
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

          {/* Court selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Court Scope
            </label>
            <select
              value={selectedCourtId}
              onChange={(e) => setSelectedCourtId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-red-500 focus:outline-none"
            >
              <option value="ALL">All Courts (Facility-Wide)</option>
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-red-500 focus:outline-none"
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {formatFriendlyDate(d)} ({d})
                </option>
              ))}
            </select>
          </div>

          {/* Slot selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Time Slot
            </label>
            <select
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-red-500 focus:outline-none"
            >
              <option value="ALL">Entire Evening (All Operating Slots)</option>
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.display_label}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reason / Public Notice *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Surface recoating, Annual Corporate League"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-red-500 focus:outline-none"
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Apply Facility Block
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
