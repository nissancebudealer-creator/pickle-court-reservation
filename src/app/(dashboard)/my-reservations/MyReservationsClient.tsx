'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Reservation } from '@/lib/types';
import { cancelReservationAction } from '@/app/actions/reservations';
import { formatFriendlyDate, formatManila } from '@/lib/timezone';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  MapPin,
  Users,
  Archive,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface MyReservationsClientProps {
  reservations: Reservation[];
}

export default function MyReservationsClient({ reservations }: MyReservationsClientProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const pendingReservations = reservations.filter((r) => r.status === 'PENDING');
  const confirmedReservations = reservations.filter((r) => r.status === 'CONFIRMED');
  const historyReservations = reservations.filter(
    (r) => r.status === 'CANCELLED' || r.status === 'REJECTED' || r.status === 'COMPLETED'
  );

  const handleWithdraw = async (reservationId: string) => {
    if (!confirm('Are you sure you want to withdraw this reservation request?')) return;
    setLoadingId(reservationId);
    try {
      const res = await cancelReservationAction({ reservationId });
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancelBooking = async (reservationId: string) => {
    const reason = prompt('Please provide a reason for cancelling this confirmed reservation:');
    if (reason === null) return;
    setLoadingId(reservationId);
    try {
      const res = await cancelReservationAction({ reservationId, reason });
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Court Reservations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your requests, upcoming confirmed matches, and reservation history.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
        >
          <span>Book Another Slot</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 1. Awaiting Admin Approval */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
          <h2 className="text-base font-bold text-slate-900">
            Awaiting Admin Approval ({pendingReservations.length})
          </h2>
        </div>

        {pendingReservations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 bg-white">
            No requests currently queued for administrative review.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingReservations.map((res) => (
              <div
                key={res.id}
                className="rounded-2xl border-2 border-amber-300 bg-amber-50/40 p-5 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                      {res.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-2">
                      {res.court?.name || 'Pickleball Court'}
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 text-amber-900 px-2.5 py-0.5 text-[11px] font-bold">
                    <Clock className="w-3 h-3" /> PENDING REVIEW
                  </span>
                </div>

                <div className="rounded-xl bg-white p-3.5 border border-amber-200 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>
                      {formatFriendlyDate(res.reservation_date)} • {res.slot_time}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-600">
                    <Users className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Teammates:</strong> {res.teammates}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">
                    Requested on {formatManila(res.created_at, 'MMM d, h:mm a')}
                  </span>
                  <button
                    onClick={() => handleWithdraw(res.id)}
                    disabled={loadingId === res.id}
                    className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
                  >
                    {loadingId === res.id ? 'Withdrawing...' : 'Withdraw Request'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Confirmed Reservations */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <h2 className="text-base font-bold text-slate-900">
            Confirmed Matches ({confirmedReservations.length})
          </h2>
        </div>

        {confirmedReservations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 bg-white">
            You do not currently have any confirmed upcoming reservations.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {confirmedReservations.map((res) => (
              <div
                key={res.id}
                className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/30 p-5 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                      {res.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-2">
                      {res.court?.name || 'Pickleball Court'}
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[11px] font-bold">
                    <CheckCircle2 className="w-3 h-3" /> CONFIRMED
                  </span>
                </div>

                <div className="rounded-xl bg-white p-3.5 border border-emerald-200 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>
                      {formatFriendlyDate(res.reservation_date)} • {res.slot_time}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{res.court?.location || 'Sports Annex'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-600">
                    <Users className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Teammates:</strong> {res.teammates}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-emerald-700 font-medium">Ready for your match</span>
                  <button
                    onClick={() => handleCancelBooking(res.id)}
                    disabled={loadingId === res.id}
                    className="text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-red-200 transition-colors"
                  >
                    {loadingId === res.id ? 'Processing...' : 'Cancel Booking'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. History: Past, Cancelled, and Rejected */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Archive className="w-4 h-4 text-slate-500" />
          <h2 className="text-base font-bold text-slate-900">
            Reservation History ({historyReservations.length})
          </h2>
        </div>

        {historyReservations.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-400 bg-white">
            No previous reservation history.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Court</th>
                    <th className="py-3 px-4">Date & Slot</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyReservations.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">{h.id}</td>
                      <td className="py-3 px-4 text-slate-800">{h.court?.name || 'Pickleball Court'}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {h.reservation_date} • {h.slot_time}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            h.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : h.status === 'CANCELLED'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {h.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {h.rejection_reason || (h.cancelled_by ? `By ${h.cancelled_by}` : '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
