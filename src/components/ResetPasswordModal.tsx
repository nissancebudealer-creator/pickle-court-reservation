'use client';

import React, { useState } from 'react';
import { Profile } from '@/lib/types';
import { adminResetPasswordAction } from '@/app/actions/admin';
import { X, KeyRound, Copy, Check, RefreshCw, Loader2, AlertCircle } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Profile;
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  employee,
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  if (!isOpen) return null;

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let res = 'Pickle-';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
    setCopied(false);
    setStatusMessage(null);
  };

  const copyToClipboard = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await adminResetPasswordAction({
        userId: employee.id,
        newPassword: password,
      });

      if (res.error) {
        setStatusMessage({ type: 'error', text: res.error });
      } else {
        setStatusMessage({
          type: 'success',
          text: `Password successfully updated! Please share the temporary credentials with ${employee.full_name}.`,
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to reset password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Reset Employee Password</h3>
              <p className="text-xs text-slate-500">{employee.full_name} ({employee.department})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleReset} className="p-6 space-y-4">
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs text-slate-600">
            <p>
              Account Email: <strong className="text-slate-800">{employee.email}</strong>
            </p>
            <p className="mt-1">
              This action overrides the user&apos;s password directly via Supabase Auth Admin.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Temporary Password
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Generate
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter or generate temporary password"
                className="flex-1 text-xs font-mono rounded-xl border border-slate-300 p-2.5 bg-white focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={copyToClipboard}
                disabled={!password}
                className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 disabled:opacity-40"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {statusMessage && (
            <div
              className={`rounded-xl p-3 text-xs flex items-start gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 shadow-md"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
