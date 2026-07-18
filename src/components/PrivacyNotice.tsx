/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Eye, Database, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

interface PrivacyNoticeProps {
  onAccept: (consents: {
    ageConfirmed: boolean;
    aiPersonalizationEnabled: boolean;
    analyticsEnabled: boolean;
  }) => void;
  initialConsents?: {
    ageConfirmed: boolean;
    aiPersonalizationEnabled: boolean;
    analyticsEnabled: boolean;
  };
  isReadOnly?: boolean;
}

export default function PrivacyNotice({ onAccept, initialConsents, isReadOnly = false }: PrivacyNoticeProps) {
  const [ageConfirmed, setAgeConfirmed] = useState(initialConsents?.ageConfirmed || false);
  const [aiPersonalization, setAiPersonalization] = useState(initialConsents?.aiPersonalizationEnabled || false);
  const [analytics, setAnalytics] = useState(initialConsents?.analyticsEnabled || false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ageConfirmed) {
      setError("You must be 18 years or older and confirm your age to use this application.");
      return;
    }
    setError(null);
    onAccept({
      ageConfirmed,
      aiPersonalizationEnabled: aiPersonalization,
      analyticsEnabled: analytics
    });
  };

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 max-w-2xl mx-auto shadow-2xl">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
        <Shield className="w-8 h-8 text-emerald-400" />
        <div>
          <h2 className="text-xl font-semibold text-slate-100 tracking-tight">Privacy by Design Agreement</h2>
          <p className="text-xs text-slate-400 font-mono">SoberPath Notice v1.0 • Secure Isolation Active</p>
        </div>
      </div>

      <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 text-sm text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 flex gap-3 text-amber-200">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div className="text-xs">
            <span className="font-semibold text-amber-300 block mb-1">NOT A MEDICAL OR THERAPEUTIC SERVICE</span>
            SoberPath is an AI-powered self-reflection companion. It is NOT a medical professional, therapist, or clinical treatment. If you are experiencing a severe withdrawal emergency, psychological crisis, or relapse hazard, please utilize the crisis resources listed immediately on the dashboard.
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2.5">
            <Database className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
            <div>
              <strong className="text-slate-100 block text-sm">1. Data Minimization</strong>
              We do not ask for, collect, or store your real full name, contact lists, phone number, physical address, or precise geographic coordinates. A chosen display name is sufficient.
            </div>
          </div>

          <div className="flex gap-2.5">
            <Eye className="w-4 h-4 text-sky-400 mt-1 shrink-0" />
            <div>
              <strong className="text-slate-100 block text-sm">2. Server-Side Data Isolation</strong>
              All habit logs, journal reflections, mood logs, and AI conversations are secured behind a server-authoritative authentication boundary. Your private records are never visible to administrators, other users, or direct browser-side queries.
            </div>
          </div>

          <div className="flex gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400 mt-1 shrink-0" />
            <div>
              <strong className="text-slate-100 block text-sm">3. Generative AI Safety</strong>
              Coaching conversations are processed through a private, server-side endpoint with Google Gemini. We do not use your private journals or habits for model training or public evaluation. Data transmitted is kept to the absolute minimum necessary for contextual coaching.
            </div>
          </div>

          <div className="flex gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
            <div>
              <strong className="text-slate-100 block text-sm">4. Complete Portability & Deletion</strong>
              You can instantly download a single-file copy of your entire history or permanently and irreversibly delete your profile and all child collections at any time from your Privacy Dashboard.
            </div>
          </div>
        </div>
      </div>

      {!isReadOnly && (
        <form onSubmit={handleSubmit} className="mt-6 border-t border-slate-800 pt-5 space-y-4">
          {error && (
            <div className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {/* Age Gate Requirement - Mandatory */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/20 bg-slate-900"
              />
              <span className="text-xs text-slate-300">
                <span className="font-semibold text-slate-100">Age Confirmation (Mandatory):</span> I confirm that I am an adult of at least 18 years of age and agree to the essential processing of my chosen habit logs and tracking.
              </span>
            </label>

            {/* AI Personalization - Optional */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={aiPersonalization}
                onChange={(e) => setAiPersonalization(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-sky-500/20 bg-slate-900"
              />
              <span className="text-xs text-slate-300">
                <span className="font-semibold text-slate-100">GenAI Personalization (Optional):</span> I consent to securely sending anonymized habit summaries and recent message context to Google Gemini to receive personalized recovery coaching. I can withdraw this at any time.
              </span>
            </label>

            {/* Optional Analytics - Optional */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500/20 bg-slate-900"
              />
              <span className="text-xs text-slate-300">
                <span className="font-semibold text-slate-100">Anonymized Quality Metrics (Optional):</span> I consent to sharing non-identifiable usage patterns to help monitor application uptime and AI performance. No chat histories or journals are shared.
              </span>
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 active:translate-y-[1px] transition text-slate-950 text-xs font-semibold px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-emerald-500/10"
            >
              Confirm and Continue
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
