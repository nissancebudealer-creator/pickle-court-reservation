'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Profile, UserRole, UserStatus } from '@/lib/types';
import {
  toggleUserStatusAction,
  updateEmployeeRoleAction,
  updateEmployeeDetailsAction,
  deleteEmployeeAction,
  createEmployeeAction,
} from '@/app/actions/admin';
import ResetPasswordModal from '@/components/ResetPasswordModal';
import {
  Search,
  KeyRound,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  UserPlus,
  Edit2,
  Trash2,
  Shield,
  ShieldAlert,
  User,
  Mail,
  Phone,
  Briefcase,
  UserCheck,
  Check,
  Save,
} from 'lucide-react';

interface EmployeesClientProps {
  initialEmployees: Profile[];
  configuredDepartments?: string[];
  currentUserId?: string;
}

interface ConfirmStatusAction {
  employee: Profile;
  nextStatus: UserStatus;
  error?: string;
}

interface ConfirmDeleteAction {
  employee: Profile;
  error?: string;
}

export default function EmployeesClient({
  initialEmployees,
  configuredDepartments = [],
  currentUserId,
}: EmployeesClientProps) {
  const router = useRouter();

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Modals & Action Targets
  const [resetTarget, setResetTarget] = useState<Profile | null>(null);
  const [confirmStatusAction, setConfirmStatusAction] = useState<ConfirmStatusAction | null>(null);
  const [confirmDeleteAction, setConfirmDeleteAction] = useState<ConfirmDeleteAction | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Profile | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Loading States
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Edit Form Fields
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editManagerName, setEditManagerName] = useState('');
  const [editMobileNumber, setEditMobileNumber] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('employee');
  const [editStatus, setEditStatus] = useState<UserStatus>('Active');

  // Add Form Fields
  const [addFullName, setAddFullName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addDepartment, setAddDepartment] = useState(configuredDepartments[0] || 'Engineering');
  const [addManagerName, setAddManagerName] = useState('');
  const [addMobileNumber, setAddMobileNumber] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('employee');

  // Merge unique departments from configured list + existing employees
  const departments = Array.from(
    new Set([...configuredDepartments, ...initialEmployees.map((e) => e.department)])
  ).filter(Boolean).sort();

  // Filtered List
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

    if (selectedRole !== 'ALL' && emp.role !== selectedRole) {
      return false;
    }

    return true;
  });

  // --- Handlers: Quick Role Toggle ---
  const handleQuickRoleChange = async (employee: Profile, newRole: UserRole) => {
    if (employee.role === newRole) return;
    if (employee.id === currentUserId && newRole !== 'admin') {
      alert('You cannot remove your own administrative privileges.');
      return;
    }

    if (
      !confirm(
        `Are you sure you want to change ${employee.full_name}'s role to ${newRole.toUpperCase()}?`
      )
    ) {
      return;
    }

    setActionLoadingId(employee.id);
    try {
      const res = await updateEmployeeRoleAction({
        userId: employee.id,
        newRole,
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

  // --- Handlers: Status Toggle ---
  const handleToggleStatus = (employee: Profile) => {
    if (employee.id === currentUserId) {
      alert('You cannot deactivate your own account.');
      return;
    }
    const nextStatus: UserStatus = employee.status === 'Active' ? 'Deactivated' : 'Active';
    setConfirmStatusAction({ employee, nextStatus });
  };

  const executeToggleStatus = async () => {
    if (!confirmStatusAction) return;
    const { employee, nextStatus } = confirmStatusAction;

    setActionLoadingId(employee.id);
    try {
      const res = await toggleUserStatusAction({
        userId: employee.id,
        newStatus: nextStatus,
      });

      if (res.error) {
        setConfirmStatusAction((prev) => (prev ? { ...prev, error: res.error } : null));
      } else {
        setConfirmStatusAction(null);
        router.refresh();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- Handlers: Edit Employee ---
  const handleOpenEdit = (employee: Profile) => {
    setEditingEmployee(employee);
    setEditFullName(employee.full_name);
    setEditEmail(employee.email);
    setEditDepartment(employee.department);
    setEditManagerName(employee.manager_name);
    setEditMobileNumber(employee.mobile_number);
    setEditRole(employee.role);
    setEditStatus(employee.status);
    setModalError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setModalLoading(true);
    setModalError(null);

    try {
      const res = await updateEmployeeDetailsAction({
        userId: editingEmployee.id,
        fullName: editFullName,
        email: editEmail,
        department: editDepartment,
        managerName: editManagerName,
        mobileNumber: editMobileNumber,
        role: editRole,
        status: editStatus,
      });

      if (res.error) {
        setModalError(res.error);
      } else {
        setEditingEmployee(null);
        router.refresh();
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to update employee.');
    } finally {
      setModalLoading(false);
    }
  };

  // --- Handlers: Delete Employee ---
  const handleOpenDelete = (employee: Profile) => {
    if (employee.id === currentUserId) {
      alert('You cannot delete your own account while logged in.');
      return;
    }
    setConfirmDeleteAction({ employee });
  };

  const executeDeleteEmployee = async () => {
    if (!confirmDeleteAction) return;
    const { employee } = confirmDeleteAction;

    setActionLoadingId(employee.id);
    try {
      const res = await deleteEmployeeAction({ userId: employee.id });
      if (res.error) {
        setConfirmDeleteAction((prev) => (prev ? { ...prev, error: res.error } : null));
      } else {
        setConfirmDeleteAction(null);
        router.refresh();
      }
    } catch (err: any) {
      setConfirmDeleteAction((prev) =>
        prev ? { ...prev, error: err.message || 'Failed to delete employee.' } : null
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- Handlers: Add New Employee ---
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      const res = await createEmployeeAction({
        fullName: addFullName,
        email: addEmail,
        password: addPassword,
        department: addDepartment,
        managerName: addManagerName,
        mobileNumber: addMobileNumber,
        role: addRole,
      });

      if (res.error) {
        setModalError(res.error);
      } else {
        setShowAddModal(false);
        setAddFullName('');
        setAddEmail('');
        setAddPassword('');
        setAddManagerName('');
        setAddMobileNumber('');
        router.refresh();
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to create employee.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Corporate Employee Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage staff profiles, assign roles (Admin/Employee), edit user details, and update platform permissions.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setModalError(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
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
          <option value="ALL">All Departments ({departments.length})</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
        >
          <option value="ALL">All Roles</option>
          <option value="admin">Administrators</option>
          <option value="employee">Standard Employees</option>
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

      {/* Employee Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Reporting Manager</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Role / Privilege</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No employees matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const isActive = emp.status === 'Active';
                  const isAdmin = emp.role === 'admin';
                  const isCurrent = emp.id === currentUserId;
                  const isLoading = actionLoadingId === emp.id;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs border ${
                              isAdmin
                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {emp.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900">{emp.full_name}</p>
                              {isCurrent && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.2 rounded border">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">{emp.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {emp.department}
                      </td>

                      {/* Manager */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {emp.manager_name}
                      </td>

                      {/* Mobile */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {emp.mobile_number}
                      </td>

                      {/* Role Selector */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={emp.role}
                          disabled={isLoading || isCurrent}
                          onChange={(e) => handleQuickRoleChange(emp, e.target.value as UserRole)}
                          className={`text-[11px] font-bold rounded-lg border px-2 py-1 focus:outline-none transition-colors ${
                            isAdmin
                              ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          } disabled:opacity-80`}
                        >
                          <option value="employee">Employee</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>

                      {/* Status */}
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

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400 inline" />
                        ) : (
                          <>
                            {/* Edit Details */}
                            <button
                              onClick={() => handleOpenEdit(emp)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                              title="Edit Employee Profile"
                            >
                              <Edit2 className="w-3 h-3 text-slate-500" />
                              <span>Edit</span>
                            </button>

                            {/* Reset Password */}
                            <button
                              onClick={() => setResetTarget(emp)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200 transition-colors"
                              title="Reset Password"
                            >
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              <span>Pass</span>
                            </button>

                            {/* Toggle Status */}
                            {!isCurrent && (
                              <button
                                onClick={() => handleToggleStatus(emp)}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-colors ${
                                  isActive
                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                }`}
                              >
                                {isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            )}

                            {/* Delete Employee */}
                            {!isCurrent && (
                              <button
                                onClick={() => handleOpenDelete(emp)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center justify-center"
                                title="Delete Employee"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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

      {/* MODAL 1: ADD NEW EMPLOYEE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Add New Employee Profile</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="m-6 mb-0 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addFullName}
                    onChange={(e) => setAddFullName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Temporary Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                  <select
                    value={addDepartment}
                    onChange={(e) => setAddDepartment(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reporting Manager *</label>
                  <input
                    type="text"
                    required
                    value={addManagerName}
                    onChange={(e) => setAddManagerName(e.target.value)}
                    placeholder="e.g. Carlos Mendoza"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Contact *</label>
                  <input
                    type="tel"
                    required
                    value={addMobileNumber}
                    onChange={(e) => setAddMobileNumber(e.target.value)}
                    placeholder="09171234567"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">System Privilege</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as UserRole)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="employee">Standard Employee (Court Booking Access)</option>
                  <option value="admin">Administrator (Full Portal & Policy Control)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT EMPLOYEE DETAILS */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Edit Details: {editingEmployee.full_name}
                </h3>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="m-6 mb-0 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reporting Manager *</label>
                  <input
                    type="text"
                    required
                    value={editManagerName}
                    onChange={(e) => setEditManagerName(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Contact *</label>
                  <input
                    type="tel"
                    required
                    value={editMobileNumber}
                    onChange={(e) => setEditMobileNumber(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={editRole}
                    disabled={editingEmployee.id === currentUserId}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none disabled:bg-slate-100"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    disabled={editingEmployee.id === currentUserId}
                    onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none disabled:bg-slate-100"
                  >
                    <option value="Active">Active</option>
                    <option value="Deactivated">Deactivated</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {confirmDeleteAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border-b border-red-100">
              <div className="p-2 rounded-xl bg-red-100 text-red-700">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-950">Delete Employee Profile</h3>
                <p className="text-[11px] text-red-700">Permanent Account Removal</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900">{confirmDeleteAction.employee.full_name}</strong> (
                {confirmDeleteAction.employee.email})?
              </p>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  Policy Check
                </p>
                <p>
                  Employees with active (Pending or Confirmed) court reservations cannot be deleted until their bookings are resolved.
                </p>
              </div>

              {confirmDeleteAction.error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{confirmDeleteAction.error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteAction(null)}
                  disabled={actionLoadingId === confirmDeleteAction.employee.id}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeDeleteEmployee}
                  disabled={actionLoadingId === confirmDeleteAction.employee.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  {actionLoadingId === confirmDeleteAction.employee.id && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Delete Permanently</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: STATUS TOGGLE CONFIRMATION */}
      {confirmStatusAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div
              className={`flex items-center gap-3 px-6 py-4 ${
                confirmStatusAction.nextStatus === 'Deactivated'
                  ? 'bg-red-50 border-b border-red-100'
                  : 'bg-emerald-50 border-b border-emerald-100'
              }`}
            >
              <div
                className={`p-2 rounded-xl ${
                  confirmStatusAction.nextStatus === 'Deactivated'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3
                  className={`text-sm font-bold ${
                    confirmStatusAction.nextStatus === 'Deactivated'
                      ? 'text-red-950'
                      : 'text-emerald-950'
                  }`}
                >
                  {confirmStatusAction.nextStatus === 'Deactivated'
                    ? 'Deactivate Account'
                    : 'Reactivate Account'}
                </h3>
                <p className="text-[11px] text-slate-500">{confirmStatusAction.employee.full_name}</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">
                {confirmStatusAction.nextStatus === 'Deactivated' ? (
                  <>
                    Are you sure you want to deactivate{' '}
                    <strong>{confirmStatusAction.employee.full_name}</strong>? They will immediately
                    lose access to the corporate court reservation portal.
                  </>
                ) : (
                  <>
                    Reactivate <strong>{confirmStatusAction.employee.full_name}</strong>? They will
                    regain full access to reserve pickleball slots.
                  </>
                )}
              </p>

              {confirmStatusAction.error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{confirmStatusAction.error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmStatusAction(null)}
                  disabled={actionLoadingId === confirmStatusAction.employee.id}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeToggleStatus}
                  disabled={actionLoadingId === confirmStatusAction.employee.id}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition-all ${
                    confirmStatusAction.nextStatus === 'Deactivated'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {actionLoadingId === confirmStatusAction.employee.id && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>
                    {confirmStatusAction.nextStatus === 'Deactivated'
                      ? 'Confirm Deactivation'
                      : 'Confirm Reactivation'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: RESET PASSWORD */}
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
