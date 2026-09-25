'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Reservation, Court, CourtSlot } from '@/lib/types';
import {
  approveReservationAction,
  rejectReservationAction,
  cancelReservationAction,
} from '@/app/actions/reservations';
import RescheduleModal from '@/components/RescheduleModal';
import { formatFriendlyDate, formatManila } from '@/lib/timezone';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  ArrowUpDown,
  MoreVertical,
  CalendarClock,
  Loader2,
  Users,
} from 'lucide-react';

interface ReservationsClientProps {
  initialReservations: Reservation[];
  courts: Court[];
  slots: CourtSlot[];
}

export default function ReservationsClient({
  initialReservations,
  courts,
  slots,
}: ReservationsClientProps) {
  const router = useRouter();

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCourtId, setSelectedCourtId] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('');

  // Modals
  const [rescheduleTarget, setRescheduleTarget] = useState<Reservation | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filtered reservations
  const filtered = initialReservations.filter((res) => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = res.id.toLowerCase().includes(q);
      const matchName = res.profile?.full_name.toLowerCase().includes(q);
      const matchDept = res.profile?.department.toLowerCase().includes(q);
      const matchTeammates = res.teammates.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchDept && !matchTeammates) return false;
    }

    // Court filter
    if (selectedCourtId !== 'ALL' && res.court_id !== selectedCourtId) {
      return false;
    }

    // Status filter
    if (selectedStatus !== 'ALL' && res.status !== selectedStatus) {
      return false;
    }

    // Date filter
    if (selectedDate && res.reservation_date !== selectedDate) {
      return false;
    }

    return true;
  });

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
    const reason = prompt('Please enter rejection reason:');
    if (reason === null) return;
    setActionLoadingId(reservationId);
    try {
      const res = await rejectReservationAction({
        reservationId,
        reason: reason || 'Declined by Facilities Administrator',
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

  const handleCancel = async (reservationId: string) => {
    const reason = prompt('Please enter reason for cancelling this booking:');
    if (reason === null) return;
    setActionLoadingId(reservationId);
    try {
      const res = await cancelReservationAction({
        reservationId,
        reason: reason || 'Cancelled by Facilities Administrator',
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Master Reservations Schedule</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review, approve, reschedule, or cancel court bookings across all facility courts.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by ticket, name, teammates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Court Filter */}
          <div>
            <select
              value={selectedCourtId}
              onChange={(e) => setSelectedCourtId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Courts</option>
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING APPROVAL</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold px-2 whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing <strong>{filtered.length}</strong> of {initialReservations.length} reservations
          </span>
          {(search || selectedCourtId !== 'ALL' || selectedStatus !== 'ALL' || selectedDate) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCourtId('ALL');
                setSelectedStatus('ALL');
                setSelectedDate('');
              }}
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Ticket</th>
                <th className="py-3.5 px-4">Employee / Requester</th>
                <th className="py-3.5 px-4">Court & Slot</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Co-Players</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No reservations matching current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((res) => {
                  const isPending = res.status === 'PENDING';
                  const isConfirmed = res.status === 'CONFIRMED';
                  const isLoading = actionLoadingId === res.id;

                  return (
                    <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {res.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{res.profile?.full_name || 'Staff'}</p>
                        <p className="text-[11px] text-slate-500">
                          {res.profile?.department} • {res.profile?.email}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-800">{res.court?.name}</p>
                        <p className="text-[11px] text-slate-500">{res.slot_time}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-800">
                          {formatFriendlyDate(res.reservation_date)}
                        </p>
                        <p className="text-[11px] text-slate-400">{res.reservation_date}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            res.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : res.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : res.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {res.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs text-slate-600 truncate">
                        {res.teammates}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400 inline" />
                        ) : (
                          <>
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleApprove(res.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(res.id)}
                                  className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold text-[11px] transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {isConfirmed && (
                              <>
                                <button
                                  onClick={() => setRescheduleTarget(res)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] transition-colors"
                                >
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => handleCancel(res.id)}
                                  className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 font-bold text-[11px] transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <RescheduleModal
          isOpen={!!rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          reservation={rescheduleTarget}
          courts={courts}
          slots={slots}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
