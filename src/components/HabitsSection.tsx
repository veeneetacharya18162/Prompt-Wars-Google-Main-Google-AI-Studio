/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Habit, HabitCategory } from '../types';
import { Plus, Trash2, ShieldAlert, CheckCircle2, Award, Sparkles, HelpCircle } from 'lucide-react';
import { safeJsonFetch } from '../lib/api';

interface HabitsSectionProps {
  habits: Habit[];
  onHabitAdded: () => void;
  onHabitDeleted: () => void;
  onLogCleanDay: (habitId: string) => void;
  token: string;
}

export default function HabitsSection({ habits, onHabitAdded, onHabitDeleted, onLogCleanDay, token }: HabitsSectionProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<HabitCategory>('Other');
  const [goal, setGoal] = useState('');
  const [triggers, setTriggers] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const categories: HabitCategory[] = [
    'Alcohol',
    'Smoking/Vaping',
    'Substances',
    'Gambling',
    'Digital/Screen Time',
    'Other'
  ];

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const nameTrim = name.trim();
    if (!nameTrim) {
      setError("Please provide a name or description of the habit.");
      return;
    }

    setLoading(true);

    const parsedTriggers = triggers
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    try {
      const data = await safeJsonFetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: nameTrim,
          category,
          goal: goal.trim(),
          triggers: parsedTriggers
        })
      });

      setSuccess(`Habit "${nameTrim}" registered securely.`);
      setName('');
      setGoal('');
      setTriggers('');
      setShowAddForm(false);
      onHabitAdded();
    } catch (err: any) {
      setError(err.message || 'Failed to create habit');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!confirm("Are you sure you want to permanently delete this habit tracking? This will remove it from your active recovery dashboard.")) {
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/habits/${habitId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to delete habit');
      }
      onHabitDeleted();
    } catch (err: any) {
      setError(err.message || 'Failed to delete habit');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Active Habits & Recovery Plans</h2>
          <p className="text-xs text-slate-400 mt-1">Identify triggers and define clear personal boundaries.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-500 hover:bg-emerald-600 transition text-slate-950 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer shadow-md shadow-emerald-500/10 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Plan Form' : 'Add Recovery Plan'}</span>
        </button>
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 flex gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3 flex gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleCreateHabit} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 max-w-xl">
          <h3 className="text-sm font-semibold text-slate-200">New Personalized Recovery Plan</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="habitName">
                Habit or Substance Description *
              </label>
              <input
                id="habitName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nicotine vaping, late night betting"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/40"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="category">
                Category *
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as HabitCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/40"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="goal">
              My Core Goal / Reason for Quitting
            </label>
            <textarea
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Save $200 per month, protect long-term cardiovascular health, improve mental clarity"
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="triggers">
              Known Triggers (comma-separated list)
            </label>
            <input
              id="triggers"
              type="text"
              value={triggers}
              onChange={(e) => setTriggers(e.target.value)}
              placeholder="e.g. Stressful meetings, alcohol with friends, social media exposure"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/40"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 transition text-slate-950 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer disabled:opacity-50"
            >
              Save Secure Plan
            </button>
          </div>
        </form>
      )}

      {habits.length === 0 ? (
        <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-8 text-center max-w-md mx-auto">
          <HelpCircle className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">No active recovery plans logged yet</h4>
          <p className="text-xs text-slate-500 mt-1 mb-4">Establishing structured goals and listing triggers is an evidence-based first step toward mindful habit reduction.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="border border-slate-700 hover:border-emerald-500/40 text-xs text-slate-300 px-4 py-2 rounded-xl transition inline-flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Create Recovery Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {habits.map((habit) => (
            <div key={habit.id} className="bg-slate-900/35 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-750 transition duration-200">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-md">
                      {habit.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-1.5">{habit.name}</h3>
                  </div>
                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition"
                    title="Delete plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {habit.goal && (
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/25 p-3 rounded-xl border border-slate-900/50">
                    <span className="font-semibold text-slate-300 block mb-0.5 text-[11px]">Core Motivation:</span>
                    {habit.goal}
                  </p>
                )}

                {habit.triggers && habit.triggers.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 block">Personal Triggers:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {habit.triggers.map((trigger, i) => (
                        <span key={i} className="text-[10px] bg-slate-950 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-900">
                          {trigger}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800/60 mt-5 pt-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Streak Count</span>
                    <span className="text-xs font-extrabold text-amber-300">{habit.streak} {habit.streak === 1 ? 'day' : 'days'}</span>
                  </div>
                </div>

                <button
                  onClick={() => onLogCleanDay(habit.id)}
                  className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Log Clean Day</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
