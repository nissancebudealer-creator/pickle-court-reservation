'use client';

import React, { useState } from 'react';
import { Court, CourtSlot, CourtBlock } from '@/lib/types';
import { blockSlotAction, unblockSlotAction } from '@/app/actions/admin';
import { getAvailableBookingDates, formatFriendlyDate, getManilaTodayString } from '@/lib/timezone';
import { X, Ban, AlertCircle, Loader2, Trash2, Calendar, Clock, Plus, CheckCircle2 } from 'lucide-react';

interface BlockCourtModalProps {
  isOpen: boolean;
  onClose: () => void;
  courts: Court[];
  slots: CourtSlot[];
  blocks?: CourtBlock[];
  onSuccess: () => void;
}

export default function BlockCourtModal({
  isOpen,
  onClose,
  courts,
  slots,
  blocks = [],
  onSuccess,
}: BlockCourtModalProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [selectedCourtId, setSelectedCourtId] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(getManilaTodayString());
  const [selectedSlotId, setSelectedSlotId] = useState<string>('ALL');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

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
    setFeedback(null);

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
        setReason('');
        setFeedback('Schedule has been blocked successfully.');
        onSuccess();
        setTimeout(() => {
          setFeedback(null);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to block court.');
      setLoading(false);
    }
  };

  const handleUnblock = async (blockId: string) => {
    if (!confirm('Are you sure you want to remove this block and reopen the schedule for reservations?')) {
      return;
    }

    setUnblockingId(blockId);
    setError(null);
    setFeedback(null);

    try {
      const res = await unblockSlotAction({ blockId });
      if (res.error) {
        setError(res.error);
      } else {
        setFeedback('Block removed. Schedule is now open for employee reservations.');
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove block.');
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-100 text-red-600">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Court Schedule Blocks</h3>
              <p className="text-xs text-slate-500">Prevent or remove blocks for maintenance and events</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-slate-50/30 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Block New Schedule</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'list'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Active Blocks ({blocks.length})</span>
          </button>
        </div>

        {/* Feedback / Alert */}
        {feedback && (
          <div className="mx-6 mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{feedback}</span>
          </div>
        )}
        {error && (
          <div className="mx-6 mt-4 rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Create Block Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
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
                placeholder="e.g. Workshop Busy Schedule, Court Closed, Tournament"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md transition-all hover:scale-[1.02]"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Apply Facility Block
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Active Blocks List */}
        {activeTab === 'list' && (
          <div className="p-6 space-y-3 overflow-y-auto flex-1">
            {blocks.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-800">No Active Blocks</p>
                <p className="text-xs text-slate-400">All court schedules are currently open for booking.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className="p-3.5 rounded-xl border border-red-200/90 bg-red-50/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-red-900">
                          {formatFriendlyDate(block.block_date)} ({block.block_date})
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-red-200/80 text-red-800 font-bold text-[10px] uppercase">
                          {block.slot?.display_label || 'Entire Evening'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold text-[10px]">
                          {block.court?.name || 'All Courts'}
                        </span>
                      </div>
                      <p className="text-slate-600 italic truncate">
                        &ldquo;{block.reason}&rdquo;
                      </p>
                    </div>

                    <button
                      onClick={() => handleUnblock(block.id)}
                      disabled={unblockingId === block.id}
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-300 hover:bg-red-600 hover:text-white text-red-700 font-bold text-xs shadow-sm transition-all flex-shrink-0 cursor-pointer"
                    >
                      {unblockingId === block.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>Unblock</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
