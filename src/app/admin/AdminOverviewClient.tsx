'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Court, CourtSlot, Profile, Reservation, CourtBlock } from '@/lib/types';
import { approveReservationAction, rejectReservationAction } from '@/app/actions/reservations';
import { unblockSlotAction } from '@/app/actions/admin';
import AdminBookModal from '@/components/AdminBookModal';
import BlockCourtModal from '@/components/BlockCourtModal';
import { formatFriendlyDate, formatManila } from '@/lib/timezone';
import {
  AlertCircle,
  CalendarCheck2,
  CalendarDays,
  Percent,
  Building2,
  CalendarPlus,
  Ban,
  Plus,
  CheckCircle,
  XCircle,
  ArrowRight,
  Clock,
  Users,
  Loader2,
  Trash2,
} from 'lucide-react';

interface AdminOverviewClientProps {
  metrics: {
    needsApproval: number;
    todayConfirmed: number;
    upcomingConfirmed: number;
    utilizationPercent: number;
    activeCourtsCount: number;
  };
  pendingReservations: Reservation[];
  todayReservations: Reservation[];
  courts: Court[];
  slots: CourtSlot[];
  employees: Profile[];
  blocks?: CourtBlock[];
}

export default function AdminOverviewClient({
  metrics,
  pendingReservations,
  todayReservations,
  courts,
  slots,
  employees,
  blocks = [],
}: AdminOverviewClientProps) {
  const router = useRouter();

  // Modals state
  const [showBookModal, setShowBookModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const handleUnblock = async (blockId: string) => {
    if (!confirm('Are you sure you want to remove this block and reopen the schedule for employee bookings?')) {
      return;
    }

    setUnblockingId(blockId);
    try {
      const res = await unblockSlotAction({ blockId });
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to remove block.');
    } finally {
      setUnblockingId(null);
    }
  };

  const handleApprove = async (reservationId: string) => {
    setActionLoadingId(reservationId);
    try {
      const res = await approveReservationAction({ reservationId });
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (reservationId: string) => {
    const reason = prompt('Please provide a reason for declining this request:');
    if (reason === null) return;
    setActionLoadingId(reservationId);
    try {
      const res = await rejectReservationAction({
        reservationId,
        reason: reason || 'Declined by Facilities Admin',
      });
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Facilities Control Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time court management, approvals, scheduling, and employee usage statistics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowBookModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Book Schedule</span>
          </button>

          <button
            onClick={() => setShowBlockModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all hover:scale-[1.02]"
          >
            <Ban className="w-4 h-4" />
            <span>Block Slot / Day</span>
          </button>

          <Link
            href="/admin/courts"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Court</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Needs Approval */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Needs Approval
            </span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">{metrics.needsApproval}</p>
          <span className="text-[11px] text-amber-700 font-medium">Pending employee requests</span>
        </div>

        {/* Today's Confirmed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Today&apos;s Confirmed
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">{metrics.todayConfirmed}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Matches booked today</span>
        </div>

        {/* Upcoming */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Upcoming
            </span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">{metrics.upcomingConfirmed}</p>
          <span className="text-[11px] text-blue-700 font-medium">Future confirmed sessions</span>
        </div>

        {/* Utilization % */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Utilization %
            </span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">{metrics.utilizationPercent}%</p>
          <span className="text-[11px] text-purple-700 font-medium">Upcoming 7-day capacity</span>
        </div>

        {/* Active Courts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Courts
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">{metrics.activeCourtsCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Operational court facilities</span>
        </div>
      </div>

      {/* Grid: Pending Approvals & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Requests Requiring Approval */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900">
                Action Required: Pending Requests ({pendingReservations.length})
              </h2>
            </div>
            <Link
              href="/admin/reservations?status=PENDING"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              View All
            </Link>
          </div>

          {pendingReservations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              All caught up! No pending reservation requests awaiting review.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReservations.slice(0, 5).map((res) => (
                <div
                  key={res.id}
                  className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded text-[11px]">
                        {res.id}
                      </span>
                      <p className="font-bold text-slate-900 text-sm mt-1">
                        {res.profile?.full_name}{' '}
                        <span className="text-slate-500 font-normal">({res.profile?.department})</span>
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {formatFriendlyDate(res.reservation_date)}
                    </span>
                  </div>

                  <div className="text-slate-600 space-y-0.5">
                    <p>
                      <strong>Court:</strong> {res.court?.name} • {res.slot_time}
                    </p>
                    <p>
                      <strong>Teammates:</strong> {res.teammates}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/60">
                    <button
                      onClick={() => handleReject(res.id)}
                      disabled={actionLoadingId === res.id}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(res.id)}
                      disabled={actionLoadingId === res.id}
                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-colors"
                    >
                      {actionLoadingId === res.id && <Loader2 className="w-3 h-3 animate-spin" />}
                      Approve Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Court Schedule */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Today&apos;s Confirmed Matches</h2>
            </div>
            <Link
              href="/admin/reservations"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              Master Schedule
            </Link>
          </div>

          {todayReservations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No confirmed bookings scheduled for today yet.
            </div>
          ) : (
            <div className="space-y-3">
              {todayReservations.map((res) => (
                <div
                  key={res.id}
                  className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{res.court?.name}</span>
                    <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                      {res.slot_time}
                    </span>
                  </div>
                  <p className="text-slate-700">
                    <strong>Lead Player:</strong> {res.profile?.full_name} ({res.profile?.department})
                  </p>
                  <p className="text-slate-500">
                    <strong>Players:</strong> {res.teammates}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Blocked Schedules & Maintenance Section */}
      {blocks && blocks.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-100 text-red-600">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Active Blocked Schedules ({blocks.length})
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider">
                    Closed
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  These court slots or dates are currently closed to employee reservations. Click &ldquo;Remove Block&rdquo; to reopen them.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowBlockModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Block New Slot</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="rounded-xl border border-red-200 bg-red-50/40 p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-red-950 text-sm">
                      {formatFriendlyDate(block.block_date)} ({block.block_date})
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-200/80 text-red-900 uppercase tracking-wider flex-shrink-0">
                      {block.slot?.display_label || 'Entire Evening'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700">
                    <strong className="text-slate-900">Court Scope:</strong>{' '}
                    <span className="font-semibold text-red-800">{block.court?.name || 'All Courts'}</span>
                  </p>

                  <p className="text-xs text-slate-600 bg-white/80 p-2.5 rounded-lg border border-red-100 italic">
                    &ldquo;{block.reason}&rdquo;
                  </p>
                </div>

                <div className="pt-2 border-t border-red-100 flex items-center justify-end">
                  <button
                    onClick={() => handleUnblock(block.id)}
                    disabled={unblockingId === block.id}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-300 hover:bg-red-600 hover:text-white text-red-700 font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    {unblockingId === block.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Remove Block</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showBookModal && (
        <AdminBookModal
          isOpen={showBookModal}
          onClose={() => setShowBookModal(false)}
          courts={courts}
          slots={slots}
          employees={employees}
          onSuccess={() => router.refresh()}
        />
      )}

      {showBlockModal && (
        <BlockCourtModal
          isOpen={showBlockModal}
          onClose={() => setShowBlockModal(false)}
          courts={courts}
          slots={slots}
          blocks={blocks}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
