/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import AuthContainer from './components/AuthContainer';
import PrivacyNotice from './components/PrivacyNotice';
import Dashboard from './components/Dashboard';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { safeJsonFetch } from './lib/api';

interface LocalUser {
  uid: string;
  email: string;
  displayName?: string;
}

interface UserProfile {
  uid: string;
  displayName: string;
  createdAt: string;
  ageConfirmed: boolean;
  aiPersonalizationEnabled: boolean;
  analyticsEnabled: boolean;
}

export default function App() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Restore persistent authentication session from local storage on load
  useEffect(() => {
    const restoreSession = async () => {
      setAuthLoading(true);
      setError(null);
      try {
        const storedToken = localStorage.getItem('soberpath_token');
        const storedUser = localStorage.getItem('soberpath_user');
        if (storedToken && storedUser) {
          setToken(storedToken);
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          await fetchProfile(storedToken);
        } else {
          setUser(null);
          setToken(null);
          setProfile(null);
          setAuthLoading(false);
        }
      } catch (err: any) {
        console.error("Session restoration failed:", err);
        setAuthLoading(false);
      }
    };
    restoreSession();
  }, []);

  // 2. Fetch User Profile from Server API
  const fetchProfile = async (idToken: string) => {
    setProfileLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (res.status === 401) {
        // Stale or invalid session. Logout clean to redirect to login screen.
        handleLogout();
        return;
      }
      if (res.status === 404) {
        // Profile does not exist yet; must trigger onboarding PrivacyNotice
        setProfile(null);
      } else if (!res.ok) {
        let errorDetail = "Failed to fetch secure user profile";
        try {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const errData = await res.json();
            errorDetail = errData.error || errorDetail;
          } else {
            const htmlOrText = await res.text();
            if (htmlOrText) {
              if (htmlOrText.includes("The page could not be found") || res.status === 404) {
                errorDetail = "API Route not found (404). If deploying to Vercel, please make sure serverless functions are configured or verify vercel.json.";
              } else {
                const strippedText = htmlOrText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                errorDetail = `Server response (${res.status}): ${strippedText.substring(0, 100)}`;
              }
            }
          }
        } catch (e) {}
        throw new Error(errorDetail);
      } else {
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const bodyText = await res.text();
          throw new Error(`Expected JSON response but received plain text/HTML: ${bodyText.substring(0, 100)}`);
        }
        const data = await res.json();
        setProfile(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to retrieve your recovery profile settings.");
    } finally {
      setProfileLoading(false);
      setAuthLoading(false);
    }
  };

  // 3. Handle Privacy Consent Acceptance (Onboarding Profile Creation)
  const handleOnboardingAccept = async (consents: {
    ageConfirmed: boolean;
    aiPersonalizationEnabled: boolean;
    analyticsEnabled: boolean;
  }) => {
    if (!token || !user) return;
    setError(null);
    setProfileLoading(true);

    try {
      // Suggest an anonymous display name or use local email prefix to preserve PII data minimization
      const emailPrefix = user.email ? user.email.split('@')[0] : 'SoberCompanion';
      const displayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

      const data = await safeJsonFetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName,
          ageConfirmed: consents.ageConfirmed,
          aiPersonalizationEnabled: consents.aiPersonalizationEnabled,
          analyticsEnabled: consents.analyticsEnabled
        })
      });

      setProfile(data);
    } catch (err: any) {
      setError(err.message || "Failed to finalize secure account setup.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleRefreshProfile = async () => {
    if (token) {
      await fetchProfile(token);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('soberpath_token');
    localStorage.removeItem('soberpath_user');
    setUser(null);
    setToken(null);
    setProfile(null);
  };

  // 4. Loading indicator
  if (authLoading || (user && !token && profileLoading)) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mx-auto shadow-lg shadow-emerald-500/5 animate-pulse">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-xs text-slate-500 font-mono">Initializing secure cryptographic channel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Global Error Banner */}
      {error && !user && (
        <div className="bg-rose-950/45 border-b border-rose-900/40 text-rose-300 px-4 py-3 text-xs flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!user ? (
        // STATE A: Unauthenticated Public Gate
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0b0f19] to-[#05070c]">
          <AuthContainer 
            onAuthSuccess={async (sToken, sUser) => {
              setAuthLoading(true);
              setError(null);
              localStorage.setItem('soberpath_token', sToken);
              localStorage.setItem('soberpath_user', JSON.stringify(sUser));
              setUser(sUser);
              setToken(sToken);
              await fetchProfile(sToken);
            }} 
            onSandboxLogin={async (type) => {
              setAuthLoading(true);
              setError(null);
              let sToken = '';
              let sUser: any = null;
              
              if (type === 'test') {
                sToken = 'sandbox-bypass-test';
                sUser = {
                  uid: 'sandbox-uid-test',
                  email: 'test@soberpath.com',
                  displayName: 'TestHero',
                };
              } else if (type === 'recovery') {
                sToken = 'sandbox-bypass-recovery';
                sUser = {
                  uid: 'sandbox-uid-recovery',
                  email: 'recovery@soberpath.com',
                  displayName: 'SoberJourney',
                };
              } else {
                const emailTrim = type.trim();
                const emailPrefix = emailTrim.split('@')[0] || 'User';
                const displayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
                const uid = `sandbox-uid-${emailTrim.replace(/[^a-zA-Z0-9]/g, '-')}`;
                // Custom token format: sandbox-bypass:uid:email
                sToken = `sandbox-bypass:${uid}:${emailTrim}`;
                sUser = {
                  uid,
                  email: emailTrim,
                  displayName,
                };
              }
              localStorage.setItem('soberpath_token', sToken);
              localStorage.setItem('soberpath_user', JSON.stringify(sUser));
              setUser(sUser as any);
              setToken(sToken);
              await fetchProfile(sToken);
            }}
          />
        </div>
      ) : !profile ? (
        // STATE B: Authenticated but Onboarding Required (Privacy Consent notice is forced prior to collecting any data)
        <div className="min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#0b0f19] to-[#05070c]">
          <div className="max-w-2xl w-full mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Onboarding Security & Privacy Notice</h1>
              <p className="text-xs text-slate-400">To respect your data rights, please declare your consent choices below before continuing.</p>
            </div>
            {error && (
              <div className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl p-3">
                {error}
              </div>
            )}
            <PrivacyNotice onAccept={handleOnboardingAccept} />
          </div>
        </div>
      ) : (
        // STATE C: Fully Onboarded, verified, isolation-active recovery companion dashboard
        <Dashboard
          userProfile={profile}
          token={token!}
          onLogout={handleLogout}
          onRefreshProfile={handleRefreshProfile}
        />
      )}
    </div>
  );
}
