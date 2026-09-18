/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { User, Heart, Calendar, Pill, Shield, Lock, RefreshCw, Brain, Send, Activity, PlusCircle, FileText } from 'lucide-react';
import { Patient, Doctor, Appointment, Message } from '../types';
import VitalsHistory, { VitalLog } from './VitalsHistory';
import Vitals30Days from './Vitals30Days';

interface PatientPortalProps {
  currentUser: {
    id: string;
    username: string;
    role: 'admin' | 'doctor' | 'patient';
    name: string;
    title: string;
    patientId: string | null;
    doctorId: string | null;
  };
  appointments: Appointment[];
  doctors: Doctor[];
  patients: Patient[];
  activePatientSubTab: 'dashboard' | 'book' | 'records' | 'chat';
  setActivePatientSubTab: (tab: 'dashboard' | 'book' | 'records' | 'chat') => void;
  selectedDept: string;
  setSelectedDept: (dept: string) => void;
  selectedDoctorId: string;
  setSelectedDoctorId: (id: string) => void;
  bookingDate: string;
  setBookingDate: (date: string) => void;
  bookingTime: string;
  setBookingTime: (time: string) => void;
  bookingReason: string;
  setBookingReason: (reason: string) => void;
  bookingUrgency: 'Routine' | 'Urgent' | 'Emergency';
  setBookingUrgency: (urgency: 'Routine' | 'Urgent' | 'Emergency') => void;
  handleBookAppointment: (e: React.FormEvent) => Promise<void>;
  ehrDecrypted: boolean;
  decrypting: boolean;
  handleDecryptEHR: () => void;
  chatMessages: Message[];
  patientChatInput: string;
  setPatientChatInput: (input: string) => void;
  handleSendChatMessage: (e: React.FormEvent) => Promise<void>;
  sendingChatMessage: boolean;
  isLoading: boolean;
}

export default function PatientPortal({
  currentUser,
  appointments,
  doctors,
  patients,
  activePatientSubTab,
  setActivePatientSubTab,
  selectedDept,
  setSelectedDept,
  selectedDoctorId,
  setSelectedDoctorId,
  bookingDate,
  setBookingDate,
  bookingTime,
  setBookingTime,
  bookingReason,
  setBookingReason,
  bookingUrgency,
  setBookingUrgency,
  handleBookAppointment,
  ehrDecrypted,
  decrypting,
  handleDecryptEHR,
  chatMessages,
  patientChatInput,
  setPatientChatInput,
  handleSendChatMessage,
  sendingChatMessage,
  isLoading,
}: PatientPortalProps) {
  const localChatEndRef = useRef<HTMLDivElement>(null);

  // Vital sign history records for patients (mocked & fully interactive)
  const [vitalsData, setVitalsData] = useState<Record<string, VitalLog[]>>({
    'p-101': [
      { date: '06-15', systolic: 130, diastolic: 85, heartRate: 72 },
      { date: '06-22', systolic: 128, diastolic: 82, heartRate: 70 },
      { date: '06-29', systolic: 124, diastolic: 80, heartRate: 68 },
      { date: '07-06', systolic: 122, diastolic: 78, heartRate: 66 },
      { date: '07-13', systolic: 119, diastolic: 77, heartRate: 65 },
      { date: '07-17', systolic: 118, diastolic: 76, heartRate: 64 },
    ],
    'p-102': [
      { date: '06-15', systolic: 126, diastolic: 82, heartRate: 78 },
      { date: '06-22', systolic: 124, diastolic: 80, heartRate: 75 },
      { date: '06-29', systolic: 122, diastolic: 79, heartRate: 74 },
      { date: '07-06', systolic: 120, diastolic: 78, heartRate: 72 },
      { date: '07-13', systolic: 122, diastolic: 80, heartRate: 73 },
      { date: '07-17', systolic: 121, diastolic: 79, heartRate: 70 },
    ],
    'p-103': [
      { date: '06-15', systolic: 105, diastolic: 68, heartRate: 85 },
      { date: '06-22', systolic: 102, diastolic: 65, heartRate: 82 },
      { date: '06-29', systolic: 104, diastolic: 66, heartRate: 84 },
      { date: '07-06', systolic: 100, diastolic: 62, heartRate: 80 },
      { date: '07-13', systolic: 98, diastolic: 60, heartRate: 78 },
      { date: '07-17', systolic: 102, diastolic: 64, heartRate: 80 },
    ],
  });

  const [activeChartTab, setActiveChartTab] = useState<'bp' | 'hr' | 'all'>('all');
  const [newSystolic, setNewSystolic] = useState<number>(120);
  const [newDiastolic, setNewDiastolic] = useState<number>(80);
  const [newHeartRate, setNewHeartRate] = useState<number>(72);
  const [newVitalDate, setNewVitalDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  });
  const [isAddingLog, setIsAddingLog] = useState<boolean>(false);
  const [localSuccess, setLocalSuccess] = useState<string>('');
  const [summaryPreviewId, setSummaryPreviewId] = useState<string | null>(null);

  const handleAddVitalLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSystolic || !newDiastolic || !newHeartRate || !newVitalDate) {
      return;
    }

    const parts = newVitalDate.split('-');
    const formattedDate = parts.length === 3 ? `${parts[1]}-${parts[2]}` : newVitalDate;
    const patientId = currentUser.patientId || 'p-101';
    const newEntry: VitalLog = {
      date: formattedDate,
      systolic: Number(newSystolic),
      diastolic: Number(newDiastolic),
      heartRate: Number(newHeartRate),
    };

    setVitalsData((prev) => ({
      ...prev,
      [patientId]: [...(prev[patientId] || []), newEntry],
    }));

    setLocalSuccess('Biometric health vitals successfully added to secure ledger.');
    setTimeout(() => setLocalSuccess(''), 4000);
    setIsAddingLog(false);
  };

  const activePatientId = currentUser.patientId || 'p-101';
  const activeVitals = vitalsData[activePatientId] || [];
  const latestVital = activeVitals[activeVitals.length - 1] || {
    systolic: 120,
    diastolic: 80,
    heartRate: 72,
  };

  useEffect(() => {
    if (activePatientId && !vitalsData[activePatientId]) {
      const initialLogs: VitalLog[] = [
        { date: '06-15', systolic: 118 + Math.floor(Math.random() * 12), diastolic: 76 + Math.floor(Math.random() * 8), heartRate: 68 + Math.floor(Math.random() * 12) },
        { date: '06-22', systolic: 120 + Math.floor(Math.random() * 12), diastolic: 75 + Math.floor(Math.random() * 8), heartRate: 70 + Math.floor(Math.random() * 12) },
        { date: '06-29', systolic: 122 + Math.floor(Math.random() * 12), diastolic: 78 + Math.floor(Math.random() * 8), heartRate: 72 + Math.floor(Math.random() * 12) },
        { date: '07-06', systolic: 119 + Math.floor(Math.random() * 10), diastolic: 74 + Math.floor(Math.random() * 8), heartRate: 67 + Math.floor(Math.random() * 12) },
        { date: '07-13', systolic: 121 + Math.floor(Math.random() * 10), diastolic: 76 + Math.floor(Math.random() * 8), heartRate: 69 + Math.floor(Math.random() * 12) },
        { date: '07-17', systolic: 117 + Math.floor(Math.random() * 8),  diastolic: 73 + Math.floor(Math.random() * 6), heartRate: 66 + Math.floor(Math.random() * 10) },
      ];
      setVitalsData(prev => {
        if (prev[activePatientId]) return prev;
        return {
          ...prev,
          [activePatientId]: initialLogs
        };
      });
    }
  }, [activePatientId]);

  useEffect(() => {
    localChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, sendingChatMessage]);

  return (
    <div id="view-patient" className="space-y-6 animate-fadeIn">
      {/* Header section with patient info and menu */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-4 z-10">
          <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
            {/* Pulsing visual aura */}
            <div className="absolute inset-0 bg-indigo-400 rounded-full opacity-15 animate-ping"></div>
            {/* Double-layered gradient border ring */}
            <div className="absolute inset-0.5 bg-gradient-to-tr from-indigo-600 to-cyan-400 rounded-full p-0.5">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 text-white flex items-center justify-center shadow-md shadow-indigo-100">
                  <User className="h-5 w-5" />
                </div>
              </div>
            </div>
            {/* Mini security badging icon */}
            <div className="absolute -bottom-0.5 -right-0.5 bg-indigo-600 border border-white text-white rounded-full p-1 shadow-md">
              <Shield className="h-2.5 w-2.5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {currentUser.name} <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full font-bold font-mono">Patient File: {currentUser.patientId}</span>
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Active Plan: Hypertension & Cardiac Wellness Care
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            id="p-subtab-btn-dash"
            onClick={() => setActivePatientSubTab('dashboard')}
            className={`text-xs px-3 py-2 rounded-md font-semibold transition ${
              activePatientSubTab === 'dashboard'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            My Dashboard
          </button>
          <button
            id="p-subtab-btn-book"
            onClick={() => setActivePatientSubTab('book')}
            className={`text-xs px-3 py-2 rounded-md font-semibold transition ${
              activePatientSubTab === 'book'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Book Appointment
          </button>
          <button
            id="p-subtab-btn-records"
            onClick={() => setActivePatientSubTab('records')}
            className={`text-xs px-3 py-2 rounded-md font-semibold transition ${
              activePatientSubTab === 'records'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            EHR Medical Records
          </button>
          <button
            id="p-subtab-btn-chat"
            onClick={() => setActivePatientSubTab('chat')}
            className={`text-xs px-3 py-2 rounded-md font-semibold transition ${
              activePatientSubTab === 'chat'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Support Assistant
          </button>
        </div>
      </div>

      {/* SUB-TAB: Dashboard */}
      {activePatientSubTab === 'dashboard' && (
        <div id="patient-sub-dash" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Welcome and Quick Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Heart className="h-5 w-5 text-indigo-600" />
                Wellness Health Brief
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                Your treatment targets are progressing well. Your blood pressure metrics have remained stabilized under current dietary controls and medication prescription records.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-inner">
                  <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Blood Pressure</span>
                  <span className="text-xl font-bold text-slate-900 block mt-1">
                    {latestVital.systolic}/{latestVital.diastolic} mmHg
                  </span>
                  {latestVital.systolic >= 140 || latestVital.diastolic >= 90 ? (
                    <span className="text-[10px] bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded-md block mt-2 w-max font-semibold">
                      Hypertension Stage 2
                    </span>
                  ) : latestVital.systolic >= 130 || latestVital.diastolic >= 80 ? (
                    <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-md block mt-2 w-max font-semibold">
                      Hypertension Stage 1
                    </span>
                  ) : latestVital.systolic >= 120 ? (
                    <span className="text-[10px] bg-yellow-50 border border-yellow-200 text-yellow-700 px-2 py-0.5 rounded-md block mt-2 w-max font-semibold">
                      Elevated
                    </span>
                  ) : (
                    <span className="text-[10px] bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-md block mt-2 w-max font-semibold">
                      Optimal Range
                    </span>
                  )}
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-inner">
                  <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Heart Rate (Resting)</span>
                  <span className="text-xl font-bold text-slate-900 block mt-1">
                    {latestVital.heartRate} bpm
                  </span>
                  {latestVital.heartRate > 100 ? (
                    <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-md block mt-2 w-max font-semibold">
                      Tachycardia
                    </span>
                  ) : latestVital.heartRate < 60 ? (
                    <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-md block mt-2 w-max font-semibold">
                      Bradycardia
                    </span>
                  ) : (
                    <span className="text-[10px] bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-md block mt-2 w-max font-semibold">
                      Normal
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Health Vitals Trend Chart Card */}
            <VitalsHistory
              activeVitals={activeVitals}
              activeChartTab={activeChartTab}
              setActiveChartTab={setActiveChartTab}
              isAddingLog={isAddingLog}
              setIsAddingLog={setIsAddingLog}
              newSystolic={newSystolic}
              setNewSystolic={setNewSystolic}
              newDiastolic={newDiastolic}
              setNewDiastolic={setNewDiastolic}
              newHeartRate={newHeartRate}
              setNewHeartRate={setNewHeartRate}
              newVitalDate={newVitalDate}
              setNewVitalDate={setNewVitalDate}
              handleAddVitalLog={handleAddVitalLog}
              localSuccess={localSuccess}
            />

            {/* 30-Day Vitals Trend Section */}
            <Vitals30Days patientId={activePatientId} />

            {/* Scheduled Appointments List */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900">My Appointments</h3>
              <div className="space-y-3">
                {appointments.filter((a) => a.patientId === currentUser.patientId).length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">You have no scheduled appointments currently.</p>
                ) : (
                  appointments
                    .filter((a) => a.patientId === currentUser.patientId)
                    .map((apt) => (
                      <div
                        key={apt.id}
                        className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="font-bold text-slate-850">{apt.doctorName}</div>
                          <div className="text-xs text-slate-500 mt-0.5 font-medium">
                            {apt.department} • {apt.date} at {apt.time}
                          </div>
                          <div className="text-xs text-slate-600 mt-2 italic">"{apt.reason}"</div>
                        </div>
                        <span
                          className={`text-xs font-bold uppercase px-3 py-1 rounded-md border ${
                            apt.status === 'Approved'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : apt.status === 'Cancelled'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Active Medications */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Pill className="h-5 w-5 text-indigo-600" />
                Active Prescriptions
              </h3>
              <div className="space-y-3">
                {patients
                  .find((p) => p.id === currentUser.patientId)
                  ?.prescriptions.map((rx) => (
                    <div key={rx.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 shadow-inner">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-800">{rx.medication}</span>
                        <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md font-semibold">
                          {rx.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{rx.dosage}</p>
                      <div className="border-t border-slate-200 pt-2 flex justify-between text-[10px] text-slate-500 font-mono font-medium">
                        <span>Physician: {rx.doctor}</span>
                        <span>Refills Left: {rx.refills}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: Book Appointment */}
      {activePatientSubTab === 'book' && (
        <div id="patient-sub-book" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Appointment Booking Intake
            </h3>
            <p className="text-xs text-slate-500 mt-1">Submit your specialty consult request. Records are encrypted upon entry.</p>
          </div>

          <form onSubmit={handleBookAppointment} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold uppercase">Clinical Department</label>
                <select
                  id="book-dept-select"
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value);
                    const matchingDocs = doctors.filter((d) => d.department === e.target.value);
                    if (matchingDocs.length > 0) setSelectedDoctorId(matchingDocs[0].id);
                  }}
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Neurology">Neurology</option>
                  <option value="General Medicine">General Medicine</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold uppercase">Assigned Physician</label>
                <select
                  id="book-doc-select"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
                >
                  {doctors
                    .filter((d) => d.department === selectedDept)
                    .map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.specialization})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold uppercase">Preferred Date</label>
                <input
                  id="book-date-input"
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold uppercase">Available Time Slot</label>
                <select
                  id="book-time-select"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {doctors.find((d) => d.id === selectedDoctorId)?.slots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  )) || (
                    <>
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="02:00 PM">02:00 PM</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-bold uppercase">Clinical Urgency / Triage Level</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'Routine', label: 'Routine', desc: 'Standard checkup', activeColor: 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/40 text-blue-800' },
                  { value: 'Urgent', label: 'Urgent', desc: 'Acute symptoms', activeColor: 'border-amber-500 ring-1 ring-amber-500 bg-amber-50/40 text-amber-800' },
                  { value: 'Emergency', label: 'Emergency', desc: 'Immediate care', activeColor: 'border-red-500 ring-1 ring-red-500 bg-red-50/40 text-red-800' }
                ].map((option) => {
                  const isActive = bookingUrgency === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setBookingUrgency(option.value as any)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer text-slate-700 bg-slate-50 ${
                        isActive ? option.activeColor : 'border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-extrabold text-xs">{option.label}</div>
                      <div className="text-[9px] text-slate-500 font-medium mt-0.5 leading-tight">{option.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-bold uppercase">Reason for Consultation</label>
              <textarea
                id="book-reason-input"
                value={bookingReason}
                onChange={(e) => setBookingReason(e.target.value)}
                placeholder="Please specify medical symptoms, questions, or clinical reasons..."
                rows={3}
                className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-450"
                required
              />
            </div>

            <button
              id="book-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm shadow-indigo-100 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Confirm Secure Booking Request'}
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB: EHR Records */}
      {activePatientSubTab === 'records' && (
        <div id="patient-sub-records" className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-600" />
                  Electronic Health Record (EHR) Ledger
                </h3>
                <p className="text-xs text-slate-500 mt-1">Medical files are protected using end-to-end symmetric encryption keys.</p>
              </div>

              {!ehrDecrypted && (
                <button
                  id="decrypt-ehr-btn"
                  onClick={handleDecryptEHR}
                  disabled={decrypting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-indigo-100 cursor-pointer"
                >
                  {decrypting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                  {decrypting ? 'Decrypting...' : 'Decrypt Health Records'}
                </button>
              )}
            </div>

            {!ehrDecrypted ? (
              <div className="bg-slate-50 rounded-lg p-8 border border-slate-200 flex flex-col items-center justify-center text-center space-y-4 shadow-inner">
                <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center text-amber-500 border border-slate-200 shadow-sm">
                  <Lock className="h-7 w-7 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800">Patient Data Encrypted</h4>
                  <p className="text-xs text-slate-500 max-w-md">
                    To inspect past diagnoses, treatment notes, and physician commentary, please initiate cryptographical authentication check.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-sans border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs text-slate-500 block font-sans font-medium">Full Name:</span>
                    <span className="text-slate-900 font-bold">{currentUser.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-sans font-medium">Gender & Age:</span>
                    <span className="text-slate-900 font-bold">Female, 34 yrs</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-sans font-medium">Blood Type:</span>
                    <span className="text-indigo-600 font-extrabold">A+ (Rh Positive)</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-sans font-medium">Allergies:</span>
                    <span className="text-red-600 font-bold">Penicillin, Peanuts</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm uppercase tracking-wider text-slate-500 font-bold">Clinical Case History Timeline</h4>
                  <div className="border-l-2 border-slate-200 pl-4 ml-2 space-y-6">
                    {patients
                      .find((p) => p.id === currentUser.patientId)
                      ?.medicalHistory.map((history, index) => (
                        <div key={index} className="relative space-y-1.5 bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                          <span className="absolute -left-[23px] top-4 h-3.5 w-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-sm"></span>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-slate-500 font-semibold">{history.date}</span>
                            <span className="text-indigo-600 font-bold">• Diagnosed by {history.doctor}</span>
                          </div>
                          <h5 className="font-bold text-slate-900 text-sm">{history.condition}</h5>
                          <p className="text-xs text-slate-600 leading-relaxed">{history.notes}</p>
                          <span className="inline-block text-[10px] bg-white border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-md font-bold shadow-sm">
                            Status: {history.status}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Patient's Signed Discharge Summaries */}
                <div className="space-y-4 border-t border-slate-100 pt-6">
                  <h4 className="text-sm uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    Issued Clinical Discharge Certificates
                  </h4>
                  {(() => {
                    const patientObj = patients.find((p) => p.id === currentUser.patientId);
                    const signedSummaries = patientObj?.dischargeSummaries?.filter((s) => s.status === 'Signed') || [];
                    
                    if (signedSummaries.length === 0) {
                      return (
                        <div className="text-center py-6 text-xs text-slate-400 italic border border-dashed border-slate-200 rounded-lg bg-slate-50/50 font-medium font-sans">
                          No official discharge summaries have been issued by your attending physicians yet.
                        </div>
                      );
                    }
                    
                    return (
                      <div className="grid grid-cols-1 gap-3">
                        {signedSummaries.map((summary) => (
                          <div key={summary.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:bg-slate-100/70">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-slate-800">Certified Discharge Certificate</span>
                                <span className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded font-black uppercase flex items-center gap-0.5">
                                  ✓ Signed & Verified
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1 font-mono font-semibold">
                                DATE ISSUED: {summary.date} • ATTENDING PHYSICIAN: {summary.doctorName}
                              </div>
                              {summary.diagnoses && (
                                <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-1 font-medium font-sans">
                                  <strong className="text-slate-700 font-bold">Diagnosis:</strong> {summary.diagnoses}
                                </p>
                              )}
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => setSummaryPreviewId(summary.id)}
                              className="bg-white border border-slate-200 hover:bg-indigo-50 text-indigo-600 text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer whitespace-nowrap"
                            >
                              🔍 View & Print Certificate
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Printable Certificate Modal for Patient */}
                {summaryPreviewId && (() => {
                  const patientObj = patients.find((p) => p.id === currentUser.patientId);
                  const previewSummary = patientObj?.dischargeSummaries?.find((s) => s.id === summaryPreviewId);
                  if (!previewSummary) return null;
                  return (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col border border-slate-200">
                        {/* Modal Header */}
                        <div className="border-b border-slate-100 p-4 flex justify-between items-center bg-slate-50">
                          <span className="text-xs uppercase font-extrabold text-slate-500 tracking-wider font-mono">CERTIFIED RELEASE DOCUMENT</span>
                          <button
                            type="button"
                            onClick={() => setSummaryPreviewId(null)}
                            className="text-slate-400 hover:text-slate-600 transition font-black text-sm p-1.5 hover:bg-slate-200/50 rounded-lg cursor-pointer"
                          >
                            ✕ Close
                          </button>
                        </div>

                        {/* Official Sheet */}
                        <div id="patient-discharge-printable-sheet" className="p-8 space-y-6 bg-white flex-grow font-sans text-slate-800 font-medium">
                          {/* Letterhead */}
                          <div className="border-b-4 border-double border-indigo-900 pb-5 flex justify-between items-start">
                            <div>
                              <h2 className="text-xl font-black text-indigo-950 uppercase tracking-tight">CareFlow General Hospital</h2>
                              <p className="text-[10px] text-slate-400 font-mono font-bold mt-1 uppercase">100 Hospital Drive • Informatics Wing • Sec: 409-E</p>
                              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">HIPAA Compliant Electronic Discharge Summaries</p>
                            </div>
                            <div className="text-right">
                              <span className="inline-block text-[10px] font-extrabold bg-indigo-50 border border-indigo-200 text-indigo-800 px-3 py-1 rounded uppercase tracking-wider shadow-sm">
                                Official Release Certificate
                              </span>
                              <div className="text-[10px] font-mono text-slate-400 mt-1.5 font-bold">DOC REF: {previewSummary.id}</div>
                            </div>
                          </div>

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                              <span className="text-9xl font-black text-indigo-900 rotate-12">CAREFLOW</span>
                            </div>

                            {/* Info */}
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-150 text-xs">
                              <div>
                                <span className="text-slate-400 uppercase font-black tracking-wider text-[9px] block">Discharge Patient</span>
                                <span className="font-extrabold text-sm text-slate-800 mt-0.5 block">{patientObj?.name}</span>
                                <span className="text-slate-500 block mt-1 font-medium">Age: {patientObj?.age} yrs • Blood Class: {patientObj?.bloodType}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 uppercase font-black tracking-wider text-[9px] block">Attending Physician</span>
                                <span className="font-extrabold text-sm text-slate-800 mt-0.5 block">{previewSummary.doctorName}</span>
                                <span className="text-slate-500 block mt-1 font-medium">Discharge Date: {previewSummary.date}</span>
                              </div>
                            </div>

                            {/* Body */}
                            <div className="space-y-5 pt-4 font-sans">
                              <div className="space-y-1.5 font-sans">
                                <h4 className="text-xs uppercase font-black tracking-wider text-slate-500 border-b border-slate-100 pb-1 flex items-center gap-1">
                                  <span>Ⅰ.</span> Clinical Diagnosis Summary
                                </h4>
                                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium bg-slate-50/40 p-2.5 rounded border border-slate-100">
                                  {previewSummary.diagnoses || "No explicit diagnostic text compiled."}
                                </p>
                              </div>

                              <div className="space-y-1.5 font-sans">
                                <h4 className="text-xs uppercase font-black tracking-wider text-slate-500 border-b border-slate-100 pb-1 flex items-center gap-1">
                                  <span>Ⅱ.</span> Continuing Medication Regime
                                </h4>
                                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium bg-slate-50/40 p-2.5 rounded border border-slate-100">
                                  {previewSummary.medications || "No post-discharge medicine prescribed."}
                                </p>
                              </div>

                              <div className="space-y-1.5 font-sans">
                                <h4 className="text-xs uppercase font-black tracking-wider text-slate-500 border-b border-slate-100 pb-1 flex items-center gap-1">
                                  <span>Ⅲ.</span> Convalescence instructions & Warning Directives
                                </h4>
                                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium bg-slate-50/40 p-2.5 rounded border border-slate-100 font-sans">
                                  {previewSummary.recoveryNotes || "Standard convalescence protocols apply."}
                                </p>
                              </div>
                            </div>

                            {/* Sign-off */}
                            <div className="border-t border-slate-200 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-sans">Security & Compliance Verify</span>
                                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[9px] font-bold">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500 block animate-pulse"></span>
                                  <span>SECURE LEDGER RECORD SYNC</span>
                                </div>
                                <p className="text-[8.5px] text-slate-400 font-mono max-w-[280px] leading-relaxed">
                                  The contents of this document have been cryptographically serialized into the CareFlow SHA-256 database. Signature verified on release.
                                </p>
                              </div>

                              <div className="text-right space-y-1">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider font-sans">Certified Electronic Signature</span>
                                <div className="py-1 px-4 bg-indigo-50/40 border border-indigo-100 rounded inline-block">
                                  <span className="font-serif italic text-xl text-indigo-700 tracking-wide font-medium">
                                    {previewSummary.signature || "Clinician Witness Required"}
                                  </span>
                                </div>
                                <div className="text-[9px] text-slate-400 font-mono font-semibold">
                                  Signed at: {new Date(previewSummary.signedAt || previewSummary.date).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              window.print();
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-50"
                          >
                            Print Certificate
                          </button>
                          <button
                            type="button"
                            onClick={() => setSummaryPreviewId(null)}
                            className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB: Interactive Support Assistant */}
      {activePatientSubTab === 'chat' && (
        <div id="patient-sub-chat" className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[520px] shadow-sm">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-600" />
              <div>
                <span className="text-sm font-bold text-slate-900">CareFlow Virtual Health Assistant</span>
                <span className="text-[10px] text-slate-500 block font-mono">Powered by CareFlow Intelligence Engine</span>
              </div>
            </div>
            <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
              AI Support Live
            </span>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-xl p-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white font-medium rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {sendingChatMessage && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-500 border border-slate-200 rounded-xl rounded-tl-none p-3 text-xs flex items-center gap-1.5 font-sans font-medium shadow-sm">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                  AI is compiling clinical guidance response...
                </div>
              </div>
            )}
            <div ref={localChatEndRef}></div>
          </div>

          <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2">
            <input
              id="p-chat-input"
              type="text"
              value={patientChatInput}
              onChange={(e) => setPatientChatInput(e.target.value)}
              placeholder="Ask about hospital schedules, symptoms, or clinical services..."
              className="flex-grow bg-white border border-slate-200 text-sm p-2.5 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400 font-sans"
              disabled={sendingChatMessage}
            />
            <button
              id="p-chat-send-btn"
              type="submit"
              disabled={sendingChatMessage}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg font-bold transition flex items-center justify-center disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
