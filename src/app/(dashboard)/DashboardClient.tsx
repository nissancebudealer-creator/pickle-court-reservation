'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Court, CourtSlot, Profile, Reservation, CourtBlock, SystemSettings } from '@/lib/types';
import DateSelector from '@/components/DateSelector';
import SlotCard from '@/components/SlotCard';
import ConfirmBookingModal from '@/components/ConfirmBookingModal';
import RulesGuidelinesModal from '@/components/RulesGuidelinesModal';
import { cancelReservationAction } from '@/app/actions/reservations';
import { formatFriendlyDate, getManilaTodayString } from '@/lib/timezone';
import {
  Building2,
  Calendar,
  Clock,
  Sparkles,
  ShieldAlert,
  Info,
  CheckCircle,
  HelpCircle,
  Zap,
  BookOpen,
} from 'lucide-react';
import { useUIProperties } from '@/components/UIPropertiesProvider';

interface DashboardClientProps {
  user: Profile;
  courts: Court[];
  slots: CourtSlot[];
  reservations: Reservation[];
  blocks: CourtBlock[];
  settings: SystemSettings;
  userActiveReservations: Reservation[];
}

export default function DashboardClient({
  user,
  courts,
  slots,
  reservations,
  blocks,
  settings,
  userActiveReservations,
}: DashboardClientProps) {
  const router = useRouter();
  const { label, properties } = useUIProperties();

  // State
  const [selectedCourtId, setSelectedCourtId] = useState<string>(courts[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(getManilaTodayString());
  const [activeSlotModal, setActiveSlotModal] = useState<CourtSlot | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(
    null
  );
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  useEffect(() => {
    try {
      const acknowledged = sessionStorage.getItem('court_rules_acknowledged');
      if (!acknowledged) {
        setShowRulesModal(true);
      }
    } catch {
      setShowRulesModal(true);
    }
  }, []);

  const handleAcknowledgeRules = () => {
    try {
      sessionStorage.setItem('court_rules_acknowledged', 'true');
    } catch {}
    setShowRulesModal(false);
  };

  const selectedCourt = courts.find((c) => c.id === selectedCourtId) || courts[0];
  const userHasActiveBooking = userActiveReservations.length >= settings.max_active_reservations_per_employee;
  const activeBooking = userActiveReservations[0] || null;

  // Filter reservations for current court and selected date
  const filteredReservations = reservations.filter(
    (r) => r.court_id === selectedCourt?.id && r.reservation_date === selectedDate
  );

  // Filter blocks for current court and selected date
  const currentCourtBlocks = blocks.filter(
    (b) =>
      b.block_date === selectedDate &&
      (!b.court_id || b.court_id === selectedCourt?.id)
  );

  const showToast = (type: 'success' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleWithdraw = async (reservationId: string) => {
    if (!confirm('Are you sure you want to withdraw this reservation request?')) return;
    setWithdrawing(reservationId);
    try {
      const res = await cancelReservationAction({ reservationId });
      if (res.error) {
        alert(res.error);
      } else {
        showToast('info', `Reservation request ${reservationId} has been withdrawn.`);
        router.refresh();
      }
    } finally {
      setWithdrawing(null);
    }
  };

  const handleCancelBooking = async (reservationId: string) => {
    const reason = prompt('Please enter a cancellation reason (optional):');
    if (reason === null) return; // user cancelled prompt
    try {
      const res = await cancelReservationAction({ reservationId, reason });
      if (res.error) {
        alert(res.error);
      } else {
        showToast('info', `Booking ${reservationId} has been cancelled.`);
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-800 text-white border-emerald-700'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Hero / Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-800 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-900/60 px-3.5 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-sm border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>{label('facility_subtitle', 'Sports Annex • Asia/Manila (PHT)')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Reserve Your Pickleball Court
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
            Welcome, <strong>{user.full_name}</strong>. Enjoy corporate evening matches.
            Submit your reservation request with co-players for Facilities Admin review.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setShowRulesModal(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur border border-white/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
              <span>Court Rules & Guidelines</span>
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-8 -bottom-12 w-64 h-64 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
      </div>

      {/* Active Booking Banner Alert (if applicable) */}
      {userHasActiveBooking && activeBooking && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 sm:p-5 text-amber-900 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-200/70 text-amber-900 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold">You Have an Active Reservation</h4>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    {activeBooking.status}
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  Ticket <strong>{activeBooking.id}</strong> on{' '}
                  <strong>{formatFriendlyDate(activeBooking.reservation_date)}</strong> (
                  {activeBooking.slot_time}) • Co-players: {activeBooking.teammates}
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Corporate policy restricts employees to 1 active reservation at a time. To book another slot, withdraw or complete this session.
                </p>
              </div>
            </div>

            {activeBooking.status === 'PENDING' && (
              <button
                onClick={() => handleWithdraw(activeBooking.id)}
                disabled={withdrawing === activeBooking.id}
                className="self-start sm:self-center px-4 py-2 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 rounded-xl transition-colors whitespace-nowrap"
              >
                {withdrawing === activeBooking.id ? 'Withdrawing...' : 'Withdraw Request'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Multi-Court Selector Tab Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Court
            </span>
          </div>
          <span className="text-xs text-slate-500">
            {courts.length} court{courts.length > 1 ? 's' : ''} available
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {courts.map((court) => {
            const isSelected = court.id === selectedCourt?.id;
            const isMaintenance = court.status === 'MAINTENANCE';

            return (
              <button
                key={court.id}
                onClick={() => setSelectedCourtId(court.id)}
                className={`flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-semibold transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-white text-emerald-900 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    isMaintenance
                      ? 'bg-red-500'
                      : isSelected
                      ? 'bg-emerald-500 ring-4 ring-emerald-100'
                      : 'bg-slate-300'
                  }`}
                />
                <div className="text-left">
                  <p className="font-bold text-xs sm:text-sm text-slate-900">{court.name}</p>
                  <p className="text-[11px] text-slate-400 font-normal">
                    {court.location} {isMaintenance && '• (Under Maintenance)'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Selector */}
      <DateSelector
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        maxAdvanceDays={settings.max_advance_days}
      />

      {/* Real-Time Slot Schedule Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Operating Slots for {formatFriendlyDate(selectedDate)}</span>
              <span className="text-xs font-normal text-slate-500">
                ({selectedCourt?.name})
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Live slot statuses update automatically upon Facilities Admin action.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Open
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pending Review
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Booked
            </span>
          </div>
        </div>

        {/* Slot Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {slots.map((slot) => {
            // Find reservations for this slot
            const slotReservations = filteredReservations.filter((r) => r.slot_id === slot.id);

            // Find court block for this slot (or entire evening)
            const slotBlock = currentCourtBlocks.find(
              (b) => !b.slot_id || b.slot_id === slot.id
            );

            return (
              <SlotCard
                key={slot.id}
                slot={slot}
                court={selectedCourt}
                date={selectedDate}
                currentUserId={user.id}
                reservations={slotReservations}
                block={slotBlock || null}
                userHasActiveBooking={userHasActiveBooking}
                onReserve={(s) => setActiveSlotModal(s)}
                onWithdraw={handleWithdraw}
                onCancelBooking={handleCancelBooking}
              />
            );
          })}
        </div>
      </div>



      {/* Modal: Confirm Booking */}
      {activeSlotModal && (
        <ConfirmBookingModal
          isOpen={!!activeSlotModal}
          onClose={() => setActiveSlotModal(null)}
          court={selectedCourt}
          slot={activeSlotModal}
          date={selectedDate}
          user={user}
          hasActiveBooking={userHasActiveBooking}
          activeBooking={activeBooking}
          onSuccess={(resId) => {
            showToast('success', `Reservation request ${resId} submitted for admin review!`);
            router.refresh();
          }}
        />
      )}

      {/* Pop-up Modal: Rules & Guidelines Reminder */}
      <RulesGuidelinesModal
        isOpen={showRulesModal}
        onClose={handleAcknowledgeRules}
        canDismissDirectly={true}
      />
    </div>
  );
}
