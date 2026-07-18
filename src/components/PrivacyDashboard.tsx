/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Download, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Lock, 
  CheckCircle2, 
  ClipboardCheck,
  Power
} from 'lucide-react';
import { auth } from '../lib/firebase';
import PrivacyNotice from './PrivacyNotice';
import { safeJsonFetch } from '../lib/api';

interface PrivacyDashboardProps {
  userProfile: {
    uid: string;
    displayName: string;
    createdAt: string;
    ageConfirmed: boolean;
    aiPersonalizationEnabled: boolean;
    analyticsEnabled: boolean;
  };
  onConsentsUpdated: () => void;
  onAccountDeleted: () => void;
  token: string;
}

export default function PrivacyDashboard({ userProfile, onConsentsUpdated, onAccountDeleted, token }: PrivacyDashboardProps) {
  const [aiPersonalization, setAiPersonalization] = useState(userProfile.aiPersonalizationEnabled);
  const [analytics, setAnalytics] = useState(userProfile.analyticsEnabled);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showNoticeDoc, setShowNoticeDoc] = useState(false);

  const handleUpdateConsents = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const data = await safeJsonFetch('/api/user/consent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          aiPersonalizationEnabled: aiPersonalization,
          analyticsEnabled: analytics
        })
      });

      setSuccess("Your personal privacy options and audit trails have been updated successfully.");
      onConsentsUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update consents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExport = async () => {
    setError(null);
    setSuccess(null);
    setExporting(true);

    try {
      const res = await fetch('/api/user/export', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to package and download your data.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soberpath-confidential-data-export-${userProfile.uid}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSuccess("Your confidential archive has been exported. Keep this file secure!");
    } catch (err: any) {
      setError(err.message || 'Failed to export data.');
    } finally {
      setExporting(false);
    }
  };

  const handlePermanentDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (confirmDeleteText !== 'DELETE') {
      setError("Please type 'DELETE' exactly in the confirmation field to authorize account destruction.");
      return;
    }

    setLoading(true);

    try {
      const data = await safeJsonFetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Delete the Firebase Auth User from client side
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.delete().catch(async (authErr) => {
          console.warn("Auth user delete failed directly (requires recent login). Signing out instead:", authErr);
          await auth.signOut();
        });
      }

      onAccountDeleted();
    } catch (err: any) {
      console.error("Deletion Error:", err);
      setError("Account deletion requires a highly secure session. Please log out, sign back in immediately, and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Privacy & Security Controls</h2>
        <p className="text-xs text-slate-400 mt-1">Review active notice consents, download your personal data, or delete your account permanently.</p>
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 flex gap-2">
          <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3 flex gap-2">
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Consent Options Column */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Configurable Consents</span>
          </h3>
          <p className="text-xs text-slate-400">Your preferences dictate how we handle your information on the server.</p>

          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center gap-4 border-b border-slate-800/50 pb-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-100">GenAI Personalization</span>
                <p className="text-[10px] text-slate-400">Personalize AI coaching with active habit goals. If disabled, coaching will be unavailable.</p>
              </div>
              <button
                onClick={() => setAiPersonalization(!aiPersonalization)}
                className="text-slate-400 hover:text-slate-250 transition shrink-0"
              >
                {aiPersonalization ? (
                  <ToggleRight className="w-10 h-10 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-600" />
                )}
              </button>
            </div>

            <div className="flex justify-between items-center gap-4 border-b border-slate-800/50 pb-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-100">Optional Analytics</span>
                <p className="text-[10px] text-slate-400">Share non-identifiable browser events to monitor server availability. No logs are shared.</p>
              </div>
              <button
                onClick={() => setAnalytics(!analytics)}
                className="text-slate-400 hover:text-slate-250 transition shrink-0"
              >
                {analytics ? (
                  <ToggleRight className="w-10 h-10 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-600" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={handleUpdateConsents}
            disabled={loading}
            className="w-full bg-slate-800 border border-slate-750 hover:bg-slate-750 transition text-slate-200 text-xs font-semibold py-2.5 rounded-xl cursor-pointer"
          >
            {loading ? "Updating Audit Trail..." : "Save Privacy Settings"}
          </button>
        </div>

        {/* Data Portability Column */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Download className="w-4 h-4 text-sky-400" />
              <span>Transparent Data Export</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We respect data portability. Download a comprehensive JSON document containing your profile configurations, accepted consents, active habits, urge trackers, personal journal entries, and AI coaching chat logs in a structured layout.
            </p>
          </div>

          <button
            onClick={handleDownloadExport}
            disabled={exporting}
            className="w-full bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500 hover:text-slate-950 text-sky-400 text-xs font-semibold py-2.5 rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
          >
            {exporting ? (
              <span className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export My Information (JSON)</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Notice Document */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-purple-400" />
              <span>Privacy Agreement Archives</span>
            </h3>
            <p className="text-xs text-slate-400">
              You accepted the privacy policy notice on <strong className="text-slate-300 font-mono text-[11px]">{new Date(userProfile.createdAt).toLocaleDateString()}</strong>. You can review the exact terms and legal guidelines of the notice document below.
            </p>
          </div>

          <button
            onClick={() => setShowNoticeDoc(!showNoticeDoc)}
            className="w-full bg-purple-600/10 border border-purple-600/20 hover:bg-purple-600/25 text-purple-400 text-xs font-semibold py-2.5 rounded-xl cursor-pointer transition"
          >
            {showNoticeDoc ? "Hide Notice Policy" : "Review Notice Policy Document"}
          </button>
        </div>

        {/* Destructive Deletion Column */}
        <div className="bg-rose-950/5 border border-rose-900/25 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-rose-300 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Permanent Account Destruction</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            This action is permanent and completely irreversible. Doing so will immediately wipe your profile, delete your active habits, erase your tracking database records, clear your coaching logs, and discard your journals securely to protect your confidentiality.
          </p>

          <form onSubmit={handlePermanentDeletion} className="space-y-3 pt-1">
            <label className="block text-[10px] uppercase font-bold text-rose-400 font-mono">
              Type "DELETE" below to authorize
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                placeholder="DELETE"
                className="flex-1 bg-slate-950 border border-rose-900/30 rounded-xl px-3 py-2 text-xs text-rose-200 placeholder-slate-700 font-bold focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                disabled={loading || confirmDeleteText !== 'DELETE'}
                className="bg-rose-600 hover:bg-rose-700 active:translate-y-[0.5px] disabled:opacity-40 transition text-slate-100 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </form>
        </div>
      </div>

      {showNoticeDoc && (
        <div className="mt-4">
          <PrivacyNotice onAccept={() => {}} initialConsents={userProfile} isReadOnly={true} />
        </div>
      )}
    </div>
  );
}
