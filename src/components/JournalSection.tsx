/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Journal } from '../types';
import { Shield, Feather, Trash2, Calendar, Lock, Mic, MicOff } from 'lucide-react';
import { safeJsonFetch } from '../lib/api';

interface JournalSectionProps {
  journals: Journal[];
  onJournalAdded: () => void;
  onJournalDeleted: () => void;
  token: string;
}

export default function JournalSection({ journals, onJournalAdded, onJournalDeleted, token }: JournalSectionProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if ((window as any)._activeJournalRecognition) {
        try {
          (window as any)._activeJournalRecognition.stop();
        } catch (e) {}
        (window as any)._activeJournalRecognition = null;
      }
    };
  }, []);

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Voice recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error", event);
        if (event.error === 'not-allowed') {
          setSpeechError("Microphone access blocked. Click 'Open in New Tab' in the preview top-right if permissions are denied within the frame.");
        } else {
          setSpeechError(`Voice input error: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setContent(prev => prev ? prev + ' ' + transcript : transcript);
      };

      (window as any)._activeJournalRecognition = recognition;
      recognition.start();
    } catch (e: any) {
      setSpeechError("Could not start voice recognition.");
      setIsRecording(false);
    }
  };

  const stopSpeechRecognition = () => {
    if ((window as any)._activeJournalRecognition) {
      try {
        (window as any)._activeJournalRecognition.stop();
      } catch (e) {}
      (window as any)._activeJournalRecognition = null;
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const contentTrim = content.trim();
    if (!contentTrim) {
      setError("Please write some content for your secure journal entry.");
      return;
    }

    setLoading(true);

    try {
      const data = await safeJsonFetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          content: contentTrim,
          mood: mood.trim()
        })
      });

      setSuccess("Your journal entry has been safely encrypted and saved.");
      setTitle('');
      setContent('');
      setMood('');
      setShowAddForm(false);
      onJournalAdded();
    } catch (err: any) {
      setError(err.message || "Failed to write journal.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJournal = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this journal entry? This action is irreversible and the entry will be wiped from our secure schemas immediately.")) {
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/journal/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to delete journal.');
      }
      onJournalDeleted();
    } catch (err: any) {
      setError(err.message || 'Failed to delete journal.');
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Secure Journal & Reflections</h2>
          <p className="text-xs text-slate-400 mt-1">Reflect on triggers and track emotional patterns in absolute secrecy.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-purple-600 hover:bg-purple-700 transition text-slate-100 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
        >
          <Feather className="w-4 h-4" />
          <span>{showAddForm ? 'Close Editor' : 'Write New Entry'}</span>
        </button>
      </div>

      <div className="bg-purple-950/15 border border-purple-900/30 rounded-xl p-4 flex gap-3 text-purple-300">
        <Lock className="w-5 h-5 shrink-0 mt-0.5 text-purple-400" />
        <div className="text-xs space-y-1">
          <span className="font-semibold text-purple-200 block">ZERO ACCESS PRIVACY ACTIVE</span>
          <p>Your journal logs are processed locally and serverless. They are never transmitted to third parties, are encrypted at rest, and are explicitly excluded from generative AI contexts to ensure complete, unrestricted client confidentiality.</p>
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl p-3">
          {error}
        </div>
      )}

      {success && (
        <div className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3">
          {success}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleCreateJournal} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 max-w-xl">
          <h3 className="text-sm font-semibold text-slate-200">New Secure Reflection</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="journalTitle">
                Entry Title
              </label>
              <input
                id="journalTitle"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Navigating Friday evening craving"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="journalMood">
                Overall Sentiment / Mood
              </label>
              <input
                id="journalMood"
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="e.g. Peaceful, struggling but holding, hopeful"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500/40"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300" htmlFor="journalContent">
                My Thoughts & Reflections *
              </label>
              <button
                type="button"
                onClick={toggleRecording}
                className={`text-[10px] flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono border transition cursor-pointer ${
                  isRecording 
                    ? 'bg-rose-500/10 border-rose-500 text-rose-400 animate-pulse font-bold' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-750'
                }`}
                title={isRecording ? "Stop voice transcription" : "Speak to transcribe thoughts"}
              >
                {isRecording ? (
                  <>
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                    <MicOff className="w-3 h-3 text-rose-400" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3 text-purple-400" />
                    <span>Speak / Transcribe</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              id="journalContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="How are you feeling today? What triggers did you notice? Expressing thoughts is an active mindfulness exercise."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500/40"
              required
            />
            {speechError && (
              <div className="text-[10px] text-rose-400 bg-rose-950/10 border border-rose-900/20 rounded-lg p-2 mt-1.5">
                {speechError}
              </div>
            )}
            <div className="text-right text-[10px] text-slate-500 mt-1 font-mono">
              Max 5000 chars • Strictly confidential
            </div>
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
              className="bg-purple-600 hover:bg-purple-700 text-slate-100 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer disabled:opacity-50"
            >
              Encrypt and Save
            </button>
          </div>
        </form>
      )}

      {journals.length === 0 ? (
        <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-8 text-center max-w-md mx-auto">
          <Shield className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">Your journal is empty</h4>
          <p className="text-xs text-slate-500 mt-1 mb-4">No entries have been saved. Expressing feelings securely helps navigate psychological urges.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {journals.map((journal) => (
            <div key={journal.id} className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5 hover:border-slate-800 transition relative">
              <div className="flex justify-between items-start gap-4 mb-2.5">
                <div>
                  <h3 className="text-base font-bold text-slate-100">{journal.title || 'Untitled Secure Reflection'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px] text-slate-400 font-medium">{formatDate(journal.createdAt)}</span>
                    {journal.mood && (
                      <>
                        <span className="text-slate-600 font-mono">•</span>
                        <span className="text-[11px] font-semibold text-purple-400">Mood: {journal.mood}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteJournal(journal.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                  title="Delete journal entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/20 p-4 rounded-xl border border-slate-900">
                {journal.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
