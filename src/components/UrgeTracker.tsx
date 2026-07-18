/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Habit, Entry } from '../types';
import { ShieldAlert, AlertCircle, Plus, Calendar, Flame, FlameKindling, RefreshCw } from 'lucide-react';

interface UrgeTrackerProps {
  habits: Habit[];
  entries: Entry[];
  onEntryLogged: () => void;
  onEntryDeleted: (id: string) => void;
  token: string;
}

export default function UrgeTracker({ habits, entries, onEntryLogged, onEntryDeleted, token }: UrgeTrackerProps) {
  const [habitId, setHabitId] = useState('');
  const [type, setType] = useState<'urge' | 'relapse'>('urge');
  const [intensity, setIntensity] = useState(5);
  const [trigger, setTrigger] = useState('');
  const [mood, setMood] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);

  // Auto-select first habit if available
  React.useEffect(() => {
    if (habits.length > 0 && !habitId) {
      setHabitId(habits[0].id);
    }
  }, [habits, habitId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!habitId) {
      setError("Please select or add an active habit first.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          habitId,
          type,
          intensity: type === 'urge' ? intensity : undefined,
          trigger: trigger.trim(),
          mood: mood.trim(),
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit log entry.');
      }

      setSuccess(type === 'relapse' 
        ? "Relapse logged securely. Streak reset to 0. Every relapse is a learning opportunity—be kind to yourself and consult your AI Coach for motivational CBT strategies."
        : "Urge event logged securely. Mindful tracking builds long-term self-awareness."
      );
      setTrigger('');
      setMood('');
      setNotes('');
      setShowLogForm(false);
      onEntryLogged();
    } catch (err: any) {
      setError(err.message || "Failed to log entry.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Urge & Incident Tracker</h2>
          <p className="text-xs text-slate-400 mt-1">Track urge triggers and log relapses securely to discover habits trends.</p>
        </div>
        {habits.length > 0 && (
          <button
            onClick={() => setShowLogForm(!showLogForm)}
            className="bg-sky-500 hover:bg-sky-600 transition text-slate-950 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{showLogForm ? 'Close Log' : 'Log Urge or Incident'}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 flex gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {showLogForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 max-w-xl">
          <h3 className="text-sm font-semibold text-slate-200">Log Habit Activity</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Habit *
              </label>
              <select
                value={habitId}
                onChange={(e) => setHabitId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500/40"
              >
                {habits.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Event Type *
              </label>
              <div className="flex bg-slate-950 rounded-xl p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setType('urge')}
                  className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                    type === 'urge' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Urge / Craving
                </button>
                <button
                  type="button"
                  onClick={() => setType('relapse')}
                  className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                    type === 'relapse' ? 'bg-rose-500 text-slate-950' : 'text-slate-400 hover:text-slate-250'
                  }`}
                >
                  Relapse
                </button>
              </div>
            </div>
          </div>

          {type === 'urge' && (
            <div>
              <label className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span>Craving Intensity</span>
                <span className="text-sky-400 font-mono font-bold">{intensity}/10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>Mild</span>
                <span>Moderate</span>
                <span>Overwhelming</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="urgeTrigger">
                Specific Trigger
              </label>
              <input
                id="urgeTrigger"
                type="text"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="e.g. peer pressure, stress, boredom"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="mood">
                Immediate Emotional State
              </label>
              <input
                id="mood"
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="e.g. anxious, tired, frustrated"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="notes">
              Context & Reflections
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What alternative coping strategy did you try? E.g. box breathing, took a walk."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500/40"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowLogForm(false)}
              className="px-4 py-2 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-sky-500 hover:bg-sky-600 transition text-slate-950 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer disabled:opacity-50"
            >
              Save Event
            </button>
          </div>
        </form>
      )}

      {entries.length === 0 ? (
        <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-8 text-center max-w-md mx-auto">
          <Calendar className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">No logs saved yet</h4>
          <p className="text-xs text-slate-500 mt-1 mb-4">Urges and tracking entries logged will form a valuable self-reflection archive visible only to you.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-850 pb-2">Recent Logs History</h3>
          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 scrollbar-thin">
            {entries.map((entry) => {
              const habit = habits.find((h) => h.id === entry.habitId);
              const habitName = habit ? habit.name : 'Deleted Habit';
              
              return (
                <div key={entry.id} className="bg-slate-900/30 border border-slate-850 rounded-xl p-4 flex gap-3.5 items-start relative hover:border-slate-800 transition">
                  <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${
                    entry.type === 'clean_day' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : entry.type === 'relapse' 
                        ? 'bg-rose-500/10 text-rose-400' 
                        : 'bg-sky-500/10 text-sky-400'
                  }`}>
                    {entry.type === 'clean_day' ? (
                      <Flame className="w-5 h-5" />
                    ) : entry.type === 'relapse' ? (
                      <FlameKindling className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 text-xs">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-slate-100">{habitName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{formatDate(entry.timestamp)}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                        entry.type === 'clean_day' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30' 
                          : entry.type === 'relapse' 
                            ? 'bg-rose-950 text-rose-400 border border-rose-900/30' 
                            : 'bg-sky-950 text-sky-400 border border-sky-900/30'
                      }`}>
                        {entry.type === 'clean_day' ? 'Clean Day' : entry.type === 'relapse' ? 'Relapse Event' : `Craving Log (Intensity: ${entry.intensity}/10)`}
                      </span>
                      {entry.trigger && (
                        <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-900 px-2 py-0.5 rounded-md">
                          Trigger: {entry.trigger}
                        </span>
                      )}
                      {entry.mood && (
                        <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-900 px-2 py-0.5 rounded-md">
                          Mood: {entry.mood}
                        </span>
                      )}
                    </div>

                    {entry.notes && (
                      <p className="text-slate-400 leading-relaxed bg-slate-950/20 p-2.5 rounded-lg border border-slate-950/50 italic">
                        {entry.notes}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => onEntryDeleted(entry.id)}
                    className="absolute top-4 right-4 text-slate-600 hover:text-rose-400 p-0.5 rounded"
                    title="Delete entry log"
                  >
                    <RefreshCw className="w-3.5 h-3.5 hover:rotate-90 transition duration-300" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
