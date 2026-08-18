import React, { useState } from 'react';
import { RoutePath } from '../../types';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordViewProps {
  onNavigate: (path: RoutePath) => void;
}

export function ForgotPasswordView({ onNavigate }: ForgotPasswordViewProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-md bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl p-8 rounded-2xl shadow-2xl relative z-10">
        <button
          onClick={() => onNavigate('/login')}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

        <h1 className="font-extrabold text-xl tracking-tight text-white mb-2">Reset Password</h1>
        <p className="text-xs text-neutral-400 mb-6">
          Enter your registered email address to receive secure access recovery instructions.
        </p>

        {submitted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Recovery Link Dispatched</h3>
            <p className="text-xs text-neutral-400">
              Check inbox at <span className="font-mono text-emerald-400">{email}</span> to complete credential restoration.
            </p>
            <button
              onClick={() => onNavigate('/login')}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-2 rounded-lg text-xs transition-colors mt-2"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@lifeos.internal"
                  className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
            >
              Send Recovery Instructions
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
