'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Court, CourtStatus } from '@/lib/types';
import { addCourtAction, updateCourtAction } from '@/app/actions/admin';
import { Building2, Plus, CheckCircle, Wrench, Loader2, AlertCircle } from 'lucide-react';

interface CourtsClientProps {
  initialCourts: Court[];
}

export default function CourtsClient({ initialCourts }: CourtsClientProps) {
  const router = useRouter();

  // New Court Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('Sports Annex');
  const [status, setStatus] = useState<CourtStatus>('ACTIVE');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Status toggle loading state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleAddCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please provide a court name.');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const res = await addCourtAction({
        name: name.trim(),
        location: location.trim(),
        status,
      });

      if (res.error) {
        setFormError(res.error);
      } else {
        setName('');
        setShowAddForm(false);
        router.refresh();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to add court.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (court: Court) => {
    const nextStatus: CourtStatus = court.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
    setTogglingId(court.id);

    try {
      const res = await updateCourtAction({
        courtId: court.id,
        name: court.name,
        location: court.location,
        status: nextStatus,
      });

      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Court Facility Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure court availability, maintenance states, and expand corporate court infrastructure.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Cancel' : 'Add New Court'}</span>
        </button>
      </div>

      {/* Add New Court Drawer / Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-6 shadow-md animate-in slide-in-from-top-3">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-base font-bold text-slate-900">Add New Pickleball Court</h3>
            <p className="text-xs text-slate-500">
              New courts immediately appear in employee schedule selectors and booking calendars.
            </p>
          </div>

          {formError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 mb-4 flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddCourt} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Court Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Company Pickleball Court 3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Facility Location
              </label>
              <input
                type="text"
                placeholder="e.g. Sports Annex - 2nd Level"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CourtStatus)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE (Open for Reservations)</option>
                <option value="MAINTENANCE">MAINTENANCE (Offline)</option>
              </select>
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
              >
                {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Court
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courts List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {initialCourts.map((court) => {
          const isActive = court.status === 'ACTIVE';
          const isToggling = togglingId === court.id;

          return (
            <div
              key={court.id}
              className={`rounded-2xl border-2 p-6 bg-white shadow-sm space-y-4 transition-all ${
                isActive ? 'border-slate-200 hover:border-emerald-300' : 'border-red-200 bg-red-50/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-xl ${
                      isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{court.name}</h3>
                    <p className="text-xs text-slate-500">{court.location}</p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {isActive ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> ACTIVE
                    </>
                  ) : (
                    <>
                      <Wrench className="w-3.5 h-3.5 text-red-600" /> MAINTENANCE
                    </>
                  )}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600 space-y-1">
                <p>
                  <strong>Operating Schedule:</strong> Evening Slots (5:30 PM – 8:30 PM)
                </p>
                <p className="text-slate-400">
                  Registered in system on {court.created_at ? new Date(court.created_at).toLocaleDateString() : 'Initial Setup'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  {isActive
                    ? 'Available for employee booking'
                    : 'All bookings on this court are disabled'}
                </span>
                <button
                  onClick={() => handleToggleStatus(court)}
                  disabled={isToggling}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    isActive
                      ? 'border-red-200 text-red-600 hover:bg-red-50'
                      : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {isToggling && <Loader2 className="w-3 h-3 animate-spin" />}
                  {isActive ? 'Set to Maintenance' : 'Set to Active'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
