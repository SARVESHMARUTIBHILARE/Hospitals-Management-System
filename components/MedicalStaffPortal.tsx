/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserCheck, Clock, FileText, Plus, Pill, ChevronRight, Activity, Brain, RefreshCw, Filter, PhoneCall, CheckCircle2, Building2, Search, ArrowUpDown, AlertTriangle, Download } from 'lucide-react';
import { Patient, Doctor, Appointment } from '../types';
import HospitalDirectory from './HospitalDirectory';
import { searchMedicineDatabase, TOTAL_COMBINATIONS, Medicine, getMedicineByIndex } from '../utils/medicineDatabase';
import EHRVitals from './EHRVitals';

interface MedicalStaffPortalProps {
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
  activeStaffSubTab: 'dashboard' | 'patients' | 'roster' | 'diagnostics' | 'registry';
  setActiveStaffSubTab: (tab: 'dashboard' | 'patients' | 'roster' | 'diagnostics' | 'registry') => void;
  handleUpdateAppointmentStatus: (appointmentId: string, status: string) => Promise<void>;
  selectedDirectoryPatientId: string;
  setSelectedDirectoryPatientId: (id: string) => void;
  newDiagnosisCondition: string;
  setNewDiagnosisCondition: (condition: string) => void;
  newDiagnosisNotes: string;
  setNewDiagnosisNotes: (notes: string) => void;
  handleAddDiagnosis: (e: React.FormEvent) => Promise<void>;
  newMedicationName: string;
  setNewMedicationName: (name: string) => void;
  newMedicationDosage: string;
  setNewMedicationDosage: (dosage: string) => void;
  newMedicationRefills: number;
  setNewMedicationRefills: (refills: number) => void;
  handleAddPrescription: (e: React.FormEvent) => Promise<void>;
  diagnosticImage: string | null;
  setDiagnosticImage: (img: string | null) => void;
  analyzingImage: boolean;
  imageAnalysisResult: string;
  handleUploadDiagnosticImageMock: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAnalyzeDiagnosticImage: () => void;
  onRefreshData?: () => Promise<void>;
  onImpersonate?: (type: 'doctor' | 'patient', id: string) => void;
  currentUserId?: string;
}

const formatRelativeTime = (timestampMs: number): string => {
  const diffSec = Math.floor((Date.now() - timestampMs) / 1000);
  if (diffSec < 0) return "Pending";
  if (diffSec < 5) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
};

export default function MedicalStaffPortal({
  currentUser,
  appointments,
  doctors,
  patients,
  activeStaffSubTab,
  setActiveStaffSubTab,
  handleUpdateAppointmentStatus,
  selectedDirectoryPatientId,
  setSelectedDirectoryPatientId,
  newDiagnosisCondition,
  setNewDiagnosisCondition,
  newDiagnosisNotes,
  setNewDiagnosisNotes,
  handleAddDiagnosis,
  newMedicationName,
  setNewMedicationName,
  newMedicationDosage,
  setNewMedicationDosage,
  newMedicationRefills,
  setNewMedicationRefills,
  handleAddPrescription,
  diagnosticImage,
  setDiagnosticImage,
  analyzingImage,
  imageAnalysisResult,
  handleUploadDiagnosticImageMock,
  handleAnalyzeDiagnosticImage,
  onRefreshData,
  onImpersonate,
  currentUserId,
}: MedicalStaffPortalProps) {
  // Roster Filter State
  const [rosterDeptFilter, setRosterDeptFilter] = useState<'current' | 'all'>('current');
  const [rosterStatusFilter, setRosterStatusFilter] = useState<'all' | 'available' | 'on-call'>('all');

  // Physician Shift history state and form fields
  const [shiftLogs, setShiftLogs] = useState([
    { id: 'shift-1', doctorName: 'Dr. Sarah Jenkins', department: 'Cardiology', date: '2026-07-13', day: 'Monday', shiftTime: '08:00 AM - 04:00 PM', hours: 8.0, status: 'Completed', checkIn: '07:54 AM', checkOut: '04:05 PM' },
    { id: 'shift-2', doctorName: 'Dr. Michael Chang', department: 'Pediatrics', date: '2026-07-13', day: 'Monday', shiftTime: '04:00 PM - 12:00 AM', hours: 8.0, status: 'Completed', checkIn: '03:50 PM', checkOut: '12:02 AM' },
    { id: 'shift-3', doctorName: 'Dr. Emily Vance', department: 'Neurology', date: '2026-07-14', day: 'Tuesday', shiftTime: '08:00 AM - 04:00 PM', hours: 8.0, status: 'Completed', checkIn: '07:58 AM', checkOut: '04:00 PM' },
    { id: 'shift-4', doctorName: 'Dr. Sarah Jenkins', department: 'Cardiology', date: '2026-07-14', day: 'Tuesday', shiftTime: '04:00 PM - 12:00 AM', hours: 8.0, status: 'Completed', checkIn: '03:52 PM', checkOut: '12:05 AM' },
    { id: 'shift-5', doctorName: 'Dr. Gregory House', department: 'General Medicine', date: '2026-07-15', day: 'Wednesday', shiftTime: '08:00 AM - 04:00 PM', hours: 8.0, status: 'Completed', checkIn: '08:05 AM', checkOut: '04:00 PM' },
    { id: 'shift-6', doctorName: 'Dr. Emily Vance', department: 'Neurology', date: '2026-07-15', day: 'Wednesday', shiftTime: '04:00 PM - 12:00 AM', hours: 8.0, status: 'Completed', checkIn: '03:59 PM', checkOut: '12:01 AM' },
    { id: 'shift-7', doctorName: 'Dr. Michael Chang', department: 'Pediatrics', date: '2026-07-16', day: 'Thursday', shiftTime: '08:00 AM - 04:00 PM', hours: 8.0, status: 'Completed', checkIn: '07:45 AM', checkOut: '04:02 PM' },
    { id: 'shift-8', doctorName: 'Dr. Gregory House', department: 'General Medicine', date: '2026-07-16', day: 'Thursday', shiftTime: '04:00 PM - 12:00 AM', hours: 8.0, status: 'Completed', checkIn: '03:55 PM', checkOut: '12:04 AM' },
    { id: 'shift-9', doctorName: 'Dr. Sarah Jenkins', department: 'Cardiology', date: '2026-07-17', day: 'Friday', shiftTime: '08:00 AM - 04:00 PM', hours: 8.0, status: 'Active', checkIn: '07:50 AM', checkOut: '--' },
    { id: 'shift-10', doctorName: 'Dr. Emily Vance', department: 'Neurology', date: '2026-07-17', day: 'Friday', shiftTime: '08:00 AM - 04:00 PM', hours: 8.0, status: 'Active', checkIn: '07:55 AM', checkOut: '--' },
  ]);

  const [newShiftDoctor, setNewShiftDoctor] = useState('Dr. Sarah Jenkins');
  const [newShiftDate, setNewShiftDate] = useState('2026-07-17');
  const [newShiftDay, setNewShiftDay] = useState('Friday');
  const [newShiftTime, setNewShiftTime] = useState('08:00 AM - 04:00 PM');
  const [newShiftHours, setNewShiftHours] = useState(8.0);
  const [newShiftCheckIn, setNewShiftCheckIn] = useState('08:00 AM');
  const [newShiftStatus, setNewShiftStatus] = useState('Completed');
  const [shiftSearchTerm, setShiftSearchTerm] = useState('');
  const [isAddingShiftLog, setIsAddingShiftLog] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [rxSearchQuery, setRxSearchQuery] = useState('');
  const [rxCategoryFilter, setRxCategoryFilter] = useState('All');
  const [rxSearchResults, setRxSearchResults] = useState<Medicine[]>([]);

  // Patient Discharge Summary States
  const [dischargeDiagnoses, setDischargeDiagnoses] = useState('');
  const [dischargeMedications, setDischargeMedications] = useState('');
  const [dischargeRecoveryNotes, setDischargeRecoveryNotes] = useState('');
  const [dischargeSignature, setDischargeSignature] = useState('');
  const [dischargeSignatureError, setDischargeSignatureError] = useState(false);
  const [selectedDraftSummaryId, setSelectedDraftSummaryId] = useState<string | null>(null);
  const [submittingSummary, setSubmittingSummary] = useState(false);
  const [summaryPreviewId, setSummaryPreviewId] = useState<string | null>(null);

  useEffect(() => {
    const results = searchMedicineDatabase(rxSearchQuery, rxCategoryFilter, 20);
    setRxSearchResults(results);
  }, [rxSearchQuery, rxCategoryFilter]);

  const downloadPatientsCSV = (patsList: Patient[]) => {
    const headers = ['Patient ID', 'Name', 'Email', 'Phone', 'Age', 'Gender', 'Blood Type', 'Allergies'];
    const rows = patsList.map(p => [
      p.id,
      p.name,
      p.email,
      p.phone,
      p.age.toString(),
      p.gender,
      p.bloodType,
      (p.allergies || []).join('; ')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const strVal = (val || '').toString();
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `patient_registry_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddShiftLog = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = doctors.find(d => d.name === newShiftDoctor) || doctors[0];
    const newLog = {
      id: `shift-${Date.now()}`,
      doctorName: newShiftDoctor,
      department: doc ? doc.department : 'General Medicine',
      date: newShiftDate,
      day: newShiftDay,
      shiftTime: newShiftTime,
      hours: Number(newShiftHours),
      status: newShiftStatus,
      checkIn: newShiftCheckIn,
      checkOut: newShiftStatus === 'Completed' ? '04:00 PM' : '--'
    };
    setShiftLogs(prev => [newLog, ...prev]);
    setIsAddingShiftLog(false);
  };

  // Real-time Waitlist Tracker State
  const [waitlistSortBy, setWaitlistSortBy] = useState<'urgency' | 'timestamp'>('urgency');
  const [waitlistSortOrder, setWaitlistSortOrder] = useState<'asc' | 'desc'>('desc'); // desc: highest urgency first / newest first
  const [waitlistFilterDept, setWaitlistFilterDept] = useState<string>('All');
  const [waitlistFilterUrgency, setWaitlistFilterUrgency] = useState<string>('All');
  const [waitlistSearchTerm, setWaitlistSearchTerm] = useState<string>('');
  
  // Intake Walk-In Simulation State
  const [isSimulatingIntake, setIsSimulatingIntake] = useState<boolean>(false);
  const [autoSimulateWalkins, setAutoSimulateWalkins] = useState<boolean>(false);

  // Auto-simulation trigger hook
  useEffect(() => {
    if (!autoSimulateWalkins) return;

    const interval = setInterval(() => {
      handleSimulateWalkin();
    }, 15000); // Simulate an incoming patient every 15 seconds

    return () => clearInterval(interval);
  }, [autoSimulateWalkins, doctors]);

  const handleSimulateWalkin = async () => {
    if (isSimulatingIntake) return;
    setIsSimulatingIntake(true);

    const mockPatients = [
      { name: "George Bailey", id: "p-103", reason: "Sudden onset chest pressure radiating to left arm", urgency: "Emergency" },
      { name: "Linda Fletcher", id: "p-104", reason: "Severe pediatric asthma flare-up, audible wheezing", urgency: "Emergency" },
      { name: "Arthur Dent", id: "p-105", reason: "Persistent high fever of 103.5F, severe dehydration", urgency: "Urgent" },
      { name: "Zaphod Beeblebrox", id: "p-106", reason: "Acute laceration on forearm with mild persistent bleeding", urgency: "Urgent" },
      { name: "Tricia McMillan", id: "p-107", reason: "Routine diabetic prescription renewal and A1C review", urgency: "Routine" },
      { name: "Ford Prefect", id: "p-108", reason: "Mild muscle strain in lower back, seeking analgesics", urgency: "Routine" },
      { name: "Sarah Miller", id: "p-101", reason: "Heart rate spikes up to 140 bpm, chest pain episodes", urgency: "Emergency" },
      { name: "Michael Chang", id: "p-102", reason: "Severe ear ache, fever 102F, pediatric patient", urgency: "Urgent" },
      { name: "Yvaine Star", id: "p-109", reason: "Suspected hairline fracture in wrist, swelling and soreness", urgency: "Urgent" },
      { name: "Tristan Thorne", id: "p-110", reason: "Persistent sore throat, fever, difficulty swallowing", urgency: "Routine" }
    ];

    const selectedMock = mockPatients[Math.floor(Math.random() * mockPatients.length)];
    const departments = ["Cardiology", "Pediatrics", "Neurology", "General Medicine"];
    const randomDept = departments[Math.floor(Math.random() * departments.length)];
    const deptDocs = doctors.filter(d => d.department === randomDept);
    const assignedDoc = deptDocs.length > 0 ? deptDocs[Math.floor(Math.random() * deptDocs.length)] : doctors[0];

    const randomTimes = ["09:30 AM", "11:00 AM", "01:15 PM", "02:45 PM", "04:30 PM"];
    const randomTime = randomTimes[Math.floor(Math.random() * randomTimes.length)];

    const payload = {
      patientId: selectedMock.id,
      patientName: selectedMock.name,
      doctorId: assignedDoc ? assignedDoc.id : "d-jenkins",
      doctorName: assignedDoc ? assignedDoc.name : "Dr. Sarah Jenkins",
      department: randomDept,
      date: new Date().toISOString().split("T")[0],
      time: randomTime,
      reason: selectedMock.reason,
      urgency: selectedMock.urgency,
      requestTimestamp: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && onRefreshData) {
        await onRefreshData();
      }
    } catch (e) {
      console.error("Failed to post simulation request", e);
    } finally {
      setIsSimulatingIntake(false);
    }
  };

  const handleUpdateUrgency = async (appointmentId: string, urgency: 'Routine' | 'Urgent' | 'Emergency') => {
    try {
      const res = await fetch('/api/appointments/update-urgency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          urgency,
          updaterName: currentUser.name
        })
      });
      const data = await res.json();
      if (data.success && onRefreshData) {
        await onRefreshData();
      }
    } catch (e) {
      console.error("Failed to update urgency level", e);
    }
  };

  const getAppointmentUrgency = (apt: Appointment): 'Routine' | 'Urgent' | 'Emergency' => {
    if (apt.urgency) return apt.urgency;
    const reason = (apt.reason || '').toLowerCase();
    if (reason.includes('chest') || reason.includes('pain') || reason.includes('heart') || reason.includes('breathing') || reason.includes('severe') || reason.includes('acute') || reason.includes('emergency')) {
      return 'Emergency';
    }
    if (reason.includes('cough') || reason.includes('fever') || reason.includes('injury') || reason.includes('accident') || reason.includes('urgent') || reason.includes('broken')) {
      return 'Urgent';
    }
    return 'Routine';
  };

  const getAppointmentTimestampValue = (apt: Appointment): number => {
    if (apt.requestTimestamp) {
      const parsed = Date.parse(apt.requestTimestamp);
      if (!isNaN(parsed)) return parsed;
    }
    const baseTime = apt.id.replace('apt-', '');
    const parsedId = Number(baseTime);
    if (!isNaN(parsedId) && parsedId > 100000) {
      return parsedId;
    }
    return Date.now() - 3600000 * 4; // 4 hours ago
  };

  const getUrgencyWeight = (urgency: 'Routine' | 'Urgent' | 'Emergency'): number => {
    switch (urgency) {
      case 'Emergency': return 3;
      case 'Urgent': return 2;
      case 'Routine': return 1;
      default: return 1;
    }
  };

  // Helper to dynamically but deterministically calculate available vs on-call status
  const getDoctorStatusOnDay = (docId: string, day: string): 'Available' | 'On-Call' => {
    const charCodeSum = docId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + day.charCodeAt(0);
    return charCodeSum % 2 === 0 ? 'Available' : 'On-Call';
  };

  const currentDept = doctors.find((d) => d.id === currentUser.doctorId)?.department || 'Cardiology';

  const pendingAppointments = appointments.filter(apt => apt.status === 'Pending');

  // Filter waitlist
  const filteredWaitlist = pendingAppointments.filter(apt => {
    const urgency = getAppointmentUrgency(apt);
    const matchesDept = waitlistFilterDept === 'All' || apt.department === waitlistFilterDept;
    const matchesUrgency = waitlistFilterUrgency === 'All' || urgency === waitlistFilterUrgency;
    const matchesSearch = waitlistSearchTerm.trim() === '' || 
      apt.patientName.toLowerCase().includes(waitlistSearchTerm.toLowerCase()) ||
      (apt.reason || '').toLowerCase().includes(waitlistSearchTerm.toLowerCase()) ||
      apt.patientId.toLowerCase().includes(waitlistSearchTerm.toLowerCase());
    return matchesDept && matchesUrgency && matchesSearch;
  });

  // Sort waitlist
  const sortedWaitlist = [...filteredWaitlist].sort((a, b) => {
    if (waitlistSortBy === 'urgency') {
      const weightA = getUrgencyWeight(getAppointmentUrgency(a));
      const weightB = getUrgencyWeight(getAppointmentUrgency(b));
      if (weightA !== weightB) {
        return waitlistSortOrder === 'desc' ? weightB - weightA : weightA - weightB;
      }
    }
    // Secondary or primary sorting by timestamp
    const tsA = getAppointmentTimestampValue(a);
    const tsB = getAppointmentTimestampValue(b);
    return waitlistSortOrder === 'desc' ? tsB - tsA : tsA - tsB;
  });

  return (
    <div id="view-staff" className="space-y-6 animate-fadeIn">
      {/* Header section with doctor details & sub tabs */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-4 z-10">
          <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
            {/* Pulsing visual aura */}
            <div className="absolute inset-0 bg-emerald-400 rounded-full opacity-15 animate-ping"></div>
            {/* Double-layered emerald gradient border ring */}
            <div className="absolute inset-0.5 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-full p-0.5">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-100">
                  <UserCheck className="h-5 w-5" />
                </div>
              </div>
            </div>
            {/* Mini active badge representing on-duty */}
            <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 border-2 border-white w-3.5 h-3.5 rounded-full shadow-md"></div>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {currentUser.name} <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full font-bold">On Duty</span>
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
              Department: {doctors.find((d) => d.id === currentUser.doctorId)?.department || 'Cardiology'} Clinical Lead & Supervisor
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            id="s-subtab-btn-dash"
            onClick={() => setActiveStaffSubTab('dashboard')}
            className={`text-xs px-3 py-2 rounded-md font-semibold transition ${
              activeStaffSubTab === 'dashboard'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Clinical Dashboard
          </button>
          <button
            id="s-subtab-btn-patients"
            onClick={() => setActiveStaffSubTab('patients')}
            className={`text-xs px-3 py-2 rounded-md font-semibold transition ${
              activeStaffSubTab === 'patients'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            EHR Patient Manager
          </button>
          <button
            id="s-subtab-btn-roster"
            onClick={() => setActiveStaffSubTab('roster')}
            className={`text-xs px-3 py-2 rounded-md font-semibold transition ${
              activeStaffSubTab === 'roster'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Roster & Shifts
          </button>
          <button
            id="s-subtab-btn-diag"
            onClick={() => setActiveStaffSubTab('diagnostics')}
            className={`text-xs px-3 py-2 rounded-md font-semibold transition ${
              activeStaffSubTab === 'diagnostics'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            AI Image Diagnostics
          </button>
          <button
            id="s-subtab-btn-registry"
            onClick={() => setActiveStaffSubTab('registry')}
            className={`text-xs px-3 py-2 rounded-md font-semibold transition ${
              activeStaffSubTab === 'registry'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Hospital Registry
          </button>
        </div>
      </div>

      {/* SUB-TAB: Staff Dashboard (Schedule approvals / Real-time Waitlist Tracker) */}
      {activeStaffSubTab === 'dashboard' && (
        <div id="staff-sub-dash" className="space-y-6">
          {/* Real-time Waitlist Statistics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Active Waitlist</span>
                <span className="text-xl font-extrabold text-slate-900 font-sans block mt-0.5">
                  {appointments.filter(a => a.status === 'Pending').length}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-50 text-red-600 animate-pulse">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Emergencies</span>
                <span className="text-xl font-extrabold text-red-600 font-sans block mt-0.5">
                  {appointments.filter(a => a.status === 'Pending' && getAppointmentUrgency(a) === 'Emergency').length}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Urgent Cases</span>
                <span className="text-xl font-extrabold text-amber-600 font-sans block mt-0.5">
                  {appointments.filter(a => a.status === 'Pending' && getAppointmentUrgency(a) === 'Urgent').length}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Routine Checkups</span>
                <span className="text-xl font-extrabold text-blue-600 font-sans block mt-0.5">
                  {appointments.filter(a => a.status === 'Pending' && getAppointmentUrgency(a) === 'Routine').length}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="bg-indigo-950/95 text-white p-5 rounded-xl border border-indigo-900 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold tracking-tight flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                </span>
                Real-time Clinical Intake Simulator
              </h4>
              <p className="text-xs text-indigo-200">Inject simulated live triage requests directly into the database to view sorting reactivity.</p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-center">
              <button
                id="btn-simulate-walkin"
                onClick={handleSimulateWalkin}
                disabled={isSimulatingIntake}
                className="bg-white hover:bg-slate-100 text-slate-900 text-xs px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-55 cursor-pointer"
              >
                {isSimulatingIntake ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-900" /> : <Plus className="h-4 w-4 text-indigo-600" />}
                Simulate Walk-In Intake
              </button>

              <button
                id="btn-toggle-auto-sim"
                onClick={() => setAutoSimulateWalkins(!autoSimulateWalkins)}
                className={`text-xs px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  autoSimulateWalkins 
                    ? 'bg-teal-500/15 border-teal-500 text-teal-300 shadow-inner' 
                    : 'bg-indigo-900/40 border-indigo-800 text-indigo-200 hover:bg-indigo-900/60'
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${autoSimulateWalkins ? 'bg-teal-400 animate-pulse' : 'bg-indigo-400'}`}></div>
                {autoSimulateWalkins ? 'Auto-Intake ACTIVE' : 'Enable Auto-Intake'}
              </button>
            </div>
          </div>

          {/* Main Waitlist Tracker & Filters Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-150 space-y-4 bg-slate-50/40">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-indigo-600" />
                    Clinical Triage & Real-time Waitlist
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Prioritized appointment queue sorted by medical urgency or request arrival timestamp.</p>
                </div>

                {/* Sorting Controls */}
                <div className="flex items-center gap-2 self-start md:self-center">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sort:</span>
                  <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-white shadow-sm">
                    <button
                      id="sort-urgency-btn"
                      onClick={() => setWaitlistSortBy('urgency')}
                      className={`text-[11px] px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                        waitlistSortBy === 'urgency' 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Medical Urgency
                    </button>
                    <button
                      id="sort-timestamp-btn"
                      onClick={() => setWaitlistSortBy('timestamp')}
                      className={`text-[11px] px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                        waitlistSortBy === 'timestamp' 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Timestamp
                    </button>
                  </div>

                  <button
                    id="toggle-sort-order-btn"
                    onClick={() => setWaitlistSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                    className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg bg-white transition text-slate-500 cursor-pointer shadow-sm"
                    title={waitlistSortOrder === 'desc' ? 'High-to-Low' : 'Low-to-High'}
                  >
                    <ArrowUpDown className={`h-4 w-4 transform transition-transform ${waitlistSortOrder === 'asc' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Filters Block */}
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                {/* Search Bar */}
                <div className="relative col-span-1 sm:col-span-1 md:col-span-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-slate-450" />
                  </span>
                  <input
                    type="text"
                    value={waitlistSearchTerm}
                    onChange={(e) => setWaitlistSearchTerm(e.target.value)}
                    placeholder="Search by patient, clinic, reason..."
                    className="w-full bg-white border border-slate-250 pl-9 pr-4 py-2 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* Filter Department */}
                <div className="space-y-0.5">
                  <select
                    id="filter-waitlist-dept"
                    value={waitlistFilterDept}
                    onChange={(e) => setWaitlistFilterDept(e.target.value)}
                    className="w-full bg-white border border-slate-250 px-2.5 py-2 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500 shadow-sm"
                  >
                    <option value="All">All Departments</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Neurology">Neurology</option>
                    <option value="General Medicine">General Medicine</option>
                  </select>
                </div>

                {/* Filter Urgency */}
                <div className="space-y-0.5">
                  <select
                    id="filter-waitlist-urgency"
                    value={waitlistFilterUrgency}
                    onChange={(e) => setWaitlistFilterUrgency(e.target.value)}
                    className="w-full bg-white border border-slate-250 px-2.5 py-2 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500 shadow-sm"
                  >
                    <option value="All">All Urgencies</option>
                    <option value="Emergency">Emergency Only</option>
                    <option value="Urgent">Urgent Only</option>
                    <option value="Routine">Routine Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Waitlist Rows */}
            <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
              {sortedWaitlist.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Clock className="h-8 w-8 text-slate-300 mx-auto animate-pulse" />
                  <p className="text-sm font-medium text-slate-450">No patient appointments in current waitlist.</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">Try resetting filters or simulating an incoming patient walk-in request.</p>
                </div>
              ) : (
                sortedWaitlist.map((apt) => {
                  const urgency = getAppointmentUrgency(apt);
                  const timestampValue = getAppointmentTimestampValue(apt);
                  const relativeTimeText = formatRelativeTime(timestampValue);

                  // Colors based on urgency
                  let badgeStyles = "bg-slate-50 text-slate-700 border-slate-250";
                  let leftBorderStyles = "border-l-4 border-l-slate-300";
                  if (urgency === 'Emergency') {
                    badgeStyles = "bg-red-50 text-red-700 border-red-200 animate-pulse";
                    leftBorderStyles = "border-l-4 border-l-red-500";
                  } else if (urgency === 'Urgent') {
                    badgeStyles = "bg-amber-50 text-amber-700 border-amber-200";
                    leftBorderStyles = "border-l-4 border-l-amber-500";
                  } else if (urgency === 'Routine') {
                    badgeStyles = "bg-blue-50 text-blue-700 border-blue-200";
                    leftBorderStyles = "border-l-4 border-l-blue-500";
                  }

                  return (
                    <div
                      key={apt.id}
                      className={`p-4 hover:bg-slate-50/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${leftBorderStyles}`}
                    >
                      {/* Left: General Patient Information */}
                      <div className="space-y-1.5 flex-grow">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-sm">{apt.patientName}</span>
                          <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-mono font-bold">
                            Ref: {apt.patientId}
                          </span>
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${badgeStyles}`}>
                            {urgency}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                            <Clock className="h-3 w-3" />
                            {relativeTimeText}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 font-medium">
                          <span className="font-semibold text-slate-700">{apt.department}</span> • Assigned Doctor: {apt.doctorName}
                        </div>
                        <div className="text-xs text-slate-600 mt-1 italic font-serif leading-relaxed">
                          "Reason: {apt.reason}"
                        </div>
                      </div>

                      {/* Right: Interactive Urgency Adjuster & Decision Actions */}
                      <div className="flex flex-wrap items-center gap-3 self-end md:self-center">
                        {/* Clinical Triage Re-Assignment Selector */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase">Triage:</span>
                          <select
                            value={urgency}
                            onChange={(e) => handleUpdateUrgency(apt.id, e.target.value as any)}
                            className="bg-white border border-slate-200 hover:border-slate-350 px-2 py-1 rounded-md text-[11px] text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm"
                            title="Re-classify Clinical Urgency"
                          >
                            <option value="Routine">Routine</option>
                            <option value="Urgent">Urgent</option>
                            <option value="Emergency">Emergency</option>
                          </select>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateAppointmentStatus(apt.id, 'Approved')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] px-3.5 py-1.5 rounded-lg font-bold transition shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                            title="Approve / Admit"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateAppointmentStatus(apt.id, 'Cancelled')}
                            className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[11px] px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                            title="Reject Request"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Hospital Registry (All Doctors and Patients names are available) */}
          <div className="pt-4">
            <HospitalDirectory
              doctors={doctors}
              patients={patients}
              onImpersonate={onImpersonate || (() => {})}
              currentUserId={currentUserId || ''}
              onSelectPatient={(id) => {
                setSelectedDirectoryPatientId(id);
                setActiveStaffSubTab('patients');
              }}
              onSelectDoctor={(name) => {
                setShiftSearchTerm(name);
                setRosterDeptFilter('all');
                setActiveStaffSubTab('roster');
              }}
            />
          </div>
        </div>
      )}

      {/* SUB-TAB: EHR Patient Directory & Editor */}
      {activeStaffSubTab === 'patients' && (
        <div id="staff-sub-patients" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Patient List */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3.5 h-max">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">Digital Health Directory</h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                {patients.length} Registered
              </span>
            </div>

            {/* Live Search Filter and Export */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                  placeholder="Search patient names..."
                  className="pl-8 pr-3 py-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={() => {
                  const filteredPats = patients.filter(p => p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()));
                  downloadPatientsCSV(filteredPats);
                }}
                title="Download filtered patient registry as CSV"
                className="bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-100 hover:border-indigo-600 p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>

            {/* Scrollable reduced-height list container */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {(() => {
                const filteredPats = patients.filter(p => p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()));
                
                if (filteredPats.length === 0) {
                  return (
                    <div className="text-center py-8 text-xs text-slate-400 font-semibold italic border border-dashed border-slate-200 rounded-lg">
                      No matches found
                    </div>
                  );
                }

                return filteredPats.map((p) => (
                  <button
                    key={p.id}
                    id={`directory-patient-btn-${p.id}`}
                    onClick={() => setSelectedDirectoryPatientId(p.id)}
                    className={`w-full p-3 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                      selectedDirectoryPatientId === p.id
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-sm text-slate-850">{p.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        {p.age} yrs • Blood: {p.bloodType}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </button>
                ));
              })()}
            </div>
          </div>

          {/* Right Patient EHR Editing Form */}
          <div className="lg:col-span-2 space-y-6">
            {(() => {
              const selectedPat = patients.find((p) => p.id === selectedDirectoryPatientId);
              if (!selectedPat) return <p className="text-sm text-slate-500 py-6 text-center">Please select a patient from the directory.</p>;

              return (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
                  {/* Title Info */}
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-900">Electronic Clinical Chart: {selectedPat.name}</h3>
                    <div className="text-xs font-mono text-slate-500 mt-1 font-semibold">
                      EHR RECORD ID: {selectedPat.id} • ALLERGIES: {selectedPat.allergies.join(', ') || 'No recorded allergies'}
                    </div>
                  </div>

                  {/* Timeline of Clinical Diagnoses */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      Clinical Diagnoses & Followups
                    </h4>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4 max-h-56 overflow-y-auto shadow-inner">
                      {selectedPat.medicalHistory.map((hist, idx) => (
                        <div key={idx} className="border-b border-slate-200/60 pb-3 last:border-0 last:pb-0">
                          <div className="flex justify-between text-xs text-slate-500 font-mono font-medium">
                            <span>
                              {hist.date} • {hist.doctor}
                            </span>
                            <span className="text-indigo-600 uppercase font-bold">{hist.status}</span>
                          </div>
                          <div className="text-sm font-bold text-slate-800 mt-1">{hist.condition}</div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed font-sans">{hist.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vitals Section */}
                  <EHRVitals patientId={selectedPat.id} />

                  {/* Interactive Editor Form 1: Add Diagnosis */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4 shadow-inner">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                      <Plus className="h-4 w-4" /> Record New Clinical Diagnosis
                    </h4>
                    <form onSubmit={handleAddDiagnosis} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        id="staff-diag-condition"
                        type="text"
                        value={newDiagnosisCondition}
                        onChange={(e) => setNewDiagnosisCondition(e.target.value)}
                        placeholder="e.g., Seasonal Asthma Flare-up"
                        className="bg-white border border-slate-200 p-2 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                      />
                      <input
                        id="staff-diag-notes"
                        type="text"
                        value={newDiagnosisNotes}
                        onChange={(e) => setNewDiagnosisNotes(e.target.value)}
                        placeholder="Description of symptoms and treatment directive..."
                        className="bg-white border border-slate-200 p-2 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                      />
                      <button
                        id="staff-diag-submit"
                        type="submit"
                        className="sm:col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded font-bold text-xs transition shadow-sm cursor-pointer"
                      >
                        Write to Secure Medical Ledger
                      </button>
                    </form>
                  </div>

                  {/* Interactive Editor Form 2: Add Medication */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4 shadow-inner">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                      <Pill className="h-4 w-4 shrink-0" /> Create Prescription Ledger
                    </h4>

                    {/* CareFlow Clinical Rx Engine */}
                    <div className="bg-white p-4 rounded-xl border border-indigo-100/80 space-y-3 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-50/50 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                            <Brain className="h-4 w-4 animate-pulse" />
                          </div>
                          <div>
                            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-900 block">CareFlow Drug Search Engine</span>
                            <span className="text-[10px] text-slate-400 font-bold block">Accessing {TOTAL_COMBINATIONS.toLocaleString()} FDA-Listed Formulations</span>
                          </div>
                        </div>
                        
                        {/* Random Suggestion Generator */}
                        <button
                          type="button"
                          onClick={() => {
                            const randomIndex = Math.floor(Math.random() * TOTAL_COMBINATIONS);
                            const randomMed = getMedicineByIndex(randomIndex);
                            setNewMedicationName(`${randomMed.name} ${randomMed.strength} (${randomMed.form})`);
                            setNewMedicationDosage(randomMed.suggestedDosage);
                            setNewMedicationRefills(randomMed.refills);
                          }}
                          className="text-[10px] bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-100 hover:border-indigo-600 px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                        >
                          <span>🎲 Gen Random Medicine</span>
                        </button>
                      </div>

                      {/* Search & Filter inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-indigo-400" />
                          <input
                            type="text"
                            value={rxSearchQuery}
                            onChange={(e) => setRxSearchQuery(e.target.value)}
                            placeholder="Search 1,000,000+ medicines (e.g., amox, lisin)..."
                            className="pl-8 pr-3 py-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                          />
                        </div>

                        <select
                          value={rxCategoryFilter}
                          onChange={(e) => setRxCategoryFilter(e.target.value)}
                          className="bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-lg text-xs text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="All">All Drug Categories</option>
                          <option value="Cardiovascular (Heart & Blood)">Cardiovascular (Heart & Blood)</option>
                          <option value="Antibiotics & Anti-Infectives">Antibiotics & Anti-Infectives</option>
                          <option value="Neurological & Psychiatric">Neurological & Psychiatric</option>
                          <option value="Respiratory & Pulmonary">Respiratory & Pulmonary</option>
                          <option value="Gastrointestinal & Digestive">Gastrointestinal & Digestive</option>
                          <option value="Endocrine & Metabolic">Endocrine & Metabolic</option>
                          <option value="Analgesics & Anti-Inflammatories">Analgesics & Anti-Inflammatories</option>
                          <option value="Oncology & Immunological">Oncology & Immunological</option>
                          <option value="Dermatological & Topical">Dermatological & Topical</option>
                        </select>
                      </div>

                      {/* Search Results Autocomplete / Suggestions List */}
                      {rxSearchResults.length > 0 && (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                          <div className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 px-1 select-none">
                            {rxSearchQuery ? `Search Results (${rxSearchResults.length} matches)` : "Popular Standard Formulations"}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {rxSearchResults.map((med) => (
                              <button
                                key={med.id}
                                type="button"
                                onClick={() => {
                                  setNewMedicationName(`${med.name} ${med.strength} (${med.form})`);
                                  setNewMedicationDosage(med.suggestedDosage);
                                  setNewMedicationRefills(med.refills);
                                }}
                                className="p-2.5 bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 text-left rounded-lg transition-all text-xs cursor-pointer flex flex-col justify-between shadow-sm hover:shadow"
                              >
                                <div className="flex items-center justify-between gap-1 w-full">
                                  <span className="font-extrabold text-slate-800">{med.name}</span>
                                  <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-600 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">{med.strength}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-semibold truncate mt-1">{med.form} • {med.category}</div>
                                <div className="text-[9px] text-slate-400 italic truncate mt-0.5">Active: {med.chemicalName}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleAddPrescription} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Medication Name</label>
                        <input
                          id="staff-rx-med"
                          type="text"
                          value={newMedicationName}
                          onChange={(e) => setNewMedicationName(e.target.value)}
                          placeholder="Medication Name (e.g., Albuterol)"
                          className="bg-white border border-slate-200 p-2 w-full rounded text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Dosage Directive</label>
                        <input
                          id="staff-rx-dose"
                          type="text"
                          value={newMedicationDosage}
                          onChange={(e) => setNewMedicationDosage(e.target.value)}
                          placeholder="Dosage Directive (e.g., 2 puffs daily)"
                          className="bg-white border border-slate-200 p-2 w-full rounded text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Refills Allowed</label>
                        <input
                          id="staff-rx-refills"
                          type="number"
                          value={newMedicationRefills}
                          onChange={(e) => setNewMedicationRefills(Number(e.target.value))}
                          placeholder="Refills Count"
                          min={0}
                          className="bg-white border border-slate-200 p-2 w-full rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400 font-mono font-bold"
                        />
                      </div>
                      <button
                        id="staff-rx-submit"
                        type="submit"
                        className="sm:col-span-3 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded font-bold text-xs transition shadow-sm cursor-pointer"
                      >
                        Add Secure Prescription Record
                      </button>
                    </form>
                  </div>

                  {/* Patient Discharge Planner & Summaries Section */}
                  <div className="border-t border-slate-150 pt-6 space-y-6">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        Clinical Discharge Summary & Sign-off
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        Synthesize patient diagnoses, prescribed medications, and recovery notes into a certified, digitally signed release certificate.
                      </p>
                    </div>

                    {/* Auto-Compile Utility Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-emerald-50/40 border border-emerald-100 rounded-lg">
                      <span className="text-xs text-slate-600 font-semibold leading-relaxed">
                        Need to pre-populate from current Electronic Health Records?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const diagnosesList = selectedPat.medicalHistory
                            .map((h: any) => `• ${h.condition} (${h.date})`)
                            .join('\n');
                          const medsList = selectedPat.prescriptions
                            .map((p: any) => `• ${p.medication} - ${p.dosage}`)
                            .join('\n');
                          
                          setDischargeDiagnoses(diagnosesList || "No recorded clinical history.");
                          setDischargeMedications(medsList || "No recorded active prescriptions.");
                          setDischargeRecoveryNotes(
                            "1. Follow up with primary care physician in 14 days for vital review.\n" +
                            "2. Take all prescribed medications exactly as scheduled. Do not discontinue antibiotics prematurely.\n" +
                            "3. Rest and avoid physical strain or heavy lifting above 10 lbs.\n" +
                            "4. Return to emergency clinic immediately if fever exceeds 101°F or severe pain occurs."
                          );
                          setDischargeSignature(`Dr. ${currentUser.name.replace('Dr. ', '')}`);
                        }}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold transition shadow-sm cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                      >
                        <span>⚡ Auto-Compile From EHR</span>
                      </button>
                    </div>

                    {/* Discharge Document Editor Form */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                        {selectedDraftSummaryId ? "📝 Edit Patient Discharge Draft" : "✍️ Author New Discharge Summary"}
                      </h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400">Diagnosis Summary</label>
                          <textarea
                            value={dischargeDiagnoses}
                            onChange={(e) => setDischargeDiagnoses(e.target.value)}
                            placeholder="List main admission diagnosis and secondary clinical findings..."
                            rows={3}
                            className="bg-white border border-slate-200 p-2.5 w-full rounded text-xs text-slate-850 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 font-sans"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400">Post-Discharge Medications</label>
                          <textarea
                            value={dischargeMedications}
                            onChange={(e) => setDischargeMedications(e.target.value)}
                            placeholder="List continuing prescriptions, dosage regimens, and refills directives..."
                            rows={3}
                            className="bg-white border border-slate-200 p-2.5 w-full rounded text-xs text-slate-850 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 font-sans"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400">Recovery Instructions & Warnings</label>
                        <textarea
                          value={dischargeRecoveryNotes}
                          onChange={(e) => setDischargeRecoveryNotes(e.target.value)}
                          placeholder="Provide specific recovery timelines, red-flag symptoms, activity limits, and followup directives..."
                          rows={3}
                          className="bg-white border border-slate-200 p-2.5 w-full rounded text-xs text-slate-850 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 font-sans"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400">Clinician Electronic Signature Sign-off</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={dischargeSignature}
                              onChange={(e) => {
                                setDischargeSignature(e.target.value);
                                if (dischargeSignatureError) setDischargeSignatureError(false);
                              }}
                              placeholder="Type your full professional name (e.g., Dr. Sarah Jenkins)"
                              className={`bg-white border p-2.5 w-full rounded text-xs text-slate-850 font-semibold focus:outline-none focus:ring-1 placeholder-slate-400 ${
                                dischargeSignatureError
                                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                                  : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500'
                              }`}
                            />
                            {dischargeSignature && (
                              <div className="absolute right-3 top-2.5 text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono px-1.5 py-0.5 rounded uppercase font-bold">
                                signature preview
                              </div>
                            )}
                          </div>
                          {dischargeSignatureError && (
                            <p className="text-rose-500 text-[10px] font-bold">
                              * Professional electronic signature is required to sign off this medical summary.
                            </p>
                          )}
                          {dischargeSignature && (
                            <div className="mt-2 p-2 bg-white border border-dashed border-indigo-100 rounded text-center">
                              <span className="text-[9px] text-slate-400 block font-mono font-bold uppercase">PHYSICIAN SIGNATURE DISPLAY:</span>
                              <span className="font-serif italic text-xl text-indigo-700 tracking-wide font-medium block mt-1">{dischargeSignature}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={submittingSummary}
                            onClick={async () => {
                              if (submittingSummary) return;
                              setSubmittingSummary(true);
                              try {
                                const response = await fetch('/api/patients/discharge-summary/add', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    patientId: selectedPat.id,
                                    summaryId: selectedDraftSummaryId || undefined,
                                    diagnoses: dischargeDiagnoses,
                                    medications: dischargeMedications,
                                    recoveryNotes: dischargeRecoveryNotes,
                                    doctorName: currentUser.name,
                                    signature: dischargeSignature,
                                    status: 'Draft'
                                  })
                                });
                                const data = await response.json();
                                if (data.success) {
                                  setDischargeDiagnoses('');
                                  setDischargeMedications('');
                                  setDischargeRecoveryNotes('');
                                  setDischargeSignature('');
                                  setSelectedDraftSummaryId(null);
                                  if (onRefreshData) await onRefreshData();
                                }
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setSubmittingSummary(false);
                              }
                            }}
                            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-750 py-2.5 px-4 rounded-lg font-bold text-xs transition cursor-pointer text-center"
                          >
                            Save Draft
                          </button>
                          
                          <button
                            type="button"
                            disabled={submittingSummary}
                            onClick={async () => {
                              if (submittingSummary) return;
                              if (!dischargeSignature.trim()) {
                                setDischargeSignatureError(true);
                                return;
                              }
                              setSubmittingSummary(true);
                              try {
                                const response = await fetch('/api/patients/discharge-summary/add', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    patientId: selectedPat.id,
                                    summaryId: selectedDraftSummaryId || undefined,
                                    diagnoses: dischargeDiagnoses,
                                    medications: dischargeMedications,
                                    recoveryNotes: dischargeRecoveryNotes,
                                    doctorName: currentUser.name,
                                    signature: dischargeSignature,
                                    status: 'Signed'
                                  })
                                });
                                const data = await response.json();
                                if (data.success) {
                                  setDischargeDiagnoses('');
                                  setDischargeMedications('');
                                  setDischargeRecoveryNotes('');
                                  setDischargeSignature('');
                                  setSelectedDraftSummaryId(null);
                                  if (onRefreshData) await onRefreshData();
                                }
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setSubmittingSummary(false);
                              }
                            }}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-lg font-bold text-xs transition cursor-pointer text-center shadow-sm"
                          >
                            Sign & Issue Summary
                          </button>

                          {selectedDraftSummaryId && (
                            <button
                              type="button"
                              onClick={() => {
                                setDischargeDiagnoses('');
                                setDischargeMedications('');
                                setDischargeRecoveryNotes('');
                                setDischargeSignature('');
                                setSelectedDraftSummaryId(null);
                              }}
                              className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-lg font-bold text-xs transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Active Discharge Summary Documents Ledger */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] uppercase tracking-wider text-slate-500 font-extrabold flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-slate-400" /> Issued Discharge Records Ledger
                      </h5>
                      {(!selectedPat.dischargeSummaries || selectedPat.dischargeSummaries.length === 0) ? (
                        <div className="text-center py-6 text-xs text-slate-400 italic border border-dashed border-slate-200 rounded-lg bg-slate-50/50 font-medium">
                          No discharge summary documents recorded for this patient.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {selectedPat.dischargeSummaries.map((summary: any) => (
                            <div key={summary.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:bg-slate-100/70">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-xs text-slate-800">Discharge Release Document</span>
                                  {summary.status === 'Signed' ? (
                                    <span className="text-[9px] bg-green-50 border border-green-200 text-green-700 px-1.5 py-0.5 rounded font-black uppercase flex items-center gap-0.5">
                                      ✓ Signed & Issued
                                    </span>
                                  ) : (
                                    <span className="text-[9px] bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded font-black uppercase flex items-center gap-0.5">
                                      ✏ Draft
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1 font-mono font-semibold">
                                  RECORD DATE: {summary.date} • CLINICIAN: {summary.doctorName}
                                </div>
                                {summary.diagnoses && (
                                  <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-1 font-medium font-sans">
                                    <strong className="text-slate-700 font-bold">Diagnosis:</strong> {summary.diagnoses}
                                  </p>
                                )}
                              </div>

                              <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                                {summary.status === 'Draft' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDraftSummaryId(summary.id);
                                      setDischargeDiagnoses(summary.diagnoses || '');
                                      setDischargeMedications(summary.medications || '');
                                      setDischargeRecoveryNotes(summary.recoveryNotes || '');
                                      setDischargeSignature(summary.signature || '');
                                    }}
                                    className="bg-white border border-slate-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
                                  >
                                    Edit Draft
                                  </button>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => setSummaryPreviewId(summary.id)}
                                  className="bg-white border border-slate-200 hover:bg-indigo-50 text-indigo-600 text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer flex items-center gap-1"
                                >
                                  {summary.status === 'Signed' ? "🔍 Print/View Document" : "🔍 Preview"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Printable-style Medical Document Overlay Modal */}
                  {summaryPreviewId && (() => {
                    const previewSummary = selectedPat.dischargeSummaries?.find((s: any) => s.id === summaryPreviewId);
                    if (!previewSummary) return null;
                    return (
                      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col border border-slate-200 animate-scaleUp">
                          {/* Modal Header */}
                          <div className="border-b border-slate-100 p-4 flex justify-between items-center bg-slate-50">
                            <span className="text-xs uppercase font-extrabold text-slate-500 tracking-wider font-mono">SECURE RELEASE CERTIFICATE VIEWER</span>
                            <button
                              type="button"
                              onClick={() => setSummaryPreviewId(null)}
                              className="text-slate-400 hover:text-slate-600 transition font-black text-sm p-1.5 hover:bg-slate-200/50 rounded-lg cursor-pointer"
                            >
                              ✕ Close
                            </button>
                          </div>

                          {/* Official Printable Sheet Container */}
                          <div id="discharge-printable-sheet" className="p-8 space-y-6 bg-white flex-grow font-sans text-slate-800">
                            {/* Hospital Letterhead */}
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

                            {/* Watermark / Hospital Emblem Background overlay */}
                            <div className="relative">
                              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                                <span className="text-9xl font-black text-indigo-900 rotate-12">CAREFLOW</span>
                              </div>

                              {/* Patient Clinical Info Block */}
                              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-150 text-xs">
                                <div>
                                  <span className="text-slate-400 uppercase font-black tracking-wider text-[9px] block">Discharge Patient</span>
                                  <span className="font-extrabold text-sm text-slate-800 mt-0.5 block">{selectedPat.name}</span>
                                  <span className="text-slate-500 block mt-1 font-medium">Age: {selectedPat.age} yrs • Blood Class: {selectedPat.bloodType}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 uppercase font-black tracking-wider text-[9px] block">Attending Physician</span>
                                  <span className="font-extrabold text-sm text-slate-800 mt-0.5 block">{previewSummary.doctorName}</span>
                                  <span className="text-slate-500 block mt-1 font-medium">Discharge Date: {previewSummary.date}</span>
                                </div>
                              </div>

                              {/* Document Body */}
                              <div className="space-y-5 pt-4">
                                <div className="space-y-1.5">
                                  <h4 className="text-xs uppercase font-black tracking-wider text-slate-500 border-b border-slate-100 pb-1 flex items-center gap-1">
                                    <span>Ⅰ.</span> Clinical Diagnosis Summary
                                  </h4>
                                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium bg-slate-50/40 p-2.5 rounded border border-slate-100">
                                    {previewSummary.diagnoses || "No explicit diagnostic text compiled."}
                                  </p>
                                </div>

                                <div className="space-y-1.5">
                                  <h4 className="text-xs uppercase font-black tracking-wider text-slate-500 border-b border-slate-100 pb-1 flex items-center gap-1">
                                    <span>Ⅱ.</span> Continuing Medication Regime
                                  </h4>
                                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium bg-slate-50/40 p-2.5 rounded border border-slate-100">
                                    {previewSummary.medications || "No post-discharge medicine prescribed."}
                                  </p>
                                </div>

                                <div className="space-y-1.5">
                                  <h4 className="text-xs uppercase font-black tracking-wider text-slate-500 border-b border-slate-100 pb-1 flex items-center gap-1">
                                    <span>Ⅲ.</span> Convalescence instructions & Warning Directives
                                  </h4>
                                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium bg-slate-50/40 p-2.5 rounded border border-slate-100 font-sans">
                                    {previewSummary.recoveryNotes || "Standard convalescence protocols apply."}
                                  </p>
                                </div>
                              </div>

                              {/* Clinical Certification & Sign-off Block */}
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
                                    {previewSummary.status === 'Signed' ? `Signed at: ${new Date(previewSummary.signedAt || previewSummary.date).toLocaleString()}` : "UNCLASSIFIED DRAFT COPY"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Modal Footer Controls */}
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
              );
            })()}
          </div>
        </div>
      )}

      {/* SUB-TAB: Doctor Roster Calendar view */}
      {activeStaffSubTab === 'roster' && (
        <div id="staff-sub-roster" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600 animate-pulse" /> Physician Shifts & Duty Roster
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Operational calendar view tracking clinician availability, shift patterns, and on-call rotations.
              </p>
            </div>

            {/* Quick stats for current filters */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600">
              <span className="text-slate-400">Current Department Context:</span>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full font-bold">
                {currentDept}
              </span>
            </div>
          </div>

          {/* Roster Controls and Toggle Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/55 p-4 rounded-xl border border-slate-200/80">
            {/* Toggle 1: Department Scope */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-slate-400" /> Department Filtering Scope
              </label>
              <div className="flex gap-1.5 p-1 bg-white rounded-lg border border-slate-200 shadow-inner">
                <button
                  type="button"
                  onClick={() => setRosterDeptFilter('current')}
                  className={`flex-1 text-xs py-2 px-3.5 rounded-md font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    rosterDeptFilter === 'current'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" /> Only {currentDept}
                </button>
                <button
                  type="button"
                  onClick={() => setRosterDeptFilter('all')}
                  className={`flex-1 text-xs py-2 px-3.5 rounded-md font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    rosterDeptFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  All Hospital Units
                </button>
              </div>
            </div>

            {/* Toggle 2: Availability / On-Call Status */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-slate-400" /> Shift & Rotation Status
              </label>
              <div className="flex gap-1.5 p-1 bg-white rounded-lg border border-slate-200 shadow-inner">
                <button
                  type="button"
                  onClick={() => setRosterStatusFilter('all')}
                  className={`flex-1 text-xs py-2 rounded-md font-bold transition-all cursor-pointer ${
                    rosterStatusFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Show All Staff
                </button>
                <button
                  type="button"
                  onClick={() => setRosterStatusFilter('available')}
                  className={`flex-1 text-xs py-2 rounded-md font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    rosterStatusFilter === 'available'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-current" /> Available
                </button>
                <button
                  type="button"
                  onClick={() => setRosterStatusFilter('on-call')}
                  className={`flex-1 text-xs py-2 rounded-md font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    rosterStatusFilter === 'on-call'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <PhoneCall className="h-3.5 w-3.5 text-current" /> On-Call
                </button>
              </div>
            </div>
          </div>

          {/* Roster Calendar Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
              const dayDocs = doctors.filter((d) => {
                // Availability match
                if (!d.availability.includes(day)) return false;

                // Department filter
                if (rosterDeptFilter === 'current' && d.department !== currentDept) return false;

                // Status filter
                if (rosterStatusFilter !== 'all') {
                  const status = getDoctorStatusOnDay(d.id, day);
                  if (rosterStatusFilter === 'available' && status !== 'Available') return false;
                  if (rosterStatusFilter === 'on-call' && status !== 'On-Call') return false;
                }

                return true;
              });

              return (
                <div key={day} className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/85 space-y-3.5 flex flex-col justify-between min-h-[340px] shadow-sm">
                  <div className="space-y-2.5">
                    <div className="text-xs uppercase font-black text-indigo-700 border-b border-slate-200 pb-2 tracking-wider flex items-center justify-between">
                      <span>{day}</span>
                      <span className="bg-slate-200/70 text-slate-600 px-1.5 py-0.2 rounded-full font-bold text-[10px]">
                        {dayDocs.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-0.5 scrollbar-thin">
                      {dayDocs.map((doc) => {
                        const status = getDoctorStatusOnDay(doc.id, day);
                        const isAvailable = status === 'Available';

                        return (
                          <div key={doc.id} className="p-3 bg-white border border-slate-200 rounded-lg text-left space-y-1.5 hover:border-indigo-300 transition shadow-sm group">
                            <div className="text-xs font-extrabold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                              {doc.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold leading-none">
                              {doc.specialization}
                            </div>
                            
                            {/* Department block label (only useful when showing all units) */}
                            {rosterDeptFilter === 'all' && (
                              <div className="text-[9px] text-indigo-500 font-black tracking-tight leading-none bg-indigo-50/50 px-1 py-0.5 rounded border border-indigo-100/50 max-w-max">
                                {doc.department}
                              </div>
                            )}

                            <div className="pt-0.5 flex items-center gap-1.5">
                              {isAvailable ? (
                                <span className="inline-flex items-center gap-1 text-[8px] uppercase tracking-wider bg-emerald-50 border border-emerald-150 text-emerald-700 px-2 py-0.5 rounded-md font-black">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  Available
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[8px] uppercase tracking-wider bg-amber-50 border border-amber-150 text-amber-700 px-2 py-0.5 rounded-md font-black">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  On-Call
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {dayDocs.length === 0 && (
                        <div className="text-center py-10 bg-slate-100/50 rounded-lg border border-dashed border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold block">No scheduled shifts</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Physician Daily Shift Section History Log */}
          <div className="border-t border-slate-200/80 pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600 animate-pulse" /> Physician Daily Shift Section History
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Historical audit of clinician daily check-ins, recorded shift hours, and active work statuses</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Search shift logs */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={shiftSearchTerm}
                    onChange={(e) => setShiftSearchTerm(e.target.value)}
                    placeholder="Search shifts..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
                  />
                </div>

                <button
                  onClick={() => setIsAddingShiftLog(!isAddingShiftLog)}
                  className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Record Shift
                </button>
              </div>
            </div>

            {/* Record New Shift Form */}
            {isAddingShiftLog && (
              <form onSubmit={handleAddShiftLog} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 animate-slideDown">
                <h5 className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Record Manual Physician Shift Entry</h5>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase">Physician</label>
                    <select
                      value={newShiftDoctor}
                      onChange={(e) => setNewShiftDoctor(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      {doctors.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase">Date</label>
                    <input
                      type="date"
                      value={newShiftDate}
                      onChange={(e) => setNewShiftDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded-md text-xs text-slate-800 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase">Weekday</label>
                    <select
                      value={newShiftDay}
                      onChange={(e) => setNewShiftDay(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded-md text-xs text-slate-800 focus:outline-none"
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase">Hours Logged</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="24"
                      value={newShiftHours}
                      onChange={(e) => setNewShiftHours(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded-md text-xs text-slate-800 focus:outline-none font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase">Shift Time Interval</label>
                    <input
                      type="text"
                      value={newShiftTime}
                      onChange={(e) => setNewShiftTime(e.target.value)}
                      placeholder="e.g. 08:00 AM - 04:00 PM"
                      className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded-md text-xs text-slate-800 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase">Check-In Time</label>
                    <input
                      type="text"
                      value={newShiftCheckIn}
                      onChange={(e) => setNewShiftCheckIn(e.target.value)}
                      placeholder="e.g. 07:55 AM"
                      className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded-md text-xs text-slate-800 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase">Status</label>
                    <select
                      value={newShiftStatus}
                      onChange={(e) => setNewShiftStatus(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded-md text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="Completed">Completed</option>
                      <option value="Active">Active</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingShiftLog(false)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-md text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 transition cursor-pointer shadow-sm"
                  >
                    Save Shift Log
                  </button>
                </div>
              </form>
            )}

            {/* List of Shift History */}
            <div className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] text-slate-450 uppercase tracking-wider border-b border-slate-200 font-black">
                    <th className="p-3">Physician</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Day & Date</th>
                    <th className="p-3">Shift Interval</th>
                    <th className="p-3">Hours</th>
                    <th className="p-3">Clock-In / Out</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {(() => {
                    const filteredLogs = shiftLogs.filter(log => {
                      const term = shiftSearchTerm.toLowerCase();
                      const matchesSearch = log.doctorName.toLowerCase().includes(term) || log.department.toLowerCase().includes(term) || log.day.toLowerCase().includes(term);
                      
                      if (rosterDeptFilter === 'current' && log.department !== currentDept) {
                        return false;
                      }
                      
                      return matchesSearch;
                    });

                    if (filteredLogs.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold italic">
                            No physician daily shift history found matching current filters.
                          </td>
                        </tr>
                      );
                    }

                    return filteredLogs.map(log => {
                      const isActive = log.status === 'Active';
                      return (
                        <tr key={log.id} className="hover:bg-white transition-colors">
                          <td className="p-3">
                            <span className="font-extrabold text-slate-800 block">{log.doctorName}</span>
                            <span className="text-[10px] text-slate-450 font-medium font-sans">Attending Clinician</span>
                          </td>
                          <td className="p-3 font-semibold text-slate-600">
                            {log.department}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-700 block">{log.date}</span>
                            <span className="text-[10px] text-indigo-600 font-extrabold">{log.day}</span>
                          </td>
                          <td className="p-3 font-medium text-slate-500 font-sans">
                            {log.shiftTime}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-700">
                            {log.hours} hrs
                          </td>
                          <td className="p-3 text-[10px] font-mono text-slate-500 font-medium">
                            <div>In: <span className="text-slate-800 font-bold">{log.checkIn}</span></div>
                            <div>Out: <span className="text-slate-800 font-bold">{log.checkOut}</span></div>
                          </td>
                          <td className="p-3 text-right">
                            <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md font-black border ${
                              isActive 
                                ? 'bg-indigo-50 border-indigo-150 text-indigo-700' 
                                : 'bg-emerald-50 border-emerald-150 text-emerald-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: AI Image Diagnostics Simulator */}
      {activeStaffSubTab === 'diagnostics' && (
        <div id="staff-sub-diag" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-600" />
              AI Radiology & Diagnostic Analyzer (Simulator)
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Upload mock medical scan imagery or X-rays to generate radiological evaluation drafts via CareFlow imaging node.
            </p>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 transition flex flex-col items-center justify-center text-center space-y-3 cursor-pointer bg-slate-50 shadow-inner">
              <Activity className="h-10 w-10 text-indigo-600" />
              <div className="space-y-1">
                <span className="text-sm font-bold text-slate-800 block">Select Diagnostic Image File</span>
                <span className="text-xs text-slate-500 font-medium">
                  Accepts standard CXR chest x-ray, MRI, or lung ultrasound mockup png files
                </span>
              </div>
              <input id="diag-image-uploader" type="file" accept="image/*" onChange={handleUploadDiagnosticImageMock} className="hidden" />
              <button
                onClick={() => document.getElementById('diag-image-uploader')?.click()}
                className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition border border-slate-200 shadow-sm cursor-pointer"
              >
                Browse Files
              </button>
            </div>

            {diagnosticImage && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 shadow-inner">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs text-slate-500 font-mono font-bold">Payload Loaded successfully</span>
                  <button onClick={() => setDiagnosticImage(null)} className="text-xs text-red-500 hover:underline font-bold">
                    Clear File
                  </button>
                </div>
                <div className="flex items-center justify-center bg-white p-4 rounded-lg overflow-hidden max-h-48 border border-slate-200">
                  <img src={diagnosticImage} alt="Mock radiological scan" className="object-contain max-h-40 rounded shadow-sm" />
                </div>
                <button
                  id="diag-analyze-btn"
                  onClick={handleAnalyzeDiagnosticImage}
                  disabled={analyzingImage}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer shadow-indigo-100 disabled:opacity-50"
                >
                  {analyzingImage ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                  {analyzingImage ? 'Processing Radiological Findings...' : 'Initiate AI Radiological Diagnostic Run'}
                </button>
              </div>
            )}

            {imageAnalysisResult && (
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 text-slate-300 space-y-3 font-mono text-xs leading-relaxed animate-fadeIn shadow-xl">
                <div className="text-[10px] uppercase font-bold text-indigo-400 border-b border-white/10 pb-2">Analysis Results Output</div>
                <pre className="whitespace-pre-wrap font-mono">{imageAnalysisResult}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB: Dedicated Hospital Registry Search & Access */}
      {activeStaffSubTab === 'registry' && (
        <div id="staff-sub-registry" className="animate-fadeIn">
          <HospitalDirectory
            doctors={doctors}
            patients={patients}
            onImpersonate={onImpersonate || (() => {})}
            currentUserId={currentUserId || ''}
            onSelectPatient={(id) => {
              setSelectedDirectoryPatientId(id);
              setActiveStaffSubTab('patients');
            }}
            onSelectDoctor={(name) => {
              setShiftSearchTerm(name);
              setRosterDeptFilter('all');
              setActiveStaffSubTab('roster');
            }}
          />
        </div>
      )}
    </div>
  );
}
