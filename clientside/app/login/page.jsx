"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/clients";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || "Login failed");
        return;
      }

      router.push("/");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message || "Sign up failed");
        return;
      }

      setInfo(
        "Account created. A verification email has been sent to " +
          (email || "your email address") +
          ". Please check your inbox and follow the instructions to verify your account."
      );
      setPassword("");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn("google");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-white">
      {/* Gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#22c55e33,_transparent_55%),_radial-gradient(circle_at_bottom,_#6366f133,_transparent_55%)]" />

      {/* Blobs */}
      <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-emerald-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 -bottom-32 h-96 w-96 rounded-full bg-purple-600/25 blur-3xl" />

      {/* Top bar with logo + title */}
      <header className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-4 sm:px-8 pt-8">
        <div className="flex items-center gap-3">
         

           <img
        src="/RVCE_Logo.png"
        alt="RVCE Logo"
        className="h-17 w-17 drop-shadow-2xl"
      />
          <span className="hidden text-sm font-medium text-4xl text-slate-200/80 sm:block">
            RV College of Engineering
          </span>
        </div>

        <div className="hidden max-w-xl text-right md:block">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300/80">
            Blockchain · Biometrics · Tickets
          </p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight text-slate-50">
            Secure & Transparent Event Ticket Booking System
          </h1>
        </div>
      </header>

      {/* Center layout */}
      <main className="relative z-10 flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 pb-8 pt-6 overflow-hidden">
        
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 md:gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
          

          {/* Left side content */}
<section className="flex flex-col justify-center gap-6">
  <div className="inline-flex w-fit items-center gap-3 rounded-xl bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-400/40 backdrop-blur-sm">
    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
    <span>SatyaTicketingg · On-chain & biometric bound
</span>
  </div>

  <div className="rounded-2xl border border-white/15 bg-white/8 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.9)] backdrop-blur-xl">
    <div className="flex items-center gap-4 mb-6">
     
      <div>
        <h2 className="text-4xl font-black tracking-tight text-white lg:text-5xl">
          Satya<span className="text-emerald-400">Ticketing</span>
        </h2>
      </div>
    </div>
    
    <p className="mb-8 text-lg text-slate-200/90 leading-relaxed">
      Secure biometric-bound tickets on-chain 
    </p>

    <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
      <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
          <svg width="20" height="20" viewBox="0 0 24 24" className="text-emerald-400" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <dt className="font-bold text-white">Trusted & Private</dt>
          <dd className="text-slate-200/90">Biometric hashes only</dd>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3 rounded-xl bg-sky-500/5 border border-sky-500/20">
        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20">
          <svg width="20" height="20" viewBox="0 0 24 24" className="text-sky-400" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <dt className="font-bold text-white">Instant Issuance</dt>
          <dd className="text-slate-200/90">On-chain in seconds</dd>
        </div>
      </div>
    </dl>
  </div>
</section>

          {/* Right side: form */}
          <section className="flex items-center">
            <div className="w-full rounded-2xl border border-white/15 bg-white/10 p-7 shadow-[0_22px_80px_rgba(15,23,42,0.9)] backdrop-blur-2xl sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white sm:text-2xl">
                    Welcome back
                  </h2>
                  <p className="mt-1 text-xs text-slate-200/80">
                    Sign in to manage your events, tickets, and check-ins
                    securely.
                  </p>
                </div>
                <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/30">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    className="text-emerald-200"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-1v2a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-2H6a3 3 0 0 1-3-3V7z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-200/90">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-300/70 shadow-inner outline-none transition focus:border-emerald-300/80 focus:ring-2 focus:ring-emerald-400/60"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-medium text-slate-200/90">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-[11px] text-emerald-300/90 hover:text-emerald-200"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-300/70 shadow-inner outline-none transition focus:border-emerald-300/80 focus:ring-2 focus:ring-emerald-400/60"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-300/85">
                  <div className="flex items-center gap-2">
                    <input
                      id="remember"
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-white/20 bg-white/10 text-emerald-400 focus:ring-emerald-400/60"
                    />
                    <label htmlFor="remember" className="cursor-pointer">
                      Remember this device
                    </label>
                  </div>
                  <span>By signing in you accept demo terms.</span>
                </div>

                {error && (
                  <div className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                    {error}
                  </div>
                )}

                {info && (
                  <div className="rounded-md border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                    {info}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </button>

                  <button
                    onClick={handleSignup}
                    disabled={loading}
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-white/5 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-slate-200/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? "Working..." : "Create account"}
                  </button>
                </div>

                <div className="relative pt-4">
                  <div className="flex items-center justify-center">
                    <span className="h-px w-full bg-white/10" />
                    <span className="px-2 text-[10px] uppercase tracking-[0.2em] text-slate-300/80">
                      Or continue with
                    </span>
                    <span className="h-px w-full bg-white/10" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="mt-3 flex w-full items-center justify-center gap-3 rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-xs font-medium text-slate-50 shadow-md transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-slate-200/60 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 48 48"
                      xmlns="http://www.w3.org/2000/svg"
                      className="shrink-0"
                    >
                      <path
                        fill="#EA4335"
                        d="M24 12.5c3.4 0 6 1.5 7.8 2.7l5.7-5.7C34.9 6 29.8 4 24 4 14.8 4 7 9.9 3.7 17.9l6.6 5.1C11.9 18.3 17.4 12.5 24 12.5z"
                      />
                      <path
                        fill="#34A853"
                        d="M46.5 24c0-1.6-.1-2.8-.4-4H24v8.1h12.6c-.6 3.3-2.8 6.1-6 7.6l6.8 5.3C43.6 36.4 46.5 30.7 46.5 24z"
                      />
                      <path
                        fill="#4A90E2"
                        d="M10.3 29.7A14.7 14.7 0 0 1 9 24c0-1.6.3-3.1.9-4.5L3.3 14.5C1.2 18.7 0 22.9 0 24c0 3.4 1.2 6.6 3.3 10l7-4.3z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M24 44c6.4 0 11.9-2.1 15.9-5.8l-7.6-6c-2 1.5-4.6 2.4-8.3 2.4-6.6 0-12.1-5.8-13.4-10.6L3.3 34.1C7 39.5 14.8 44 24 44z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>
              </form>
            </div>
          </section>
          
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950 backdrop-blur-sm">
        <div className="w-full px-8 py-4">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Left side - Links */}
            <div className="flex flex-wrap gap-8 text-sm text-slate-400/90">
              <a href="#" className="transition hover:text-emerald-300/80 font-medium">
                Privacy Policy
              </a>
              <a href="#" className="transition hover:text-emerald-300/80 font-medium">
                Terms of Service
              </a>
              <a href="#" className="transition hover:text-emerald-300/80 font-medium">
                Developer Docs
              </a>
              <a href="#" className="transition hover:text-emerald-300/80 font-medium">
                Support
              </a>
            </div>

            {/* Right side - Names */}
            <div className="flex gap-12 text-sm text-slate-300">
              <p className="font-semibold">Unmesh Raj</p>
              <p className="font-semibold">Aditya K</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
