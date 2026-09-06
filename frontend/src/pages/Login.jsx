import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@urbanai.gov');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.');
      return;
    }
    setError('');
    try {
      await onLogin(email.trim(), password);
    } catch (loginError) {
      setError(loginError.message);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_15%_15%,#2563eb_0,transparent_35%),radial-gradient(circle_at_85%_85%,#0f766e_0,transparent_30%)]" />
      <div className="relative w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] bg-slate-900/90 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
        <section className="hidden lg:flex flex-col justify-between p-12 bg-blue-600 text-white min-h-[600px]">
          <div>
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 rounded-xl bg-white text-blue-700 flex items-center justify-center font-black text-xl">U</div>
              <span className="font-bold tracking-[0.18em] text-lg">URBANAi</span>
            </div>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-[0.2em] mb-4">Municipal intelligence platform</p>
            <h1 className="text-4xl font-bold leading-tight max-w-md">See the city clearly. Act before risk compounds.</h1>
          </div>
          <div className="flex items-start gap-3 text-blue-100 text-sm max-w-sm">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <p>Secure workspace for risk monitoring, scenario planning, and coordinated urban action.</p>
          </div>
        </section>

        <section className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black">U</div>
            <span className="font-bold tracking-[0.18em]">URBANAi</span>
          </div>
          <div className="mb-8">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-[0.18em] mb-3">Welcome back</p>
            <h2 className="text-3xl font-bold text-white">Sign in to your workspace</h2>
            <p className="text-sm text-slate-400 mt-2">Continue monitoring your city intelligence network.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="text-xs font-semibold text-slate-300">Work email</span>
              <span className="mt-2 flex items-center gap-2 px-3 border border-slate-700 bg-slate-950/60 rounded-lg focus-within:border-blue-500">
                <UserRound className="w-4 h-4 text-slate-500" />
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="w-full py-3 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" placeholder="name@municipality.gov" />
              </span>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-300">Password</span>
              <span className="mt-2 flex items-center gap-2 px-3 border border-slate-700 bg-slate-950/60 rounded-lg focus-within:border-blue-500">
                <LockKeyhole className="w-4 h-4 text-slate-500" />
                <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} className="w-full py-3 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" placeholder="Enter your password" />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-slate-200">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </span>
            </label>
            {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
            <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white transition-colors">
              Enter workspace
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[11px] text-slate-500 mt-8">Use your configured municipal account to access the workspace.</p>
        </section>
      </div>
    </main>
  );
}
