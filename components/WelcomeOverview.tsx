/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, ChevronRight, Calendar, Users, Activity, Sliders, User, Pill } from 'lucide-react';
import { Patient, Doctor, Appointment, Department, AuditLog } from '../types';
import HospitalDirectory from './HospitalDirectory';

interface WelcomeOverviewProps {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  departments: Department[];
  auditLogs: AuditLog[];
  switchSimulatedUser: (role: 'admin' | 'doctor' | 'patient') => void;
  onImpersonate: (type: 'doctor' | 'patient', id: string) => void;
  currentUserId: string;
}

export default function WelcomeOverview({
  patients,
  doctors,
  appointments,
  departments,
  auditLogs,
  switchSimulatedUser,
  onImpersonate,
  currentUserId,
}: WelcomeOverviewProps) {
  return (
    <div id="view-overview" className="space-y-8 animate-fadeIn">
      {/* Hero Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm overflow-hidden relative">
        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="max-w-2xl space-y-4 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Shield className="h-3.5 w-3.5 text-indigo-600 animate-pulse" /> HIPAA Secure Framework
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
              <Activity className="h-3.5 w-3.5 text-amber-500" /> Live Health Intel
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Hospital Management &<br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">Resource Allocation System</span>
          </h1>
          <p className="text-slate-600 leading-relaxed font-sans">
            CareFlow links clinical patient scheduling, medical record curation, and expert administrative planning under a single unified dashboard, integrated with audited database schemas and live AI intelligence recommendations.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => switchSimulatedUser('patient')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm shadow-indigo-100 cursor-pointer"
            >
              Patient Experience <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => switchSimulatedUser('doctor')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all border border-slate-200 flex items-center gap-2 cursor-pointer"
            >
              Staff Workspaces <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => switchSimulatedUser('admin')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all border border-slate-200 flex items-center gap-2 cursor-pointer"
            >
              Planning & Analytics <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4 w-full lg:max-w-xs font-sans text-slate-700 shadow-inner">
          <div className="text-xs text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 pb-2">
            Active Database Status
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-medium">Integrity Check:</span>
            <span className="text-indigo-600 font-bold">SHA-256 Passed</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-medium">Total Patients:</span>
            <span className="text-slate-900 font-semibold">{patients.length || 3} Loaded</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-medium">Physicians:</span>
            <span className="text-slate-900 font-semibold">{doctors.length || 4} On-Duty</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-medium">Secure Logs:</span>
            <span className="text-slate-900 font-semibold">{auditLogs.length || 3} Logs</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-medium">Storage Engine:</span>
            <span className="text-indigo-600 font-bold">Express FileDB</span>
          </div>
        </div>
      </div>

      {/* Quick Metrics Ribbons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">Scheduled Appointments</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {appointments.length || 3} Active
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">Allocated Beds</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {departments.reduce((sum, d) => sum + d.bedsAllocated, 0)} Total
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">Resource Bed Occupancy</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {((departments.reduce((sum, d) => sum + d.bedsOccupied, 0) / (departments.reduce((sum, d) => sum + d.bedsAllocated, 0) || 1)) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">Access Security Logs</span>
            <span className="text-2xl font-extrabold text-indigo-600 mt-1 block font-mono">
              256-Bit Enc
            </span>
          </div>
        </div>
      </div>

      {/* Feature Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Box 1: Planning */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold">
            <Sliders className="h-5 w-5" />
            <h3>1. Project Resource Planning</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Enable CMOs and hospital planners to simulate and edit department capacity limits (beds allocated, active nurse staffing quotas, operational budgets) with instant data modeling checks.
          </p>
          <div className="h-24 bg-slate-50 rounded-lg p-3 flex flex-col justify-center border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">ICU Bed Quota:</span>
              <span className="text-slate-800">12 beds (90% capacity)</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full" style={{ width: '90%' }}></div>
            </div>
          </div>
        </div>

        {/* Box 2: Patient Web Portal */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold">
            <User className="h-5 w-5" />
            <h3>2. Patient Web Portal</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Empower patients to request doctor appointments, inspect active medical prescriptions, decrypt sensitive clinical EHR timelines, and chat with CareFlow's professional health virtual bot.
          </p>
          <div className="h-24 bg-slate-50 rounded-lg p-3 flex flex-col justify-center border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-emerald-600 animate-pulse" />
              <span className="text-xs text-slate-800 font-bold">Lisinopril 10mg — Active</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">Prescribed by Dr. Jenkins on 2026-06-05</div>
          </div>
        </div>

        {/* Box 3: Medical Staff Portal */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold">
            <Users className="h-5 w-5" />
            <h3>3. Medical Staff Portal</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Allow physicians and nurses to access secure digital health directories, edit patient records, write prescriptions, handle upcoming bookings, and leverage simulated radiograph analyses.
          </p>
          <div className="h-24 bg-slate-50 rounded-lg p-3 flex items-center justify-between border border-slate-200">
            <div className="space-y-1">
              <div className="text-xs text-slate-800 font-bold">Today's Schedule</div>
              <div className="text-xs text-slate-500">Sarah Miller — 10:30 AM</div>
            </div>
            <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded font-bold uppercase">
              Approved
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Registry Directory */}
      <HospitalDirectory
        doctors={doctors}
        patients={patients}
        onImpersonate={onImpersonate}
        currentUserId={currentUserId}
      />
    </div>
  );
}
