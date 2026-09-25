'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Profile, UserStatus } from '@/lib/types';
import { toggleUserStatusAction } from '@/app/actions/admin';
import ResetPasswordModal from '@/components/ResetPasswordModal';
import { formatManila } from '@/lib/timezone';
import {
  Users,
  Search,
  KeyRound,
  UserX,
  UserCheck,
  Shield,
  Phone,
  Mail,
  Briefcase,
  Loader2,
} from 'lucide-react';

interface EmployeesClientProps {
  initialEmployees: Profile[];
}

export default function EmployeesClient({ initialEmployees }: EmployeesClientProps) {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [resetTarget, setResetTarget] = useState<Profile | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Departments list from employees
  const departments = Array.from(new Set(initialEmployees.map((e) => e.department))).sort();

  const filtered = initialEmployees.filter((emp) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = emp.full_name.toLowerCase().includes(q);
      const matchEmail = emp.email.toLowerCase().includes(q);
      const matchManager = emp.manager_name.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchManager) return false;
    }

    if (selectedDept !== 'ALL' && emp.department !== selectedDept) {
      return false;
    }

    if (selectedStatus !== 'ALL' && emp.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  const handleToggleStatus = async (employee: Profile) => {
    const nextStatus: UserStatus = employee.status === 'Active' ? 'Deactivated' : 'Active';
    const confirmMsg =
      nextStatus === 'Deactivated'
        ? `Are you sure you want to deactivate ${employee.full_name}? They will no longer be able to log in or book courts.`
        : `Reactivate account for ${employee.full_name}?`;

    if (!confirm(confirmMsg)) return;

    setActionLoadingId(employee.id);
    try {
      const res = await toggleUserStatusAction({
        userId: employee.id,
        newStatus: nextStatus,
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
        <h1 className="text-2xl font-black text-slate-900">Corporate Employee Directory</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage staff court booking eligibility, reporting structure, and administrative password resets.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by employee name, email, manager..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
        >
          <option value="ALL">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="Active">Active Only</option>
          <option value="Deactivated">Deactivated Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Reporting Manager</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No employees matching filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const isActive = emp.status === 'Active';
                  const isAdmin = emp.role === 'admin';
                  const isLoading = actionLoadingId === emp.id;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                            {emp.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{emp.full_name}</p>
                            <p className="text-[11px] text-slate-500">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {emp.department}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {emp.manager_name}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {emp.mobile_number}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isAdmin
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {emp.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400 inline" />
                        ) : (
                          <>
                            <button
                              onClick={() => setResetTarget(emp)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200 transition-colors"
                            >
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              Reset Password
                            </button>

                            <button
                              onClick={() => handleToggleStatus(emp)}
                              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-colors ${
                                isActive
                                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {isActive ? 'Deactivate' : 'Reactivate'}
                            </button>
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

      {/* Reset Password Modal */}
      {resetTarget && (
        <ResetPasswordModal
          isOpen={!!resetTarget}
          onClose={() => setResetTarget(null)}
          employee={resetTarget}
        />
      )}
    </div>
  );
}
