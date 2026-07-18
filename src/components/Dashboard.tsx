/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Habit, Entry, Journal, ChatMessage } from '../types';
import HabitsSection from './HabitsSection';
import UrgeTracker from './UrgeTracker';
import JournalSection from './JournalSection';
import AiCoach from './AiCoach';
import PrivacyDashboard from './PrivacyDashboard';
import { safeJsonFetch } from '../lib/api';
import { 
  Home, 
  Activity, 
  BookOpen, 
  Sparkles, 
  Shield, 
  LogOut, 
  PhoneCall, 
  Award, 
  HeartHandshake
} from 'lucide-react';

interface DashboardProps {
  userProfile: {
    uid: string;
    displayName: string;
    createdAt: string;
    ageConfirmed: boolean;
    aiPersonalizationEnabled: boolean;
    analyticsEnabled: boolean;
  };
  token: string;
  onLogout: () => void;
  onRefreshProfile: () => void;
}

export default function Dashboard({ userProfile, token, onLogout, onRefreshProfile }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'habits' | 'tracker' | 'journal' | 'coach' | 'privacy'>('home');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setGlobalError(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [habitsData, entriesData, journalsData, chatData] = await Promise.all([
        safeJsonFetch('/api/habits', { headers }),
        safeJsonFetch('/api/entries', { headers }),
        safeJsonFetch('/api/journal', { headers }),
        safeJsonFetch('/api/chat', { headers })
      ]);

      setHabits(habitsData);
      setEntries(entriesData);
      setJournals(journalsData);
      setChatHistory(chatData);
    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "Failed to load dashboard sync database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleLogoutClick = async () => {
    onLogout();
  };

  // Quick action logging clean day
  const handleLogCleanDay = async (habitId: string) => {
    setGlobalError(null);
    try {
      await safeJsonFetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          habitId,
          type: 'clean_day'
        })
      });
      // Re-fetch all data to synchronize streaks and entries cleanly
      await fetchDashboardData();
    } catch (e: any) {
      setGlobalError(e.message || "Failed to log clean day");
    }
  };

  // Helper metrics
  const totalStreaks = habits.reduce((acc, h) => acc + (h.streak || 0), 0);
  const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0)) : 0;
  const recentUrges = entries.filter(e => e.type === 'urge').slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      {/* 1. SECURE TOP NAVIGATION HEADER */}
      <header className="bg-[#0f172a] border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/25 shadow-md shadow-emerald-500/5">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-100 tracking-tight leading-none">SoberPath</h1>
              <span className="text-[9px] text-slate-400 font-mono tracking-wide">CONFIDENTIAL RECOVERY MANAGER</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <span className="text-[10px] text-slate-400 block font-medium">Empowered User</span>
              <span className="text-xs font-bold text-slate-200">{userProfile.displayName}</span>
            </div>

            <button
              onClick={handleLogoutClick}
              className="text-slate-400 hover:text-rose-400 transition p-2 hover:bg-slate-800/40 rounded-xl flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* 2. SIDEBAR TABS PANEL */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition ${
              activeTab === 'home' 
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Home className="w-4.5 h-4.5" />
            <span>Overview Center</span>
          </button>

          <button
            onClick={() => setActiveTab('habits')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition ${
              activeTab === 'habits' 
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Award className="w-4.5 h-4.5" />
            <span>Habits & Plans ({habits.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tracker')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition ${
              activeTab === 'tracker' 
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Activity className="w-4.5 h-4.5" />
            <span>Urge & relapse tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('journal')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition ${
              activeTab === 'journal' 
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <BookOpen className="w-4.5 h-4.5" />
            <span>Secure Journals ({journals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('coach')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition ${
              activeTab === 'coach' 
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Sparkles className="w-4.5 h-4.5" />
            <span>AI Recovery Coach</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition ${
              activeTab === 'privacy' 
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Shield className="w-4.5 h-4.5" />
            <span>Privacy & Controls</span>
          </button>
        </aside>

        {/* 3. MAIN WORKPLACE INTERFACE */}
        <main className="flex-1 bg-[#0f172a]/50 border border-slate-850 rounded-2xl p-6 shadow-xl relative min-h-[500px]">
          {globalError && (
            <div className="mb-6 text-xs text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 flex gap-2">
              <Shield className="w-4.5 h-4.5 shrink-0" />
              <span>{globalError}</span>
            </div>
          )}

          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0f19]/30">
              <span className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
              <p className="text-xs text-slate-500 font-mono mt-3">Synchronizing secure recovery database...</p>
            </div>
          ) : (
            <>
              {activeTab === 'home' && (
                <div className="space-y-6">
                  {/* Greeting Box */}
                  <div>
                    <h2 className="text-xl font-bold text-slate-100 tracking-tight">Welcome Back, {userProfile.displayName}</h2>
                    <p className="text-xs text-slate-400 mt-1">Consistency and small mindful choices make a lasting impact.</p>
                  </div>

                  {/* Summary Metric Bento Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/10">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Accumulated Streaks</span>
                        <span className="text-lg font-extrabold text-slate-200">{totalStreaks} {totalStreaks === 1 ? 'day' : 'days'}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 border border-amber-500/10">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Maximum Streak Reach</span>
                        <span className="text-lg font-extrabold text-slate-200">{maxStreak} {maxStreak === 1 ? 'day' : 'days'}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400 border border-sky-500/10">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Events Monitored</span>
                        <span className="text-lg font-extrabold text-slate-200">{entries.length} logs</span>
                      </div>
                    </div>
                  </div>

                  {/* Dual Column Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                    {/* Left Column: Rapid Log & Support */}
                    <div className="space-y-4">
                      <div className="bg-slate-900/25 border border-slate-850 rounded-xl p-5 space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rapid Support Hotlines</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          If you are experiencing severe withdrawal triggers, high emotional stress, or need localized recovery networks, please contact:
                        </p>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                            <span className="font-semibold text-slate-300">National Crisis Helpline</span>
                            <a href="tel:988" className="text-rose-400 hover:underline font-bold">988</a>
                          </div>
                          <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                            <span className="font-semibold text-slate-300">SAMHSA Helpline</span>
                            <a href="tel:18006624357" className="text-sky-400 hover:underline font-bold">1-800-662-4357</a>
                          </div>
                        </div>
                      </div>

                      {/* AI personal statement */}
                      <div className="bg-indigo-950/15 border border-indigo-900/30 rounded-xl p-5 space-y-3.5">
                        <div className="flex items-center gap-2">
                          <HeartHandshake className="w-4.5 h-4.5 text-indigo-400" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">Mindful Recovery Coaching</h3>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Engage in secure, client-confidential CBT exercises with your AI Coach. Personalize your support by defining habits and goals, listing triggers, and maintaining secure logs of your urges.
                        </p>
                        <button
                          onClick={() => setActiveTab('coach')}
                          className="bg-indigo-600 hover:bg-indigo-700 transition text-slate-100 text-[11px] font-bold px-4 py-2 rounded-lg cursor-pointer"
                        >
                          Begin Session with AI Coach
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Recent Habits Status List */}
                    <div className="bg-slate-900/25 border border-slate-850 rounded-xl p-5 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex justify-between items-center">
                        <span>Active Habits Summary</span>
                        <button onClick={() => setActiveTab('habits')} className="text-[10px] text-emerald-400 hover:underline font-normal normal-case">
                          Manage Plans
                        </button>
                      </h3>

                      {habits.length === 0 ? (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          No active habits being logged. To customize your tracking dashboard and begin recovering, please create your first recovery plan.
                        </p>
                      ) : (
                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                          {habits.map(habit => (
                            <div key={habit.id} className="bg-slate-950 p-3 rounded-xl flex justify-between items-center border border-slate-900">
                              <div>
                                <span className="font-bold text-xs text-slate-200 block">{habit.name}</span>
                                <span className="text-[10px] text-slate-500 font-medium">{habit.category} • Streak: {habit.streak} days</span>
                              </div>
                              <button
                                onClick={() => handleLogCleanDay(habit.id)}
                                className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 px-3 py-1.5 rounded-lg transition font-bold"
                              >
                                + Clean Day
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'habits' && (
                <HabitsSection
                  habits={habits}
                  onHabitAdded={fetchDashboardData}
                  onHabitDeleted={fetchDashboardData}
                  onLogCleanDay={handleLogCleanDay}
                  token={token}
                />
              )}

              {activeTab === 'tracker' && (
                <UrgeTracker
                  habits={habits}
                  entries={entries}
                  onEntryLogged={fetchDashboardData}
                  onEntryDeleted={fetchDashboardData}
                  token={token}
                />
              )}

              {activeTab === 'journal' && (
                <JournalSection
                  journals={journals}
                  onJournalAdded={fetchDashboardData}
                  onJournalDeleted={fetchDashboardData}
                  token={token}
                />
              )}

              {activeTab === 'coach' && (
                <AiCoach
                  chatHistory={chatHistory}
                  onMessageSent={fetchDashboardData}
                  onHistoryCleared={fetchDashboardData}
                  token={token}
                />
              )}

              {activeTab === 'privacy' && (
                <PrivacyDashboard
                  userProfile={userProfile}
                  onConsentsUpdated={onRefreshProfile}
                  onAccountDeleted={onLogout}
                  token={token}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
