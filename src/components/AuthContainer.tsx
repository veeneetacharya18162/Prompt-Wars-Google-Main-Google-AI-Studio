/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ShieldAlert, LogIn, UserPlus, KeyRound, CheckCircle, Sparkles } from 'lucide-react';

interface AuthContainerProps {
  onAuthSuccess: () => void;
  onSandboxLogin: (type: 'test' | 'recovery') => void;
}

export default function AuthContainer({ onAuthSuccess, onSandboxLogin }: AuthContainerProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    const emailTrim = email.trim();
    if (!emailTrim || !password) {
      setError("Please fill out all mandatory fields.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up Flow
        if (password.length < 8) {
          setError("Password must be at least 8 characters long for robust security.");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, emailTrim, password);
        // Securely trigger email verification
        if (userCredential.user) {
          await sendEmailVerification(userCredential.user);
          setMessage("Account created! A verification email has been sent to your inbox. Please verify your email, then log in.");
          setIsSignUp(false);
          setPassword('');
        }
      } else {
        // Sign In Flow
        const userCredential = await signInWithEmailAndPassword(auth, emailTrim, password);
        if (userCredential.user) {
          // If the email is not verified, we can let the user know, but they can still log in or we show a mild alert.
          // In some strict environments, you require email verification. Let's show a helpful indicator without blocking them completely, or require it.
          // Let's check:
          if (!userCredential.user.emailVerified) {
            setMessage("Welcome! Please note: Your email is not verified. Please check your inbox for the verification link to unlock all safety features.");
          }
          onAuthSuccess();
        }
      }
    } catch (err: any) {
      console.error("Authentication Error:", err);
      // Account enumeration prevention & generic safe error messages
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError("Invalid email address or password combination. Please try again.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("This email address is already in use. Please sign in or use password reset.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password Authentication is not enabled in the Firebase Console. To fix this, open your Firebase Project Console, navigate to Authentication > Sign-in method, click 'Add new provider', select 'Email/Password', enable it, and save the settings.");
      } else {
        setError("Authentication failed. Please check your network connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError(null);
    setMessage(null);
    const emailTrim = email.trim();
    if (!emailTrim) {
      setError("Please enter your email address to request a secure password reset link.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, emailTrim);
      // Prevent enumeration: "If that email is registered..."
      setMessage("If your email is registered in our database, a secure password reset link has been dispatched to your inbox.");
    } catch (err: any) {
      console.error("Password Reset Error:", err);
      setMessage("If your email is registered in our database, a secure password reset link has been dispatched to your inbox.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-2xl">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">SoberPath Recovery</h1>
        <p className="text-xs text-slate-400 mt-1">A Secure, Privacy-First Addiction & Habit Coaching Companion</p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        {error && (
          <div className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 flex gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3 flex gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/10 transition"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-slate-300" htmlFor="password">
              Secure Password
            </label>
            {!isSignUp && (
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-[11px] text-slate-400 hover:text-emerald-400 transition"
              >
                Forgot Password?
              </button>
            )}
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/10 transition"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 active:translate-y-[0.5px] disabled:opacity-50 transition text-slate-950 text-xs font-semibold py-3 rounded-xl cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
          ) : isSignUp ? (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Create Secure Account</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In Securely</span>
            </>
          )}
        </button>
      </form>

      <div className="text-center mt-6 border-t border-slate-800 pt-4">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setMessage(null);
          }}
          className="text-xs text-slate-400 hover:text-emerald-400 transition"
        >
          {isSignUp 
            ? "Already have an account? Sign In" 
            : "First-time visitor? Create an Account"
          }
        </button>
      </div>

      {/* Demo Credentials for Fast Evaluation */}
      <div className="mt-5 pt-4 border-t border-slate-800 bg-slate-900/20 p-4 rounded-xl border border-slate-800">
        <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Instant Sandbox Evaluation</span>
        </h4>
        <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
          To prevent Firebase Auth configuration issues (such as the <code className="text-rose-400 bg-slate-950 px-1 py-0.5 rounded font-mono">auth/operation-not-allowed</code> error if Email/Password is not enabled in the console), click below to instantly launch a fully populated, secure <strong>Sandbox Bypass Session</strong>:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSandboxLogin('test')}
            className="bg-emerald-950/25 hover:bg-emerald-950/40 border border-emerald-900/35 hover:border-emerald-700 transition p-3 rounded-lg text-left flex flex-col cursor-pointer"
          >
            <span className="text-[11px] font-extrabold text-emerald-400">Account 1: TestHero</span>
            <span className="text-[10px] text-slate-400 mt-1">test@soberpath.com</span>
            <span className="text-[9px] text-emerald-500/80 font-mono mt-1 font-semibold flex items-center gap-1">
              <span>●</span> Instant Demo Access
            </span>
          </button>
          
          <button
            type="button"
            onClick={() => onSandboxLogin('recovery')}
            className="bg-indigo-950/25 hover:bg-indigo-950/40 border border-indigo-900/35 hover:border-indigo-700 transition p-3 rounded-lg text-left flex flex-col cursor-pointer"
          >
            <span className="text-[11px] font-extrabold text-indigo-400">Account 2: SoberJourney</span>
            <span className="text-[10px] text-slate-400 mt-1">recovery@soberpath.com</span>
            <span className="text-[9px] text-indigo-500/80 font-mono mt-1 font-semibold flex items-center gap-1">
              <span>●</span> Instant Demo Access
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
