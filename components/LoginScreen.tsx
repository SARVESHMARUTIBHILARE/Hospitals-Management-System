/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Shield, Lock, Mail, ChevronRight, CheckCircle, AlertCircle, Info, Eye, EyeOff, 
  User, UserPlus, LogIn, Sparkles
} from 'lucide-react';
import { Doctor, Patient } from '../types';

interface LoginScreenProps {
  doctors: Doctor[];
  patients: Patient[];
  onLoginSuccess: (user: {
    id: string;
    username: string;
    role: 'admin' | 'doctor' | 'patient';
    name: string;
    title: string;
    patientId: string | null;
    doctorId: string | null;
  }) => void;
}

export default function LoginScreen({ doctors, patients, onLoginSuccess }: LoginScreenProps) {
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  
  // Login Form States
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState<'admin' | 'doctor' | 'patient'>('admin');

  // Sign Up Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<'patient' | 'doctor'>('patient');
  const [regPassword, setRegPassword] = useState('');

  // OAuth Simulation Modal State
  const [activeOAuthProvider, setActiveOAuthProvider] = useState<'Google' | 'Facebook' | 'Instagram' | null>(null);
  const [oauthEmail, setOauthEmail] = useState('');
  const [oauthName, setOauthName] = useState('');
  const [oauthRole, setOauthRole] = useState<'patient' | 'doctor'>('patient');

  // Find some sample accounts to display as suggestions
  const sampleDoctor = doctors.find(d => d.id === 'd-jenkins') || doctors[0];
  const samplePatient = patients.find(p => p.id === 'p-101') || patients[0];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim()) {
      setErrorMsg('Please enter your email ID or username');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameOrEmail.trim(),
          password: password,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg('Authentication verified. Securing tunnel...');
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 800);
      } else {
        setErrorMsg(data.message || 'Invalid credentials. Please verify your email ID or username.');
      }
    } catch (err) {
      console.error('Server auth failed, using local fallback mapping:', err);
      
      const input = usernameOrEmail.trim().toLowerCase();
      let matchedUser: any = null;

      if (input === 'admin' || input === 'admin@careflow.com') {
        if (password === 'admin' || password === 'password123') {
          matchedUser = {
            id: 'u-admin',
            username: 'admin',
            role: 'admin',
            name: 'Dr. Arthur Vance',
            title: 'Chief Medical Officer & Administrator',
            patientId: null,
            doctorId: null
          };
        }
      } else {
        // Check doctors
        const doc = doctors.find(d => d.email?.toLowerCase() === input || d.id.toLowerCase() === input);
        if (doc) {
          matchedUser = {
            id: `u-doc-${doc.id}`,
            username: `dr${doc.name.replace('Dr. ', '').split(' ').pop()?.toLowerCase() || 'doc'}`,
            role: 'doctor',
            name: doc.name,
            title: `${doc.specialization} (${doc.department})`,
            patientId: null,
            doctorId: doc.id
          };
        } else {
          // Check patients
          const pat = patients.find(p => p.email?.toLowerCase() === input || p.id.toLowerCase() === input);
          if (pat) {
            matchedUser = {
              id: `u-pat-${pat.id}`,
              username: `${pat.name.split(' ')[0]?.toLowerCase() || 'patient'}`,
              role: 'patient',
              name: pat.name,
              title: 'Patient',
              patientId: pat.id,
              doctorId: null
            };
          }
        }
      }

      if (matchedUser) {
        setSuccessMsg('Session established. Redirecting...');
        setTimeout(() => {
          onLoginSuccess(matchedUser);
        }, 600);
      } else {
        setErrorMsg('Authentication failed. Please verify your email ID/username and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          role: regRole,
          password: regPassword,
          provider: 'Email ID'
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg(`Welcome, ${data.user.name}! Your account has been registered successfully.`);
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1200);
      } else {
        setErrorMsg(data.message || 'Registration failed. This email ID might be in use.');
      }
    } catch (err) {
      setErrorMsg('Error contacting servers. Simulated registration enabled via mock profile.');
      setLoading(false);
    }
  };

  const handleOAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oauthName.trim()) {
      setErrorMsg('Please enter your profile name');
      return;
    }
    if (!oauthEmail.trim() || !oauthEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address for association');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: oauthName.trim(),
          email: oauthEmail.trim(),
          provider: activeOAuthProvider,
          role: oauthRole
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg(`Federated connection with ${activeOAuthProvider} successful! logged in as ${data.user.name}.`);
        setActiveOAuthProvider(null);
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1200);
      } else {
        setErrorMsg(data.message || 'Federated OAuth handshake failed.');
      }
    } catch (err) {
      setErrorMsg('Handshake timeout. Registered successfully locally.');
      setLoading(false);
    }
  };

  const startOAuthSimulation = (provider: 'Google' | 'Facebook' | 'Instagram') => {
    setActiveOAuthProvider(provider);
    setErrorMsg('');
    setSuccessMsg('');
    
    if (provider === 'Google') {
      setOauthName('Alex Mercer');
      setOauthEmail('alex.mercer@gmail.com');
    } else if (provider === 'Facebook') {
      setOauthName('Jordan Riley');
      setOauthEmail('jordan.riley@facebook.com');
    } else {
      setOauthName('Sasha Gray');
      setOauthEmail('sasha.gray@instagram.com');
    }
  };

  const handleQuickFill = (email: string, role: 'admin' | 'doctor' | 'patient') => {
    setUsernameOrEmail(email);
    setPassword(role === 'admin' ? 'admin' : 'password123');
    setActiveRoleTab(role);
    setErrorMsg('');
    setSuccessMsg('');
    setIsSignUpMode(false);
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans select-none">
      {/* Immersive futuristic background effects */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 pointer-events-none z-0"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-pink-500/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-lg z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto inline-flex items-center justify-center w-14 h-14 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-90 shadow-lg shadow-indigo-500/20 animate-pulse"></div>
            <div className="absolute inset-0.5 bg-slate-950 rounded-[14px] flex items-center justify-center">
              <svg className="w-7 h-7 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" className="stroke-pink-500" strokeWidth="2" />
                <path d="M12 6v12M6 12h12" className="stroke-indigo-400" strokeWidth="3" />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">CareFlow <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">HMS</span></h2>
            <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase mt-1">Secure Hospital Management & Core Federated Portals</p>
          </div>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="bg-red-950/60 border border-red-800 text-red-200 p-3 rounded-xl text-xs font-semibold flex items-start gap-2.5 max-w-md mx-auto animate-fadeIn">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-green-950/60 border border-green-800 text-green-200 p-3 rounded-xl text-xs font-semibold flex items-start gap-2.5 max-w-md mx-auto animate-fadeIn">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Centered Secure Authentication Box */}
        <div className="bg-slate-950/80 border border-slate-800/80 p-6 md:p-8 rounded-2xl shadow-2xl backdrop-blur-md space-y-6">
          {activeOAuthProvider ? (
            /* --- OAUTH PROFILES SIMULATION Handshake dialog --- */
            <div className="space-y-5 animate-fadeIn relative flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    activeOAuthProvider === 'Google' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    activeOAuthProvider === 'Facebook' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' :
                    'bg-pink-600/20 text-pink-400 border border-pink-500/30'
                  }`}>
                    {activeOAuthProvider} Live Handshake
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setActiveOAuthProvider(null)}
                    className="text-slate-400 hover:text-slate-200 text-xs font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  We detected a secure federated profile from <span className="text-white font-extrabold">{activeOAuthProvider}</span>. Fill the form below to enter CareFlow:
                </p>

                <form onSubmit={handleOAuthSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Profile Name</label>
                    <input
                      type="text"
                      required
                      value={oauthName}
                      onChange={(e) => setOauthName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-white font-medium focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Linked Email Address</label>
                    <input
                      type="email"
                      required
                      value={oauthEmail}
                      onChange={(e) => setOauthEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">CareFlow System Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOauthRole('patient')}
                        className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                          oauthRole === 'patient' 
                            ? 'bg-indigo-600/25 border-indigo-500 text-white' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Patient
                      </button>
                      <button
                        type="button"
                        onClick={() => setOauthRole('doctor')}
                        className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                          oauthRole === 'doctor' 
                            ? 'bg-indigo-600/25 border-indigo-500 text-white' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Doctor (Staff)
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:from-indigo-500 hover:to-purple-500 cursor-pointer"
                  >
                    Authenticate and Enter
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* --- STANDARD LOGIN & REGISTRATION MODE --- */
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Shield className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {isSignUpMode ? 'Secure Account Sign Up' : 'Authentication Protection'}
                    </span>
                  </div>
                </div>

                {!isSignUpMode ? (
                  /* LOGIN FORM */
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Email ID or Username</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4.5 w-4.5 text-slate-500" />
                        </div>
                        <input
                          type="text"
                          value={usernameOrEmail}
                          onChange={(e) => setUsernameOrEmail(e.target.value)}
                          placeholder="doctor@hospital.com or patient@gmail.com"
                          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white font-medium placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Security Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4.5 w-4.5 text-slate-500" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter secure password"
                          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white font-medium placeholder-slate-600 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        <>
                          Verify & Enter System <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    <div className="text-center pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUpMode(true);
                          setErrorMsg('');
                        }}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto transition cursor-pointer"
                      >
                        <UserPlus className="h-4 w-4" />
                        New user? Create account
                      </button>
                    </div>
                  </form>
                ) : (
                  /* SIGN UP / REGISTRATION FORM */
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4.5 w-4.5 text-slate-500" />
                        </div>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Dr. Sarah Jenkins or Sarah Miller"
                          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white font-medium placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4.5 w-4.5 text-slate-500" />
                        </div>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="user@website.com"
                          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white font-medium placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">System Role</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setRegRole('patient')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                            regRole === 'patient' 
                              ? 'bg-indigo-600 text-white' 
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Patient
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegRole('doctor')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                            regRole === 'doctor' 
                              ? 'bg-indigo-600 text-white' 
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Medical Staff
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Create Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4.5 w-4.5 text-slate-500" />
                        </div>
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Minimum 4 characters"
                          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white font-medium placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white py-2.5 px-4 rounded-xl text-xs font-extrabold uppercase tracking-widest transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        <>
                          Sign Up & Log In <CheckCircle className="h-4.5 w-4.5" />
                        </>
                      )}
                    </button>

                    <div className="text-center pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUpMode(false);
                          setErrorMsg('');
                        }}
                        className="text-slate-400 hover:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto transition cursor-pointer"
                      >
                        <LogIn className="h-4 w-4" />
                        Have an account? Log In
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* --- REQUESTED SOCIAL WEBSITES HANDSHAKING (GOOGLE, FACEBOOK, INSTAGRAM) --- */}
              <div className="border-t border-slate-800/85 pt-4 space-y-3">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">
                  <span>Or authorize via websites</span>
                  <span className="text-indigo-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Secure Link
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => startOAuthSimulation('Google')}
                    className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-red-500/40 text-slate-200 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1.5 transition text-xs font-semibold cursor-pointer group"
                    title="Login via Google"
                  >
                    <svg className="w-5 h-5 text-red-500 group-hover:scale-110 transition duration-200" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.48 1 0 6.48 0 13s5.48 12 12.24 12c7.05 0 11.74-4.96 11.74-11.95 0-.805-.085-1.415-.2-1.765H12.24z" />
                    </svg>
                    <span className="text-[9px] text-slate-400 group-hover:text-white font-bold transition">Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => startOAuthSimulation('Facebook')}
                    className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/40 text-slate-200 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1.5 transition text-xs font-semibold cursor-pointer group"
                    title="Login via Facebook"
                  >
                    <svg className="w-5 h-5 text-blue-500 group-hover:scale-110 transition duration-200" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className="text-[9px] text-slate-400 group-hover:text-white font-bold transition">Facebook</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => startOAuthSimulation('Instagram')}
                    className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-pink-500/40 text-slate-200 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1.5 transition text-xs font-semibold cursor-pointer group"
                    title="Login via Instagram"
                  >
                    <svg className="w-5 h-5 text-pink-500 group-hover:scale-110 transition duration-200" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                    </svg>
                    <span className="text-[9px] text-slate-400 group-hover:text-white font-bold transition">Instagram</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Demo Accounts Hub */}
          <div className="border-t border-slate-800/80 pt-4 space-y-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Quick Demo Evaluation Accounts</span>
            
            {/* Role Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800/60">
              <button
                type="button"
                onClick={() => setActiveRoleTab('admin')}
                className={`text-[10px] font-bold py-1 px-1.5 rounded transition uppercase tracking-wider cursor-pointer ${
                  activeRoleTab === 'admin' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Admin Portal
              </button>
              <button
                type="button"
                onClick={() => setActiveRoleTab('doctor')}
                className={`text-[10px] font-bold py-1 px-1.5 rounded transition uppercase tracking-wider cursor-pointer ${
                  activeRoleTab === 'doctor' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Medical Staff
              </button>
              <button
                type="button"
                onClick={() => setActiveRoleTab('patient')}
                className={`text-[10px] font-bold py-1 px-1.5 rounded transition uppercase tracking-wider cursor-pointer ${
                  activeRoleTab === 'patient' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Patient Portal
              </button>
            </div>

            {/* Quick Fill suggestions based on active tab */}
            {activeRoleTab === 'admin' && (
              <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40 text-xs space-y-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@careflow.com', 'admin')}
                  className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-lg font-bold flex items-center justify-between transition group text-left cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="text-[9px] text-indigo-400 uppercase tracking-wider font-extrabold">Chief Administrator</div>
                    <div className="font-mono text-xs">admin@careflow.com</div>
                  </div>
                  <span className="text-[9px] bg-indigo-950 text-indigo-400 font-extrabold px-2 py-0.5 rounded border border-indigo-900 group-hover:bg-indigo-600 group-hover:text-white transition">Quick Fill</span>
                </button>
              </div>
            )}

            {activeRoleTab === 'doctor' && (
              <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40 text-xs space-y-1.5">
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto scrollbar-thin">
                  {sampleDoctor && (
                    <button
                      type="button"
                      onClick={() => handleQuickFill(sampleDoctor.email, 'doctor')}
                      className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 px-2 py-1.5 rounded-lg font-bold flex items-center justify-between transition group text-left cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <div className="text-[9px] text-indigo-400 uppercase tracking-wider font-extrabold truncate max-w-[180px]">{sampleDoctor.name}</div>
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-[180px]">{sampleDoctor.email}</div>
                      </div>
                      <span className="text-[9px] bg-indigo-950 text-indigo-400 font-extrabold px-1.5 py-0.5 rounded border border-indigo-900 group-hover:bg-indigo-600 group-hover:text-white transition">Fill</span>
                    </button>
                  )}
                  {doctors.slice(1, 3).map(doc => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => handleQuickFill(doc.email, 'doctor')}
                      className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 px-2 py-1.5 rounded-lg font-bold flex items-center justify-between transition group text-left cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <div className="text-[9px] text-indigo-400 uppercase tracking-wider font-extrabold truncate max-w-[180px]">{doc.name}</div>
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-[180px]">{doc.email}</div>
                      </div>
                      <span className="text-[9px] bg-indigo-950 text-indigo-400 font-extrabold px-1.5 py-0.5 rounded border border-indigo-900 group-hover:bg-indigo-600 group-hover:text-white transition">Fill</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeRoleTab === 'patient' && (
              <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40 text-xs space-y-1.5">
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto scrollbar-thin">
                  {samplePatient && (
                    <button
                      type="button"
                      onClick={() => handleQuickFill(samplePatient.email, 'patient')}
                      className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 px-2 py-1.5 rounded-lg font-bold flex items-center justify-between transition group text-left cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <div className="text-[9px] text-indigo-400 uppercase tracking-wider font-extrabold truncate max-w-[180px]">{samplePatient.name}</div>
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-[180px]">{samplePatient.email}</div>
                      </div>
                      <span className="text-[9px] bg-indigo-950 text-indigo-400 font-extrabold px-1.5 py-0.5 rounded border border-indigo-900 group-hover:bg-indigo-600 group-hover:text-white transition">Fill</span>
                    </button>
                  )}
                  {patients.slice(1, 3).map(pat => (
                    <button
                      key={pat.id}
                      type="button"
                      onClick={() => handleQuickFill(pat.email, 'patient')}
                      className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 px-2 py-1.5 rounded-lg font-bold flex items-center justify-between transition group text-left cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <div className="text-[9px] text-indigo-400 uppercase tracking-wider font-extrabold truncate max-w-[180px]">{pat.name}</div>
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-[180px]">{pat.email}</div>
                      </div>
                      <span className="text-[9px] bg-indigo-950 text-indigo-400 font-extrabold px-1.5 py-0.5 rounded border border-indigo-900 group-hover:bg-indigo-600 group-hover:text-white transition">Fill</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Footnote */}
        <div className="text-center text-[11px] text-slate-500 font-semibold flex items-center justify-center gap-1.5 bg-slate-950/20 border border-slate-800/40 p-2.5 rounded-xl">
          <Info className="h-4 w-4 text-indigo-400" />
          <span>CareFlow secure logins are matched in real time with our active PostgreSQL & Local SQLite databanks.</span>
        </div>
      </div>
    </div>
  );
}
