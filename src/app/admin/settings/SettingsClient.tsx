'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SystemSettings, CourtSlot, UIProperties, CustomProperty } from '@/lib/types';
import {
  updateSystemSettingsAction,
  updateUIPropertiesAction,
  addCourtSlotAction,
  updateCourtSlotAction,
  deleteCourtSlotAction,
} from '@/app/actions/admin';
import {
  Building,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Users,
  Clock,
  Tag,
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface SettingsClientProps {
  initialSettings: SystemSettings;
  initialUIProperties: UIProperties;
  initialSlots: CourtSlot[];
}

export default function SettingsClient({
  initialSettings,
  initialUIProperties,
  initialSlots,
}: SettingsClientProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    'branding' | 'departments' | 'slots' | 'labels' | 'custom'
  >('branding');

  // --- 1. Branding & Policy State ---
  const [companyName, setCompanyName] = useState(initialSettings.company_name);
  const [courtBrand, setCourtBrand] = useState(initialSettings.court_brand);
  const [logoUrl, setLogoUrl] = useState(initialSettings.company_logo_url || '');
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(initialSettings.max_advance_days);
  const [maxActiveReservations, setMaxActiveReservations] = useState(
    initialSettings.max_active_reservations_per_employee
  );

  // --- 2. UI Properties State ---
  const [uiProps, setUiProps] = useState<UIProperties>(initialUIProperties);

  // Departments State
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [editingDeptIndex, setEditingDeptIndex] = useState<number | null>(null);
  const [editingDeptValue, setEditingDeptValue] = useState('');

  // Slots State
  const [slotsList, setSlotsList] = useState<CourtSlot[]>(initialSlots);
  const [newSlotId, setNewSlotId] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('17:30');
  const [newSlotEnd, setNewSlotEnd] = useState('18:30');
  const [newSlotLabel, setNewSlotLabel] = useState('5:30 PM – 6:30 PM');
  const [showAddSlotForm, setShowAddSlotForm] = useState(false);
  const [slotActionLoading, setSlotActionLoading] = useState(false);

  // Custom Properties State
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropLabel, setNewPropLabel] = useState('');
  const [newPropValue, setNewPropValue] = useState('');
  const [newPropDesc, setNewPropDesc] = useState('');
  const [showAddPropForm, setShowAddPropForm] = useState(false);

  // Global Save & Status State
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Handlers: Department Management ---
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDepartmentName.trim();
    if (!trimmed) return;
    if (uiProps.departments.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage(`Department "${trimmed}" already exists.`);
      return;
    }
    setUiProps((prev) => ({
      ...prev,
      departments: [...prev.departments, trimmed],
    }));
    setNewDepartmentName('');
    setErrorMessage(null);
  };

  const handleStartEditDept = (index: number) => {
    setEditingDeptIndex(index);
    setEditingDeptValue(uiProps.departments[index]);
  };

  const handleSaveEditDept = (index: number) => {
    const trimmed = editingDeptValue.trim();
    if (!trimmed) return;
    setUiProps((prev) => {
      const updated = [...prev.departments];
      updated[index] = trimmed;
      return { ...prev, departments: updated };
    });
    setEditingDeptIndex(null);
  };

  const handleDeleteDept = (index: number) => {
    if (uiProps.departments.length <= 1) {
      setErrorMessage('At least one department is required.');
      return;
    }
    setUiProps((prev) => ({
      ...prev,
      departments: prev.departments.filter((_, i) => i !== index),
    }));
  };

  // --- Handlers: Slot Management ---
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotStart || !newSlotEnd || !newSlotLabel.trim()) {
      setErrorMessage('Please fill in all slot details.');
      return;
    }
    setSlotActionLoading(true);
    setErrorMessage(null);

    const generatedId = newSlotId.trim() || `slot-${Date.now().toString(36)}`;
    const startTimeFormatted = newSlotStart.length === 5 ? `${newSlotStart}:00` : newSlotStart;
    const endTimeFormatted = newSlotEnd.length === 5 ? `${newSlotEnd}:00` : newSlotEnd;

    try {
      const res = await addCourtSlotAction({
        id: generatedId,
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
        displayLabel: newSlotLabel.trim(),
      });

      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.slot) {
        setSlotsList((prev) => [...prev, res.slot!].sort((a, b) => a.start_time.localeCompare(b.start_time)));
        setNewSlotId('');
        setShowAddSlotForm(false);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add slot.');
    } finally {
      setSlotActionLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm(`Are you sure you want to delete slot "${slotId}"? This cannot be undone.`)) {
      return;
    }
    setSlotActionLoading(true);
    setErrorMessage(null);

    try {
      const res = await deleteCourtSlotAction({ slotId });
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSlotsList((prev) => prev.filter((s) => s.id !== slotId));
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete slot.');
    } finally {
      setSlotActionLoading(false);
    }
  };

  // --- Handlers: Custom Properties ---
  const handleAddCustomProperty = (e: React.FormEvent) => {
    e.preventDefault();
    const key = newPropKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const label = newPropLabel.trim();
    const value = newPropValue.trim();
    if (!key || !label || !value) {
      setErrorMessage('Key, Label, and Value are required for custom properties.');
      return;
    }
    if (uiProps.custom_properties.some((p) => p.key === key)) {
      setErrorMessage(`Property key "${key}" already exists.`);
      return;
    }

    const newProp: CustomProperty = {
      id: `prop-${Date.now().toString(36)}`,
      key,
      label,
      value,
      description: newPropDesc.trim() || undefined,
    };

    setUiProps((prev) => ({
      ...prev,
      custom_properties: [...prev.custom_properties, newProp],
    }));

    setNewPropKey('');
    setNewPropLabel('');
    setNewPropValue('');
    setNewPropDesc('');
    setShowAddPropForm(false);
    setErrorMessage(null);
  };

  const handleDeleteCustomProperty = (id: string) => {
    setUiProps((prev) => ({
      ...prev,
      custom_properties: prev.custom_properties.filter((p) => p.id !== id),
    }));
  };

  // --- Global Save Handler ---
  const handleSaveAll = async () => {
    setSaving(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      // 1. Save system settings (company name, quotas, etc.)
      const settingsRes = await updateSystemSettingsAction({
        companyName,
        courtBrand,
        companyLogoUrl: logoUrl.trim() || null,
        maxAdvanceDays,
        maxActiveReservations,
      });

      if (settingsRes.error) {
        setErrorMessage(settingsRes.error);
        setSaving(false);
        return;
      }

      // 2. Save UI properties (departments, navigation, labels, custom properties)
      const uiRes = await updateUIPropertiesAction(uiProps);

      if (uiRes.error) {
        setErrorMessage(uiRes.error);
      } else {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6 pb-12">
      {/* Header with Title and Global Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-emerald-600" />
            UI & System Customization
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rename, add, or delete any properties, labels, slots, and departments across the web platform.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-60 self-start sm:self-auto"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Applying Changes...' : 'Save All Customizations'}</span>
        </button>
      </div>

      {/* Status Banners */}
      {savedSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">
            All customizations applied successfully! Web app interface and database are synchronized.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-xs text-red-800 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-200 bg-white p-1.5 rounded-2xl border shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'branding'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Branding & Policy</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'departments'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Departments ({uiProps.departments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('slots')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'slots'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Operating Slots ({slotsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('labels')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'labels'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>UI Labels & Nav</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'custom'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Custom Properties ({uiProps.custom_properties?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: BRANDING & POLICY */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Corporate Branding & Identity</h2>
            <p className="text-xs text-slate-500">
              Customize company logos, brand titles, and platform headers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Company Name
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. NISSAN SOUTH"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Court Brand Suffix
              </label>
              <input
                type="text"
                required
                value={courtBrand}
                onChange={(e) => setCourtBrand(e.target.value)}
                placeholder="e.g. AUTOCENTRAL"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Custom Logo URL (Optional)
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://autocentralgroup.com/logo.png"
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
            />
            {logoUrl && (
              <div className="mt-2 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Logo Preview:</span>
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="h-8 max-w-[140px] object-contain"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Facility Subtitle / Location
              </label>
              <input
                type="text"
                value={uiProps.labels.facility_subtitle || ''}
                onChange={(e) =>
                  setUiProps((prev) => ({
                    ...prev,
                    labels: { ...prev.labels, facility_subtitle: e.target.value },
                  }))
                }
                placeholder="Sports Annex Facilities • Asia/Manila (PHT, UTC+8)"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Operating Schedule Footer Note
              </label>
              <input
                type="text"
                value={uiProps.labels.operating_schedule_footer || ''}
                onChange={(e) =>
                  setUiProps((prev) => ({
                    ...prev,
                    labels: { ...prev.labels, operating_schedule_footer: e.target.value },
                  }))
                }
                placeholder="Operating Schedule: 5:30 PM – 8:30 PM (PHT) • Sports Annex"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Reservation Quotas & Policy Horizons
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Booking Horizon Window (Days in Advance)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={maxAdvanceDays}
                  onChange={(e) => setMaxAdvanceDays(parseInt(e.target.value, 10) || 7)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Active Bookings per Employee
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  required
                  value={maxActiveReservations}
                  onChange={(e) => setMaxActiveReservations(parseInt(e.target.value, 10) || 1)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Corporate Departments</h2>
              <p className="text-xs text-slate-500">
                Manage the department options available to employees during registration and directory filtering.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full self-start">
              {uiProps.departments.length} Active Departments
            </span>
          </div>

          {/* Add Department Form */}
          <form onSubmit={handleAddDepartment} className="flex gap-2">
            <input
              type="text"
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
              placeholder="Enter new department name (e.g., Supply Chain, Data Analytics)..."
              className="flex-1 text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          </form>

          {/* Department List */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {uiProps.departments.map((dept, index) => {
              const isEditing = editingDeptIndex === index;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 hover:bg-slate-50/70 transition-colors"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 mr-4">
                      <input
                        type="text"
                        value={editingDeptValue}
                        onChange={(e) => setEditingDeptValue(e.target.value)}
                        className="text-xs rounded-lg border border-emerald-500 px-2.5 py-1.5 flex-1 focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditDept(index)}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs font-bold"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingDeptIndex(null)}
                        className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{dept}</span>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEditDept(index)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Rename Department"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDept(index)}
                        className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Department"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: COURT OPERATING SLOTS */}
      {activeTab === 'slots' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Operating Court Slots</h2>
              <p className="text-xs text-slate-500">
                Add, edit, or remove operating time blocks. These represent available bookable time slots.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddSlotForm(!showAddSlotForm)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddSlotForm ? 'Cancel' : 'Add Time Slot'}</span>
            </button>
          </div>

          {/* Add Slot Drawer */}
          {showAddSlotForm && (
            <form
              onSubmit={handleAddSlot}
              className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-4"
            >
              <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                Create New Operating Slot
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Start Time (24h) *
                  </label>
                  <input
                    type="time"
                    required
                    value={newSlotStart}
                    onChange={(e) => setNewSlotStart(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    End Time (24h) *
                  </label>
                  <input
                    type="time"
                    required
                    value={newSlotEnd}
                    onChange={(e) => setNewSlotEnd(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Display Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSlotLabel}
                    onChange={(e) => setNewSlotLabel(e.target.value)}
                    placeholder="e.g. 5:30 PM – 6:30 PM"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSlotForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={slotActionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  {slotActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Slot</span>
                </button>
              </div>
            </form>
          )}

          {/* Slots Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Identifier</th>
                  <th className="py-3 px-4">Start Time</th>
                  <th className="py-3 px-4">End Time</th>
                  <th className="py-3 px-4">Display Label</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slotsList.map((slot) => (
                  <tr key={slot.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{slot.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{slot.start_time}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{slot.end_time}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                        {slot.display_label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(slot.id)}
                        disabled={slotActionLoading}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: UI LABELS & NAVIGATION */}
      {activeTab === 'labels' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Custom UI Labels & Navigation</h2>
            <p className="text-xs text-slate-500">
              Rename navigation items, form field titles, and button action prompts across the platform.
            </p>
          </div>

          {/* Navigation Labels */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Navigation Menu Items
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Court Schedule Tab
                </label>
                <input
                  type="text"
                  value={uiProps.navigation.court_schedule || ''}
                  onChange={(e) =>
                    setUiProps((prev) => ({
                      ...prev,
                      navigation: { ...prev.navigation, court_schedule: e.target.value },
                    }))
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  My Reservations Tab
                </label>
                <input
                  type="text"
                  value={uiProps.navigation.my_reservations || ''}
                  onChange={(e) =>
                    setUiProps((prev) => ({
                      ...prev,
                      navigation: { ...prev.navigation, my_reservations: e.target.value },
                    }))
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Admin Portal Title
                </label>
                <input
                  type="text"
                  value={uiProps.navigation.admin_portal || ''}
                  onChange={(e) =>
                    setUiProps((prev) => ({
                      ...prev,
                      navigation: { ...prev.navigation, admin_portal: e.target.value },
                    }))
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Admin Overview Tab
                </label>
                <input
                  type="text"
                  value={uiProps.navigation.admin_overview || ''}
                  onChange={(e) =>
                    setUiProps((prev) => ({
                      ...prev,
                      navigation: { ...prev.navigation, admin_overview: e.target.value },
                    }))
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Form & Modal Labels */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Booking Modal & Form Labels
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Teammates / Co-Players Label
                </label>
                <input
                  type="text"
                  value={uiProps.labels.field_teammates || ''}
                  onChange={(e) =>
                    setUiProps((prev) => ({
                      ...prev,
                      labels: { ...prev.labels, field_teammates: e.target.value },
                    }))
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Operating Time Label
                </label>
                <input
                  type="text"
                  value={uiProps.labels.field_operating_time || ''}
                  onChange={(e) =>
                    setUiProps((prev) => ({
                      ...prev,
                      labels: { ...prev.labels, field_operating_time: e.target.value },
                    }))
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Teammates Placeholder Text
                </label>
                <input
                  type="text"
                  value={uiProps.labels.field_teammates_placeholder || ''}
                  onChange={(e) =>
                    setUiProps((prev) => ({
                      ...prev,
                      labels: { ...prev.labels, field_teammates_placeholder: e.target.value },
                    }))
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Teammates Helper Instruction
                </label>
                <textarea
                  rows={2}
                  value={uiProps.labels.field_teammates_help || ''}
                  onChange={(e) =>
                    setUiProps((prev) => ({
                      ...prev,
                      labels: { ...prev.labels, field_teammates_help: e.target.value },
                    }))
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Button Action Labels
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Reserve Button
                </label>
                <input
                  type="text"
                  value={uiProps.labels.btn_reserve_slot || ''}
                  onChange={(e) =>
                    setUiProps((prev) => ({
                      ...prev,
                      labels: { ...prev.labels, btn_reserve_slot: e.target.value },
                    }))
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Withdraw Button
                </label>
                <input
                  type="text"
                  value={uiProps.labels.btn_withdraw_request || ''}
                  onChange={(e) =>
                    setUiProps((prev) => ({
                      ...prev,
                      labels: { ...prev.labels, btn_withdraw_request: e.target.value },
                    }))
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Cancel Booking Button
                </label>
                <input
                  type="text"
                  value={uiProps.labels.btn_cancel_booking || ''}
                  onChange={(e) =>
                    setUiProps((prev) => ({
                      ...prev,
                      labels: { ...prev.labels, btn_cancel_booking: e.target.value },
                    }))
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CUSTOM PROPERTIES ENGINE */}
      {activeTab === 'custom' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Custom UI & Facility Properties</h2>
              <p className="text-xs text-slate-500">
                Define arbitrary key-value properties (e.g. dress code, equipment rules, cancellation policies) shown to employees.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddPropForm(!showAddPropForm)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddPropForm ? 'Cancel' : 'Add Property'}</span>
            </button>
          </div>

          {/* Add Property Form */}
          {showAddPropForm && (
            <form
              onSubmit={handleAddCustomProperty}
              className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3"
            >
              <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                Create New Property Definition
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Property Key (Identifier) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPropKey}
                    onChange={(e) => setNewPropKey(e.target.value)}
                    placeholder="e.g. locker_rules"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Display Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPropLabel}
                    onChange={(e) => setNewPropLabel(e.target.value)}
                    placeholder="e.g. Locker Room Guidelines"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Property Value / Text Content *
                </label>
                <textarea
                  rows={2}
                  required
                  value={newPropValue}
                  onChange={(e) => setNewPropValue(e.target.value)}
                  placeholder="e.g. Day-use lockers are available. Please bring your own padlock."
                  className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Internal Description (Optional)
                </label>
                <input
                  type="text"
                  value={newPropDesc}
                  onChange={(e) => setNewPropDesc(e.target.value)}
                  placeholder="Shown in facility notes"
                  className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddPropForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Add Property
                </button>
              </div>
            </form>
          )}

          {/* Properties List */}
          <div className="space-y-3">
            {(!uiProps.custom_properties || uiProps.custom_properties.length === 0) ? (
              <p className="text-center text-xs text-slate-400 py-8">
                No custom properties defined. Click &ldquo;Add Property&rdquo; to add custom policies or guidelines.
              </p>
            ) : (
              uiProps.custom_properties.map((prop) => (
                <div
                  key={prop.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{prop.label}</span>
                      <span className="font-mono text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600">
                        {prop.key}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{prop.value}</p>
                    {prop.description && (
                      <p className="text-[11px] text-slate-400">{prop.description}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteCustomProperty(prop.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Delete Property"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Bottom Action Bar */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl shadow-xl">
        <div className="text-xs">
          <p className="font-bold">Ready to apply changes?</p>
          <p className="text-[11px] text-slate-400">All modifications instantly sync with the web version.</p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
        </button>
      </div>
    </div>
  );
}
