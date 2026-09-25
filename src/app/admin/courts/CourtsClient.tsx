'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Court, CourtStatus } from '@/lib/types';
import { addCourtAction, updateCourtAction, deleteCourtAction } from '@/app/actions/admin';
import {
  Building2,
  Plus,
  CheckCircle,
  Wrench,
  Loader2,
  AlertCircle,
  Trash2,
  Edit2,
  Save,
  X,
} from 'lucide-react';

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

  // Inline Edit State
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingLocation, setEditingLocation] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Deletion State
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleStartEdit = (court: Court) => {
    setEditingCourtId(court.id);
    setEditingName(court.name);
    setEditingLocation(court.location);
  };

  const handleSaveEdit = async (courtId: string, currentStatus: CourtStatus) => {
    if (!editingName.trim()) return;
    setEditLoading(true);
    try {
      const res = await updateCourtAction({
        courtId,
        name: editingName.trim(),
        location: editingLocation.trim() || 'Sports Annex',
        status: currentStatus,
      });

      if (res.error) {
        alert(res.error);
      } else {
        setEditingCourtId(null);
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update court');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteCourt = async (court: Court) => {
    if (
      !confirm(
        `Are you sure you want to delete "${court.name}"? If there are any active bookings for this court, deletion will be blocked.`
      )
    ) {
      return;
    }

    setDeletingId(court.id);
    try {
      const res = await deleteCourtAction({ courtId: court.id });
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete court.');
    } finally {
      setDeletingId(null);
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
            Configure court names, locations, maintenance states, and facility infrastructure.
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-in fade-in">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Create New Court Facility
          </h2>

          {formError && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Court 3 (Covered)"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Location Details *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Sports Annex Level 2"
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
                <option value="ACTIVE">ACTIVE (Ready for Bookings)</option>
                <option value="MAINTENANCE">MAINTENANCE (Disabled)</option>
              </select>
            </div>

            <div className="sm:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Create Court</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {initialCourts.map((court) => {
          const isActive = court.status === 'ACTIVE';
          const isToggling = togglingId === court.id;
          const isEditing = editingCourtId === court.id;
          const isDeleting = deletingId === court.id;

          return (
            <div
              key={court.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm transition-all space-y-4 ${
                isActive ? 'border-slate-200' : 'border-red-200 bg-red-50/20'
              }`}
            >
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Court Name
                    </label>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full text-xs rounded-lg border border-emerald-500 p-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editingLocation}
                      onChange={(e) => setEditingLocation(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingCourtId(null)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(court.id, court.status)}
                      disabled={editLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                    >
                      {editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-xl ${
                        isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{court.name}</h3>
                      <p className="text-xs text-slate-500">{court.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(court)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Rename Court"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCourt(court)}
                      disabled={isDeleting}
                      className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Court"
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ml-1 ${
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
                </div>
              )}

              <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600 space-y-1">
                <p>
                  <strong>Operating Schedule:</strong> Configurable Time Slots
                </p>
                <p className="text-slate-400">
                  Registered in system on{' '}
                  {court.created_at ? new Date(court.created_at).toLocaleDateString() : 'Initial Setup'}
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
