/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Sparkles, Send, ShieldAlert, PhoneCall, Trash2, Heart, Lock, Mic, MicOff } from 'lucide-react';
import { safeJsonFetch } from '../lib/api';

interface AiCoachProps {
  chatHistory: ChatMessage[];
  onMessageSent: () => void;
  onHistoryCleared: () => void;
  token: string;
}

export default function AiCoach({ chatHistory, onMessageSent, onHistoryCleared, token }: AiCoachProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if ((window as any)._activeCoachRecognition) {
        try {
          (window as any)._activeCoachRecognition.stop();
        } catch (e) {}
          (window as any)._activeCoachRecognition = null;
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
          setSpeechError("Microphone access blocked. Click 'Open in New Tab' to grant permissions.");
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
        setMessage(prev => prev ? prev + ' ' + transcript : transcript);
      };

      (window as any)._activeCoachRecognition = recognition;
      recognition.start();
    } catch (e: any) {
      setSpeechError("Could not start voice recognition.");
      setIsRecording(false);
    }
  };

  const stopSpeechRecognition = () => {
    if ((window as any)._activeCoachRecognition) {
      try {
        (window as any)._activeCoachRecognition.stop();
      } catch (e) {}
      (window as any)._activeCoachRecognition = null;
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

  // Calculate user messages in past 24 hours for rolling rate limit visibility
  useEffect(() => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const count = chatHistory.filter(
      m => m.sender === 'user' && new Date(m.timestamp).getTime() >= twentyFourHoursAgo
    ).length;
    setSessionCount(count);
  }, [chatHistory]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const msgTrim = message.trim();
    if (!msgTrim) return;

    if (sessionCount >= 20) {
      setError("Daily coaching limit reached (20 messages). Please take some time to reflect and try again tomorrow.");
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const data = await safeJsonFetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: msgTrim })
      });

      onMessageSent();
    } catch (err: any) {
      setError(err.message || "Failed to communicate with AI Coach.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to permanently delete all AI coaching logs? This action is immediate and irreversible.")) {
      return;
    }
    setError(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to clear coaching logs.');
      }
      onHistoryCleared();
    } catch (err: any) {
      setError(err.message || 'Failed to clear coaching history.');
    }
  };

  const formatMessageTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  // Safe simple markdown-to-html formatter for coach response paragraphs, lists, bold text, italics, and links
  const renderMessageContent = (text: string) => {
    return text.split('\n').map((para, i) => {
      let trimmed = para.trim();
      if (!trimmed) return <div key={i} className="h-2" />;

      // Check for bullet lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const item = trimmed.substring(2);
        return (
          <ul key={i} className="list-disc pl-5 my-1">
            <li className="text-[13px] sm:text-sm text-slate-300 leading-relaxed">
              {renderRichText(item)}
            </li>
          </ul>
        );
      }

      // Check for numbered lists (e.g. "1. ")
      const numberedListRegex = /^(\d+)\.\s+(.*)/;
      const match = trimmed.match(numberedListRegex);
      if (match) {
        const num = match[1];
        const item = match[2];
        return (
          <ol key={i} className="list-decimal pl-5 my-1">
            <li className="text-[13px] sm:text-sm text-slate-300 leading-relaxed">
              <span className="font-semibold text-indigo-400 mr-1">{num}.</span>
              {renderRichText(item)}
            </li>
          </ol>
        );
      }

      // Check for headers
      if (trimmed.startsWith('### ')) {
        return <h4 key={i} className="text-xs sm:text-sm font-extrabold text-indigo-400 mt-4 mb-1.5 uppercase tracking-wider">{trimmed.substring(4)}</h4>;
      }
      if (trimmed.startsWith('## ')) {
        return <h3 key={i} className="text-sm sm:text-base font-bold text-slate-100 mt-5 mb-2">{trimmed.substring(3)}</h3>;
      }
      if (trimmed.startsWith('# ')) {
        return <h2 key={i} className="text-base sm:text-lg font-extrabold text-indigo-300 mt-6 mb-2">{trimmed.substring(2)}</h2>;
      }

      return (
        <p key={i} className="text-[13px] sm:text-sm text-slate-200 leading-relaxed mb-2.5">
          {renderRichText(para)}
        </p>
      );
    });
  };

  const renderRichText = (text: string): React.ReactNode => {
    // 1. Parse markdown links: [text](href)
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      const plainText = text.substring(lastIndex, match.index);
      if (plainText) {
        parts.push(...renderBoldAndItalic(plainText));
      }
      const label = match[1];
      const href = match[2];
      parts.push(
        <a 
          key={`link-${match.index}`} 
          href={href} 
          target={href.startsWith('tel:') ? '_self' : '_blank'} 
          rel="noopener noreferrer" 
          className="text-indigo-400 hover:text-indigo-300 underline font-semibold transition"
        >
          {label}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }

    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(...renderBoldAndItalic(remainingText));
    }

    return parts.length > 0 ? <>{parts}</> : text;
  };

  const renderBoldAndItalic = (text: string): React.ReactNode[] => {
    const boldParts = text.split(/\*\*(.*?)\*\*/g);
    return boldParts.flatMap((boldPart, idx) => {
      if (idx % 2 === 1) {
        return [
          <strong key={`b-${idx}`} className="font-extrabold text-slate-50">
            {renderItalicOnly(boldPart)}
          </strong>
        ];
      } else {
        return renderItalicOnly(boldPart);
      }
    });
  };

  const renderItalicOnly = (text: string): React.ReactNode[] => {
    const italicParts = text.split(/\*(.*?)\*/g);
    return italicParts.map((italicPart, idx) => {
      if (idx % 2 === 1) {
        return <em key={`i-${idx}`} className="italic text-slate-300">{italicPart}</em>;
      }
      return italicPart;
    });
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
      {/* 1. CRISIS INTERVENTION SAFEGUARD BANNER */}
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex gap-3 text-rose-300">
          <PhoneCall className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-rose-200 block mb-0.5">Need immediate assistance or feeling overwhelmed?</span>
            Urges can be intense, but you are never alone. Professional support lines are free, confidential, and active 24/7.
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <a
            href="tel:988"
            className="bg-rose-600 hover:bg-rose-700 transition text-slate-100 text-[10px] font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-md shadow-rose-900/10"
          >
            Call 988 (Lifeline)
          </a>
          <a
            href="tel:18006624357"
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[10px] font-bold px-3.5 py-1.5 rounded-lg border border-slate-700"
          >
            Call SAMHSA
          </a>
        </div>
      </div>

      <div className="flex-1 bg-slate-950/40 border border-slate-850 rounded-2xl flex flex-col overflow-hidden relative">
        {/* Chat Header */}
        <div className="border-b border-slate-850 px-5 py-3.5 flex justify-between items-center bg-slate-900/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">AI Recovery Coach</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-slate-400">Server-isolated • Private CBT Coaching</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right text-xs">
              <span className="text-slate-400">Coaching usage: </span>
              <span className={`font-bold font-mono ${sessionCount >= 18 ? 'text-rose-400' : sessionCount >= 12 ? 'text-amber-400' : 'text-sky-400'}`}>
                {sessionCount}/20
              </span>
              <span className="text-[10px] text-slate-500 block">Rolling 24h limit</span>
            </div>

            {chatHistory.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                title="Wipe coaching history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-3">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                <Heart className="w-5 h-5 text-indigo-400" />
              </div>
              <h4 className="text-sm font-semibold text-slate-300">Initiate your recovery session</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Receive empathetic, evidence-based CBT and relapse prevention coaching. Let's discuss triggers, track goals, or simply check in with your feelings.
              </p>
            </div>
          ) : (
            chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 shadow-md ${
                    chat.sender === 'user'
                      ? 'bg-indigo-600 text-slate-100 rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 rounded-tl-none'
                  }`}
                >
                  <div className="mb-1.5 flex justify-between items-center gap-6">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      {chat.sender === 'user' ? 'You' : 'Coach Response'}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {formatMessageTime(chat.timestamp)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {chat.sender === 'user' ? (
                      <p className="text-[13px] sm:text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">{chat.message}</p>
                    ) : (
                      renderMessageContent(chat.message)
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 flex gap-2 items-center">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-[10px] text-slate-500 font-mono ml-1">AI Coach is reflecting...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-5 my-2 text-xs text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 flex gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Speech Error Banner */}
        {speechError && (
          <div className="mx-5 my-1 text-xs text-rose-400 bg-rose-950/20 border border-rose-900/25 rounded-xl p-2.5 flex gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{speechError}</span>
          </div>
        )}

        {/* Input Footer */}
        <form onSubmit={handleSendMessage} className="border-t border-slate-850 p-4 bg-slate-900/20 flex gap-2.5 items-center">
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-3 rounded-xl border cursor-pointer transition shrink-0 flex items-center justify-center ${
              isRecording 
                ? 'bg-rose-500/10 border-rose-500 text-rose-400 animate-pulse' 
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-250 hover:border-slate-700'
            }`}
            title={isRecording ? "Stop voice transcription" : "Speak to AI Coach"}
          >
            {isRecording ? <MicOff className="w-4.5 h-4.5 text-rose-400 animate-bounce" /> : <Mic className="w-4.5 h-4.5 text-indigo-400" />}
          </button>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
            placeholder={sessionCount >= 20 ? "Rolling message limit exceeded. Reflections restart tomorrow." : isRecording ? "Listening... Speak clearly" : "How can I support you on your recovery journey today?"}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition"
          />
          <button
            type="submit"
            disabled={loading || !message.trim() || sessionCount >= 20}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 transition text-slate-100 p-3 rounded-xl cursor-pointer shrink-0 flex items-center justify-center shadow-md shadow-indigo-600/10"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
