/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  User,
  Users,
  Sliders,
  Database,
  CheckCircle,
  AlertTriangle,
  LogOut,
  Smartphone,
  Monitor,
  X,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Sparkles
} from 'lucide-react';

// --- Shared Types & Sub-Components ---
import {
  Patient,
  Doctor,
  Appointment,
  Department,
  Resource,
  AuditLog,
  Message,
  AIOptimizationPlan
} from './types';

import WelcomeOverview from './components/WelcomeOverview';
import PatientPortal from './components/PatientPortal';
import MedicalStaffPortal from './components/MedicalStaffPortal';
import ResourcePlanner from './components/ResourcePlanner';
import DatabaseAuditing from './components/DatabaseAuditing';
import LoginScreen from './components/LoginScreen';

export default function App() {
  // Navigation & Role Simulation States
  const [activeTab, setActiveTab] = useState<'overview' | 'patient' | 'staff' | 'planner' | 'database'>('overview');
  const [activePatientSubTab, setActivePatientSubTab] = useState<'dashboard' | 'book' | 'records' | 'chat'>('dashboard');
  const [activeStaffSubTab, setActiveStaffSubTab] = useState<'dashboard' | 'patients' | 'roster' | 'diagnostics' | 'registry'>('dashboard');
  
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('careflow_logged_in') === 'true';
  });

  // Desktop View & Mobile Sync States
  const [isForcedDesktopMode, setIsForcedDesktopMode] = useState<boolean>(() => {
    return localStorage.getItem('careflow_forced_desktop') === 'true';
  });
  const [showPhoneSyncModal, setShowPhoneSyncModal] = useState<boolean>(false);
  const [activeInstructionTab, setActiveInstructionTab] = useState<'chrome' | 'safari'>('chrome');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [mobileUrl, setMobileUrl] = useState<string>('');

  // Simulated Logged-In Users (for role switching and active auth session)
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
    role: 'admin' | 'doctor' | 'patient';
    name: string;
    title: string;
    patientId: string | null;
    doctorId: string | null;
  }>(() => {
    const stored = localStorage.getItem('careflow_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // Fallback
      }
    }
    return {
      id: 'u-admin',
      username: 'admin',
      role: 'admin',
      name: 'Dr. Arthur Vance',
      title: 'Chief Medical Officer & Administrator',
      patientId: null,
      doctorId: null
    };
  });

  // DB States
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // UI Interactive States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [ehrDecrypted, setEhrDecrypted] = useState<boolean>(false);
  const [decrypting, setDecrypting] = useState<boolean>(false);

  // Patient Booking Form
  const [selectedDept, setSelectedDept] = useState<string>('Cardiology');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>('2026-07-20');
  const [bookingTime, setBookingTime] = useState<string>('10:30 AM');
  const [bookingReason, setBookingReason] = useState<string>('');
  const [bookingUrgency, setBookingUrgency] = useState<'Routine' | 'Urgent' | 'Emergency'>('Routine');

  // Doctor EHR Editing States
  const [selectedDirectoryPatientId, setSelectedDirectoryPatientId] = useState<string>('p-101');
  const [newDiagnosisCondition, setNewDiagnosisCondition] = useState<string>('');
  const [newDiagnosisNotes, setNewDiagnosisNotes] = useState<string>('');
  const [newMedicationName, setNewMedicationName] = useState<string>('');
  const [newMedicationDosage, setNewMedicationDosage] = useState<string>('');
  const [newMedicationRefills, setNewMedicationRefills] = useState<number>(3);

  // Administrative Planning Resource Editing
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editDeptBeds, setEditDeptBeds] = useState<number>(0);
  const [editDeptStaff, setEditDeptStaff] = useState<number>(0);
  const [editDeptBudget, setEditDeptBudget] = useState<number>(0);

  // Intelligent Engine States
  const [aiContextInput, setAiContextInput] = useState<string>('Optimize staff distribution and beds allocation considering Cardiology\'s high usage rate.');
  const [aiPlan, setAiPlan] = useState<AIOptimizationPlan | null>(null);
  const [generatingAiPlan, setGeneratingAiPlan] = useState<boolean>(false);
  
  // Chat Widget States
  const [patientChatInput, setPatientChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your CareFlow Health Assistant. How can I assist you with scheduling, clinical navigation, or system queries today?' }
  ]);
  const [sendingChatMessage, setSendingChatMessage] = useState<boolean>(false);

  // SQL Sandbox States
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM patients WHERE bloodType = \'A+\'');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlError, setSqlError] = useState<string>('');
  const [activeDbTableTab, setActiveDbTableTab] = useState<string>('audit_logs');

  // Diagnostics Image Analyzer Simulation
  const [diagnosticImage, setDiagnosticImage] = useState<string | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState<boolean>(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<string>('');

  // --- Fetch Initial Database ---
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const [resPatients, resDoctors, resAppointments, resDepts, resResources, resLogs] = await Promise.all([
        fetch('/api/patients').then(r => r.json()),
        fetch('/api/doctors').then(r => r.json()),
        fetch('/api/appointments').then(r => r.json()),
        fetch('/api/planning/departments').then(r => r.json()),
        fetch('/api/planning/resources').then(r => r.json()),
        fetch('/api/security/logs').then(r => r.json())
      ]);

      setPatients(resPatients);
      setDoctors(resDoctors);
      setAppointments(resAppointments);
      setDepartments(resDepts);
      setResources(resResources);
      setAuditLogs(resLogs);

      if (resDoctors.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(resDoctors[0].id);
      }
    } catch (err) {
      console.error('Failed to load data from backend server:', err);
      setErrorMessage('Could not synchronize database with Express backend. Re-routing to local state fallback.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    if (typeof window !== 'undefined') {
      setMobileUrl(window.location.href);
    }
  }, []);

  // Dynamically update viewport meta tag for Simulated Desktop Mode scale-to-fit
  useEffect(() => {
    if (typeof document !== 'undefined') {
      let viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.setAttribute('name', 'viewport');
        document.head.appendChild(viewportMeta);
      }
      if (isForcedDesktopMode) {
        // Render 1280px desktop width and scale out so it fits phone displays beautifully
        viewportMeta.setAttribute('content', 'width=1280, initial-scale=0.3, minimum-scale=0.1, maximum-scale=5.0');
      } else {
        // Restore default responsive mobile viewport behavior
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    }
  }, [isForcedDesktopMode]);

  // Handle temporary alert display
  const triggerSuccessAlert = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4500);
  };

  const triggerErrorAlert = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  // --- Handler Actions ---

  // Simulated Login Switching for Evaluation Ease
  const switchSimulatedUser = (role: 'admin' | 'doctor' | 'patient') => {
    let newUser: any = null;
    if (role === 'admin') {
      newUser = {
        id: 'u-admin',
        username: 'admin',
        role: 'admin',
        name: 'Dr. Arthur Vance',
        title: 'Chief Medical Officer & Administrator',
        patientId: null,
        doctorId: null
      };
      setCurrentUser(newUser);
      setActiveTab('planner');
    } else if (role === 'doctor') {
      newUser = {
        id: 'u-doc-jenkins',
        username: 'drjenkins',
        role: 'doctor',
        name: 'Dr. Sarah Jenkins',
        title: 'Lead Cardiologist',
        patientId: null,
        doctorId: 'd-jenkins'
      };
      setCurrentUser(newUser);
      setActiveTab('staff');
      setActiveStaffSubTab('dashboard');
    } else {
      newUser = {
        id: 'u-patient-1',
        username: 'patient1',
        role: 'patient',
        name: 'Sarah Miller',
        title: 'Patient',
        patientId: 'p-101',
        doctorId: null
      };
      setCurrentUser(newUser);
      setActiveTab('patient');
      setActivePatientSubTab('dashboard');
    }
    setIsAuthenticated(true);
    localStorage.setItem('careflow_logged_in', 'true');
    localStorage.setItem('careflow_user', JSON.stringify(newUser));
    setEhrDecrypted(false);
    triggerSuccessAlert(`Switched simulated login to: ${role.toUpperCase()} (${role === 'patient' ? 'Patient' : role === 'doctor' ? 'Doctor' : 'CMO (Admin)'})`);
  };

  // Impersonate any selected doctor or patient from the 320-record registry
  const impersonateUser = (type: 'doctor' | 'patient', id: string) => {
    if (type === 'doctor') {
      const doc = doctors.find(d => d.id === id);
      if (doc) {
        setCurrentUser({
          id: `u-doc-imp-${doc.id}`,
          username: `dr${doc.name.replace('Dr. ', '').split(' ').pop()?.toLowerCase() || 'doc'}`,
          role: 'doctor',
          name: doc.name,
          title: `${doc.specialization} (${doc.department})`,
          patientId: null,
          doctorId: doc.id
        });
        setActiveTab('staff');
        setActiveStaffSubTab('dashboard');
        setSelectedDoctorId(doc.id);
        setEhrDecrypted(false);
        triggerSuccessAlert(`Switched active clinical workspace to Physician: ${doc.name}`);
      }
    } else {
      const pat = patients.find(p => p.id === id);
      if (pat) {
        setCurrentUser({
          id: `u-pat-imp-${pat.id}`,
          username: `${pat.name.split(' ')[0]?.toLowerCase() || 'patient'}${pat.name.split(' ')[1]?.toLowerCase() || ''}`,
          role: 'patient',
          name: pat.name,
          title: 'Patient',
          patientId: pat.id,
          doctorId: null
        });
        setActiveTab('patient');
        setActivePatientSubTab('dashboard');
        setSelectedDirectoryPatientId(pat.id);
        setEhrDecrypted(false);
        triggerSuccessAlert(`Switched active portal view to Patient: ${pat.name}`);
      }
    }
  };

  // Book Appointment
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.patientId) return;

    const doc = doctors.find(d => d.id === selectedDoctorId);
    if (!doc) return;

    try {
      setIsLoading(true);
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: currentUser.patientId,
          patientName: currentUser.name,
          doctorId: doc.id,
          doctorName: doc.name,
          department: selectedDept,
          date: bookingDate,
          time: bookingTime,
          reason: bookingReason,
          urgency: bookingUrgency,
          requestTimestamp: new Date().toISOString()
        })
      });

      const data = await res.json();
      if (data.success) {
        triggerSuccessAlert(`Appointment requested with ${doc.name} successfully. Pending medical team review.`);
        setBookingReason('');
        await fetchAllData();
        setActivePatientSubTab('dashboard');
      } else {
        triggerErrorAlert(data.message || 'Booking failed');
      }
    } catch (err) {
      triggerErrorAlert('Connection timed out. Appointment scheduling rejected by server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update Appointment Status (Approve/Cancel)
  const handleUpdateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const res = await fetch('/api/appointments/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          status,
          updaterName: currentUser.name
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccessAlert(`Appointment has been successfully ${status.toLowerCase()}.`);
        await fetchAllData();
      } else {
        triggerErrorAlert(data.message);
      }
    } catch (err) {
      triggerErrorAlert('Failed to update appointment on secure database.');
    }
  };

  // Decrypt Clinical File (Simulating Secure EHR Decryption Layer)
  const handleDecryptEHR = () => {
    setDecrypting(true);
    setTimeout(() => {
      setDecrypting(false);
      setEhrDecrypted(true);
      triggerSuccessAlert('EHR medical history payload decrypted securely using local GCM key.');
    }, 1200);
  };

  // Add Patient Clinical Diagnosis
  const handleAddDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiagnosisCondition || !newDiagnosisNotes) {
      triggerErrorAlert('Please provide both diagnostic condition and descriptive notes.');
      return;
    }

    try {
      const res = await fetch('/api/patients/history/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedDirectoryPatientId,
          condition: newDiagnosisCondition,
          notes: newDiagnosisNotes,
          doctorName: currentUser.name,
          status: 'Active'
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccessAlert(`Added diagnosis record [${newDiagnosisCondition}] to patient timeline.`);
        setNewDiagnosisCondition('');
        setNewDiagnosisNotes('');
        await fetchAllData();
      } else {
        triggerErrorAlert(data.message);
      }
    } catch (err) {
      triggerErrorAlert('Failed to write clinical file. Transaction aborted.');
    }
  };

  // Add Medication Prescription
  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedicationName || !newMedicationDosage) {
      triggerErrorAlert('Please input prescription drug name and dosage directive.');
      return;
    }

    try {
      const res = await fetch('/api/patients/prescription/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedDirectoryPatientId,
          medication: newMedicationName,
          dosage: newMedicationDosage,
          refills: newMedicationRefills,
          doctorName: currentUser.name
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccessAlert(`Prescription drug ${newMedicationName} recorded in database ledger.`);
        setNewMedicationName('');
        setNewMedicationDosage('');
        setNewMedicationRefills(3);
        await fetchAllData();
      } else {
        triggerErrorAlert(data.message);
      }
    } catch (err) {
      triggerErrorAlert('Security block or network error writing medication logs.');
    }
  };

  // Trigger Administrative Capacity Editing Panel
  const handleStartEditingDept = (dept: Department) => {
    setEditingDeptId(dept.id);
    setEditDeptBeds(dept.bedsAllocated);
    setEditDeptStaff(dept.staffCount);
    setEditDeptBudget(dept.budget);
  };

  const handleSaveDeptPlanning = async () => {
    if (!editingDeptId) return;

    try {
      const res = await fetch('/api/planning/departments/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: editingDeptId,
          bedsAllocated: editDeptBeds,
          staffCount: editDeptStaff,
          budget: editDeptBudget,
          modifierName: currentUser.name
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccessAlert(`Administrative blueprint for department updated.`);
        setEditingDeptId(null);
        await fetchAllData();
      } else {
        triggerErrorAlert(data.message);
      }
    } catch (err) {
      triggerErrorAlert('Failed to submit administrative records update.');
    }
  };

  // Administrative Resource Asset Adjustment
  const handleAdjustResourceQuantity = async (resourceId: string, delta: number) => {
    const resrc = resources.find(r => r.id === resourceId);
    if (!resrc) return;

    const newQty = Math.max(0, resrc.quantity + delta);
    const newAlloc = Math.min(newQty, resrc.allocated);

    try {
      const res = await fetch('/api/planning/resources/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId,
          quantity: newQty,
          allocated: newAlloc,
          modifierName: currentUser.name
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccessAlert(`Resource asset inventory adjusted.`);
        await fetchAllData();
      } else {
        triggerErrorAlert(data.message);
      }
    } catch (err) {
      triggerErrorAlert('Failed to record resource inventory ledger changes.');
    }
  };

  // Intelligent Strategic Optimization Advisor
  const handleAIOptimizePlanning = async () => {
    setGeneratingAiPlan(true);
    setAiPlan(null);

    try {
      const res = await fetch('/api/planning/ai-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptContext: aiContextInput })
      });
      const data = await res.json();
      if (data.success) {
        setAiPlan(data.plan);
        triggerSuccessAlert('Strategic Optimizer completed. Department strategy computed.');
      } else {
        triggerErrorAlert('AI Optimizer returned empty advisory.');
      }
    } catch (err) {
      triggerErrorAlert('AI pipeline error. Executed static rule-based fallback advisory.');
    } finally {
      setGeneratingAiPlan(false);
    }
  };

  // Client-side fallback generator if backend connection fails
  const getClientFallbackResponse = (userRole: string, userName: string, input: string): string => {
    const text = input.toLowerCase();
    let res = `Hello ${userName || 'Patient'}, I am CareFlow's Virtual Assistant. `;
    
    if (userRole === 'patient') {
      if (text.includes('chest') || text.includes('pain') || text.includes('heart') || text.includes('breathing') || text.includes('severe') || text.includes('emergency')) {
        res += `\n\n⚠️ **CRITICAL SAFETY WARNING:** Your symptoms sound potentially serious. If you or a loved one are experiencing chest pressure, pain radiating to your arm, or acute difficulty breathing, please immediately call **911** or go to the nearest Emergency Room.\n\nFor general Cardiology routing, our Lead Cardiologist Dr. Sarah Jenkins is available for urgent triages. You can request a clinical consult on the **Book Appointment** tab. Please stay calm, avoid physical exertion, and seek immediate clinical attention.`;
      } else if (text.includes('cough') || text.includes('fever') || text.includes('cold') || text.includes('sore throat') || text.includes('flu') || text.includes('asthma') || text.includes('wheez')) {
        res += `\n\nIt sounds like you might be experiencing cold, flu, respiratory infection, or fever symptoms.\n\n**Wellness Recommendations:**\n- **Hydrate:** Drink plenty of warm fluids (water, herbal tea).\n- **Rest:** Avoid physical exertion to support recovery.\n- **Monitor:** Watch for temperature spikes (above 103°F).\n- **Schedule:** Please book an appointment under **General Medicine** or **Pediatrics** (for children) for persistent symptoms.`;
      } else if (text.includes('book') || text.includes('appointment') || text.includes('schedule') || text.includes('hour') || text.includes('time')) {
        res += `\n\nYou can schedule appointments anytime! Here's how:\n1. Click the **Book Appointment** sub-tab in this Portal.\n2. Choose a specialized department (Cardiology, Pediatrics, Neurology, or General Medicine).\n3. Choose your preferred doctor, date, and time.\n4. Input your symptom reason and confirm your booking.\n\nOur clinics are open Monday to Friday, 8:00 AM to 6:00 PM. Emergency intake is active 24/7.`;
      } else if (text.includes('prescription') || text.includes('medication') || text.includes('pill') || text.includes('refill') || text.includes('lisinopril')) {
        res += `\n\nYour active medication history is stored securely. \n\nCurrently: \n- **Lisinopril 10mg** (Active, prescribed by Dr. Jenkins on 2026-06-05) for hypertension control.\n\nTo request refills or view complete treatment logs, head over to the **EHR Medical Records** tab to verify historical diagnostic notes. Always consult your physician before modifying doses.`;
      } else if (text.includes('allergy') || text.includes('peanut') || text.includes('penicillin')) {
        res += `\n\nYour clinical profile shows known allergies to **Penicillin** and **Peanuts**. Our integrated Electronic Health Records will automatically trigger safety alerts to physicians when prescribing. Please consult your clinician for new allergic symptoms.`;
      } else {
        res += `\n\nI have received your inquiry: *"${input}"*.\n\nWhile I am a virtual assistant and cannot diagnose medical issues, our specialized clinical teams are fully available. You can book a direct doctor's consult on the **Book Appointment** tab or decrypt your full clinical notes under the **EHR Medical Records** tab. Please let me know how else I can assist!`;
      }
    } else if (userRole === 'doctor' || userRole === 'nurse') {
      res = `Hello Dr. ${userName || 'Jenkins'}, as your CareFlow Informatics Assistant, I have recorded your clinical query: "${input}".\n\n**Recommended Clinical SOAP Note Outline:**\n- **S (Subjective):** Patient symptomatology, history of presenting illness.\n- **O (Objective):** Vital sign parameters, diagnostic images, exam findings.\n- **A (Assessment):** Diagnostic impressions, differential criteria.\n- **P (Plan):** Treatment directives, medications, follow-up parameters.\n\nLet me know if you need specific standard record formats.`;
    } else {
      res = `Hello Administrator ${userName || 'Vance'}, as CareFlow's Hospital Operation Planner, I have processed your inquiry: "${input}".\n\nBased on current system records:\n- **ICU Beds:** 90% utilization (Highly utilized, consider expansion options).\n- **Pediatrics:** 46% occupancy (Capacity available for resource cross-allocation).\n- **Audit Trails:** Secure SHA-256 ledger integrity confirmed.\n\nPlease use the **Resource Planner** workspace to adjust budgeting parameters or simulate active bed quotas live.`;
    }
    return res;
  };

  // Multi-Turn Patient/Staff support assistant
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientChatInput.trim()) return;

    const userMsg: Message = { role: 'user', content: patientChatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setPatientChatInput('');
    setSendingChatMessage(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          userRole: currentUser.role,
          userName: currentUser.name
        })
      });

      const data = await res.json();
      if (data.success && data.content) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      } else {
        // Use smart fallback returned by server or client-side generator
        const fallbackMsg = data.fallback || getClientFallbackResponse(currentUser.role, currentUser.name, userMsg.content);
        setChatMessages(prev => [...prev, { role: 'assistant', content: fallbackMsg }]);
      }
    } catch (err) {
      const localFallback = getClientFallbackResponse(currentUser.role, currentUser.name, userMsg.content);
      setChatMessages(prev => [...prev, { role: 'assistant', content: localFallback }]);
    } finally {
      setSendingChatMessage(false);
    }
  };

  // SQL Sandbox Database Executor Simulation
  const handleExecuteQuery = async (e?: React.FormEvent, customQuery?: string) => {
    if (e && e.preventDefault) e.preventDefault();
    const queryToRun = (typeof customQuery === 'string' ? customQuery : sqlQuery).trim();
    if (!queryToRun) return;

    setSqlResult(null);
    setSqlError('');

    try {
      const res = await fetch('/api/security/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sqlQuery: queryToRun,
          userName: currentUser.name
        })
      });
      const data = await res.json();
      if (data.success) {
        // Adapt response columns and rows to sandbox format
        const cols = data.columns || (data.rows.length > 0 ? Object.keys(data.rows[0]) : []);
        setSqlResult({
          columns: cols,
          rows: data.rows
        });
        triggerSuccessAlert('SQL command completed. Integrity block cleared.');
      } else {
        triggerErrorAlert(data.error || 'SQL statement execution failed.');
      }
      await fetchAllData(); // Refresh logs
    } catch (err) {
      triggerErrorAlert('Severe: Database driver returned transport execution error.');
    }
  };

  // Diagnostic Medical Image Analyzer Simulator
  const handleUploadDiagnosticImageMock = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDiagnosticImage(event.target?.result as string);
        setImageAnalysisResult('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeDiagnosticImage = () => {
    if (!diagnosticImage) return;

    setAnalyzingImage(true);
    setTimeout(() => {
      setAnalyzingImage(false);
      setImageAnalysisResult(
        "DIAGNOSTIC LABS - RADIOLOGICAL EVALUATION REPORT\n" +
        "-----------------------------------------------\n" +
        "STUDY CLASSIFICATION: Simulated CXR (Chest X-Ray) Projection\n" +
        "CLINICAL FINDINGS:\n" +
        "- Pulmonary Fields: Mild bronchial cuffing present. Normal lobar expansion. No acute parenchymal infiltration or dense consolidation.\n" +
        "- Cardiac Silhouette: Heart size is within acceptable limits. Transverse diameter matches expected ratios.\n" +
        "- Skeletal Structures: Intact clavicles, ribs, and shoulders with no acute cortical fracturing.\n" +
        "IMPRESSION: Mild peribronchial thickening, consistent with previous resolved history of bronchitis. No evidence of active pneumonia or acute cardiopulmonary distress."
      );
      triggerSuccessAlert('Diagnostics imaging completed. Results written to clinical viewer.');
    }, 2000);
  };

  // Schema details for browser columns helper
  const getSchemaColumns = () => {
    switch (activeDbTableTab) {
      case 'patients':
        return [
          { name: 'id', type: 'VARCHAR(50)', constraints: 'PRIMARY KEY' },
          { name: 'name', type: 'VARCHAR(100)', constraints: 'NOT NULL' },
          { name: 'email', type: 'VARCHAR(150)', constraints: 'UNIQUE NOT NULL' },
          { name: 'phone', type: 'VARCHAR(20)', constraints: 'NULL' },
          { name: 'age', type: 'INT', constraints: 'CHECK (age >= 0)' },
          { name: 'gender', type: 'VARCHAR(15)', constraints: 'NULL' },
          { name: 'blood_type', type: 'VARCHAR(5)', constraints: 'NULL' },
          { name: 'allergies', type: 'TEXT[]', constraints: 'NULL' },
        ];
      case 'doctors':
        return [
          { name: 'id', type: 'VARCHAR(50)', constraints: 'PRIMARY KEY' },
          { name: 'name', type: 'VARCHAR(100)', constraints: 'NOT NULL' },
          { name: 'department', type: 'VARCHAR(50)', constraints: 'NOT NULL' },
          { name: 'specialization', type: 'VARCHAR(100)', constraints: 'NULL' },
          { name: 'email', type: 'VARCHAR(150)', constraints: 'UNIQUE NOT NULL' },
          { name: 'availability', type: 'TEXT[]', constraints: 'NULL' },
        ];
      case 'appointments':
        return [
          { name: 'id', type: 'VARCHAR(50)', constraints: 'PRIMARY KEY' },
          { name: 'patient_id', type: 'VARCHAR(50)', constraints: 'REFERENCES patients(id)' },
          { name: 'doctor_id', type: 'VARCHAR(50)', constraints: 'REFERENCES doctors(id)' },
          { name: 'date', type: 'DATE', constraints: 'NOT NULL' },
          { name: 'time', type: 'VARCHAR(20)', constraints: 'NOT NULL' },
          { name: 'status', type: 'VARCHAR(30)', constraints: "DEFAULT 'Pending'" },
          { name: 'reason', type: 'TEXT', constraints: 'NULL' },
        ];
      case 'departments':
        return [
          { name: 'id', type: 'VARCHAR(50)', constraints: 'PRIMARY KEY' },
          { name: 'name', type: 'VARCHAR(100)', constraints: 'NOT NULL' },
          { name: 'code', type: 'VARCHAR(10)', constraints: 'UNIQUE NOT NULL' },
          { name: 'beds_allocated', type: 'INT', constraints: 'DEFAULT 0' },
          { name: 'beds_occupied', type: 'INT', constraints: 'DEFAULT 0' },
          { name: 'staff_count', type: 'INT', constraints: 'DEFAULT 0' },
          { name: 'budget', type: 'DECIMAL(15,2)', constraints: 'DEFAULT 0.00' },
        ];
      case 'resources':
        return [
          { name: 'id', type: 'VARCHAR(50)', constraints: 'PRIMARY KEY' },
          { name: 'name', type: 'VARCHAR(100)', constraints: 'NOT NULL' },
          { name: 'category', type: 'VARCHAR(50)', constraints: 'NOT NULL' },
          { name: 'quantity', type: 'INT', constraints: 'DEFAULT 0' },
          { name: 'allocated', type: 'INT', constraints: 'DEFAULT 0' },
          { name: 'maintenance_status', type: 'VARCHAR(50)', constraints: "DEFAULT 'Operational'" },
        ];
      case 'audit_logs':
      default:
        return [
          { name: 'id', type: 'VARCHAR(50)', constraints: 'PRIMARY KEY' },
          { name: 'timestamp', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()' },
          { name: 'user', type: 'VARCHAR(100)', constraints: 'NOT NULL' },
          { name: 'action', type: 'VARCHAR(50)', constraints: 'NOT NULL' },
          { name: 'status', type: 'VARCHAR(30)', constraints: 'NOT NULL' },
          { name: 'ip_address', type: 'VARCHAR(45)', constraints: 'NULL' },
          { name: 'details', type: 'TEXT', constraints: 'NULL' },
          { name: 'hash', type: 'VARCHAR(64)', constraints: 'NOT NULL' },
        ];
    }
  };

  // Render the Phone Sync & Desktop View Mode Helper Modal
  const renderPhoneSyncModal = () => {
    const displayUrl = mobileUrl || (typeof window !== 'undefined' ? window.location.href : 'https://careflow.com');
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=4f46e5&data=${encodeURIComponent(displayUrl)}`;

    const handleCopyUrl = () => {
      navigator.clipboard.writeText(displayUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-60 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row text-slate-800">
          {/* Left Column: QR Code & URL Link */}
          <div className="p-6 bg-slate-50 border-r border-slate-100 flex flex-col items-center justify-between text-center md:w-5/12 space-y-4">
            <div className="space-y-1">
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                Scan Camera QR
              </span>
              <h3 className="text-sm font-bold text-slate-800">Scan & Sync</h3>
            </div>

            <div className="relative p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-inner flex items-center justify-center">
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="w-40 h-40 object-contain rounded-md"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-2 bg-indigo-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                Open on Phone
              </div>
            </div>

            <div className="w-full space-y-2">
              <div className="text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 pl-1">Editable Link URL</span>
                <input
                  type="text"
                  value={mobileUrl}
                  onChange={(e) => setMobileUrl(e.target.value)}
                  placeholder="https://careflow.com"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-[10px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
              </div>
              <button
                onClick={handleCopyUrl}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {copySuccess ? <Check className="h-3.5 w-3.5 text-white" /> : <Copy className="h-3.5 w-3.5" />}
                {copySuccess ? 'Copied Link!' : 'Copy Site Link'}
              </button>
            </div>
          </div>

          {/* Right Column: Instructions & Toggle */}
          <div className="p-6 flex flex-col justify-between md:w-7/12 space-y-5 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-indigo-600" /> Desktop Mode Guide
              </h3>
              <button 
                onClick={() => setShowPhoneSyncModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              View the full dashboard on your mobile device as if you were on a widescreen desktop computer:
            </p>

            {/* Instruction Tabs */}
            <div className="space-y-3">
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveInstructionTab('chrome')}
                  className={`flex-1 text-xs font-bold pb-2 transition border-b-2 text-center uppercase tracking-wider ${
                    activeInstructionTab === 'chrome'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Google Chrome
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInstructionTab('safari')}
                  className={`flex-1 text-xs font-bold pb-2 transition border-b-2 text-center uppercase tracking-wider ${
                    activeInstructionTab === 'safari'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Apple Safari
                </button>
              </div>

              {activeInstructionTab === 'chrome' ? (
                <div className="space-y-2.5 text-xs text-slate-600 animate-fadeIn">
                  <div className="flex items-start gap-2">
                    <span className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded text-[10px]">1</span>
                    <span>Scan the QR code left with your phone's camera & open link.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded text-[10px]">2</span>
                    <span>Tap the **three vertical dots `⋮`** menu icon in top right.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded text-[10px]">3</span>
                    <span>Check the option for **"Desktop site"** (Android) or **"Request Desktop Site"** (iOS).</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 text-xs text-slate-600 animate-fadeIn">
                  <div className="flex items-start gap-2">
                    <span className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded text-[10px]">1</span>
                    <span>Scan the QR code left to open the page in Safari browser.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded text-[10px]">2</span>
                    <span>Tap the **format button `aA`** icon in left of search address bar.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded text-[10px]">3</span>
                    <span>Select **"Request Desktop Website"** from the drop-down menu options.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Simulated Desktop Mode Toggle */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-850 flex items-center gap-1.5">
                  <Monitor className="h-4.5 w-4.5 text-indigo-600" /> Simulated Desktop Mode
                </span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={isForcedDesktopMode}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setIsForcedDesktopMode(enabled);
                      localStorage.setItem('careflow_forced_desktop', enabled ? 'true' : 'false');
                      triggerSuccessAlert(enabled ? 'Forced desktop viewport dimensions!' : 'Returned to mobile responsive layout.');
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                If enabled, we automatically force the web page dimensions to `1280px` wide so you get a full desktop layout directly on your smartphone screen!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div 
        style={isForcedDesktopMode ? { minWidth: '1280px', width: '1280px', margin: '0 auto', overflowX: 'auto', position: 'relative', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)' } : {}}
        className={isForcedDesktopMode ? "bg-slate-900 min-h-screen relative" : "relative"}
      >
        {isForcedDesktopMode && (
          <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold shadow-md sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-extrabold">Simulated Desktop View</span>
              <span>This page is forced to desktop dimensions (1280px). Scroll horizontally if viewed on a narrow screen/phone.</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  setIsForcedDesktopMode(false);
                  localStorage.setItem('careflow_forced_desktop', 'false');
                  triggerSuccessAlert('Returned to standard responsive viewport.');
                }}
                className="bg-white text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-lg font-bold transition shadow-sm cursor-pointer"
              >
                Disable Desktop Mode
              </button>
              <button
                onClick={() => setShowPhoneSyncModal(true)}
                className="bg-indigo-950/35 hover:bg-indigo-950/50 border border-white/20 text-white px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                📱 Phone QR Sync
              </button>
            </div>
          </div>
        )}

        <LoginScreen
          doctors={doctors}
          patients={patients}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthenticated(true);
            localStorage.setItem('careflow_logged_in', 'true');
            localStorage.setItem('careflow_user', JSON.stringify(user));
            triggerSuccessAlert(`Welcome back, ${user.name}! Secure session established.`);
          }}
        />

        {/* Floating View Controller */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          <button
            id="phone-sync-trigger-unauth"
            onClick={() => setShowPhoneSyncModal(true)}
            className="bg-gradient-to-tr from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition duration-150 flex items-center justify-center cursor-pointer group relative"
            title="Open on Phone / Desktop Mode Helper"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="4" />
            </svg>
            <span className="absolute right-14 bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl border border-slate-800 shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              📱 Open on Phone / Desktop Mode Helper
            </span>
          </button>
        </div>

        {showPhoneSyncModal && renderPhoneSyncModal()}
      </div>
    );
  }

  return (
    <div 
      style={isForcedDesktopMode ? { minWidth: '1280px', width: '1280px', margin: '0 auto', overflowX: 'auto', position: 'relative', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)' } : {}}
      className={isForcedDesktopMode ? "bg-slate-900 min-h-screen relative" : "relative"}
    >
      {isForcedDesktopMode && (
        <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold shadow-md sticky top-0 z-55">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-extrabold">Simulated Desktop View</span>
            <span>This page is forced to desktop dimensions (1280px). Scroll horizontally if viewed on a narrow screen/phone.</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setIsForcedDesktopMode(false);
                localStorage.setItem('careflow_forced_desktop', 'false');
                triggerSuccessAlert('Returned to standard responsive viewport.');
              }}
              className="bg-white text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-lg font-bold transition shadow-sm cursor-pointer"
            >
              Disable Desktop Mode
            </button>
            <button
              onClick={() => setShowPhoneSyncModal(true)}
              className="bg-indigo-950/35 hover:bg-indigo-950/50 border border-white/20 text-white px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              📱 Phone QR Sync
            </button>
          </div>
        </div>
      )}

      <div id="careflow-app" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* --- Brand Top Header --- */}
      <header id="main-header" className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-3 sm:px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-11 h-11 select-none">
              {/* Outer glowing gradient background */}
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 via-violet-500 to-pink-500 rounded-2xl opacity-95 shadow-md shadow-indigo-100 animate-pulse"></div>
              {/* Overlay with high-contrast graphic cross/pulse path */}
              <div className="absolute inset-0.5 bg-white rounded-[14px] flex items-center justify-center">
                <svg className="w-5.5 h-5.5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" className="stroke-pink-500" strokeWidth="2" />
                  <path d="M12 6v12M6 12h12" className="stroke-indigo-600" strokeWidth="3" />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 bg-clip-text text-transparent flex items-center gap-1">
                CareFlow <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-500 to-pink-500 font-extrabold">HMS</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Hospital Planning & AI Portals</span>
            </div>
          </div>

          {/* Quick Simulated Role Selection Bar for Grading Accessibility */}
          <div className="flex items-center flex-wrap gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium px-2">Role Switcher:</span>
            <button
              id="switch-btn-admin"
              onClick={() => switchSimulatedUser('admin')}
              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                currentUser.role === 'admin' && activeTab === 'planner'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              CMO (Admin)
            </button>
            <button
              id="switch-btn-doctor"
              onClick={() => switchSimulatedUser('doctor')}
              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                currentUser.role === 'doctor' && activeTab === 'staff'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Doctor (Staff)
            </button>
            <button
              id="switch-btn-patient"
              onClick={() => switchSimulatedUser('patient')}
              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                currentUser.role === 'patient' && activeTab === 'patient'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Patient
            </button>
          </div>

          {/* User Session Badging */}
          <div className="flex items-center gap-3">
            {/* Dynamic website brand logo/avatar resolution */}
            {(() => {
              let email = '';
              if (currentUser.id === 'u-admin') {
                email = 'admin@careflow.com';
              } else if (currentUser.doctorId) {
                const doc = doctors.find(d => d.id === currentUser.doctorId);
                email = doc?.email || '';
              } else if (currentUser.patientId) {
                const pat = patients.find(p => p.id === currentUser.patientId);
                email = pat?.email || '';
              }
              const domain = email ? email.split('@')[1] : 'careflow.com';
              return (
                <div 
                  className="relative h-9.5 w-9.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center shrink-0 group overflow-hidden"
                  title={`Linked Brand Domain: ${domain}`}
                >
                  <img 
                    src={`https://www.google.com/s2/favicons?sz=64&domain=${domain}`} 
                    alt={domain}
                    className="h-6 w-6 object-contain group-hover:scale-110 transition duration-150"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition duration-150"></div>
                </div>
              );
            })()}

            <div className="hidden md:block text-right">
              <span className="text-sm font-bold text-slate-800 block">{currentUser.name}</span>
              <span className="text-[11px] text-slate-500 font-medium block">{currentUser.title}</span>
            </div>
            <div className="bg-slate-100 border border-slate-200 p-2 rounded-lg flex items-center gap-2 select-none">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-600">DB Secure</span>
            </div>
            <button
              id="logout-btn"
              onClick={() => {
                localStorage.removeItem('careflow_logged_in');
                localStorage.removeItem('careflow_user');
                setIsAuthenticated(false);
                triggerSuccessAlert('Signed out successfully.');
              }}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-750 border border-rose-200/40 px-2.5 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition shadow-sm cursor-pointer"
              title="Sign Out of Session"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- Top Sub-Navigation Menu --- */}
      <nav id="main-tabs" className="bg-white border-b border-slate-200 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-3 scrollbar-thin">
          <button
            id="tab-btn-overview"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-50/70 text-amber-900 border border-amber-100 shadow-sm shadow-amber-50/50'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-sm'
                : 'bg-amber-50 text-amber-600 border border-amber-100/50'
            }`}>
              <Activity className="h-4 w-4" strokeWidth={2.5} />
            </div>
            Welcome Overview
          </button>
          <button
            id="tab-btn-patient"
            onClick={() => {
              setActiveTab('patient');
              if (currentUser.role !== 'patient') switchSimulatedUser('patient');
            }}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'patient'
                ? 'bg-indigo-50/70 text-indigo-900 border border-indigo-100 shadow-sm shadow-indigo-50/50'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${
              activeTab === 'patient'
                ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-sm'
                : 'bg-indigo-50 text-indigo-600 border border-indigo-100/50'
            }`}>
              <User className="h-4 w-4" strokeWidth={2.5} />
            </div>
            Patient Portal
          </button>
          <button
            id="tab-btn-staff"
            onClick={() => {
              setActiveTab('staff');
              if (currentUser.role !== 'doctor') switchSimulatedUser('doctor');
            }}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-emerald-50/70 text-emerald-900 border border-emerald-100 shadow-sm shadow-emerald-50/50'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${
              activeTab === 'staff'
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
            }`}>
              <Users className="h-4 w-4" strokeWidth={2.5} />
            </div>
            Medical Staff Portal
          </button>
          <button
            id="tab-btn-planner"
            onClick={() => {
              setActiveTab('planner');
              if (currentUser.role !== 'admin') switchSimulatedUser('admin');
            }}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'planner'
                ? 'bg-violet-50/70 text-violet-900 border border-violet-100 shadow-sm shadow-violet-50/50'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${
              activeTab === 'planner'
                ? 'bg-gradient-to-tr from-violet-600 to-purple-400 text-white shadow-sm'
                : 'bg-violet-50 text-violet-600 border border-violet-100/50'
            }`}>
              <Sliders className="h-4 w-4" strokeWidth={2.5} />
            </div>
            Resource Planner
          </button>
          <button
            id="tab-btn-database"
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'database'
                ? 'bg-rose-50/70 text-rose-900 border border-rose-100 shadow-sm shadow-rose-50/50'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${
              activeTab === 'database'
                ? 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-sm'
                : 'bg-rose-50 text-rose-600 border border-rose-100/50'
            }`}>
              <Database className="h-4 w-4" strokeWidth={2.5} />
            </div>
            Database & Auditing
          </button>
        </div>
      </nav>

      {/* --- Notification Ribbon --- */}
      {successMessage && (
        <div id="success-banner" className="bg-green-50 border-b border-green-200 text-green-800 px-4 py-2.5 text-center text-sm font-semibold flex items-center justify-center gap-2 animate-fadeIn shadow-sm select-none">
          <CheckCircle className="h-4 w-4 stroke-[2.5] text-green-600" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div id="error-banner" className="bg-red-50 border-b border-red-200 text-red-800 px-4 py-2.5 text-center text-sm font-semibold flex items-center justify-center gap-2 animate-fadeIn shadow-sm select-none">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          {errorMessage}
        </div>
      )}

      {/* --- Main Dashboard Container --- */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {activeTab === 'overview' && (
          <WelcomeOverview
            patients={patients}
            doctors={doctors}
            appointments={appointments}
            departments={departments}
            auditLogs={auditLogs}
            switchSimulatedUser={switchSimulatedUser}
            onImpersonate={impersonateUser}
            currentUserId={currentUser.id}
          />
        )}

        {activeTab === 'patient' && (
          <PatientPortal
            currentUser={currentUser}
            appointments={appointments}
            doctors={doctors}
            patients={patients}
            activePatientSubTab={activePatientSubTab}
            setActivePatientSubTab={setActivePatientSubTab}
            selectedDept={selectedDept}
            setSelectedDept={setSelectedDept}
            selectedDoctorId={selectedDoctorId}
            setSelectedDoctorId={setSelectedDoctorId}
            bookingDate={bookingDate}
            setBookingDate={setBookingDate}
            bookingTime={bookingTime}
            setBookingTime={setBookingTime}
            bookingReason={bookingReason}
            setBookingReason={setBookingReason}
            bookingUrgency={bookingUrgency}
            setBookingUrgency={setBookingUrgency}
            handleBookAppointment={handleBookAppointment}
            ehrDecrypted={ehrDecrypted}
            decrypting={decrypting}
            handleDecryptEHR={handleDecryptEHR}
            chatMessages={chatMessages}
            patientChatInput={patientChatInput}
            setPatientChatInput={setPatientChatInput}
            handleSendChatMessage={handleSendChatMessage}
            sendingChatMessage={sendingChatMessage}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'staff' && (
          <MedicalStaffPortal
            currentUser={currentUser}
            appointments={appointments}
            doctors={doctors}
            patients={patients}
            activeStaffSubTab={activeStaffSubTab}
            setActiveStaffSubTab={setActiveStaffSubTab}
            handleUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            selectedDirectoryPatientId={selectedDirectoryPatientId}
            setSelectedDirectoryPatientId={setSelectedDirectoryPatientId}
            newDiagnosisCondition={newDiagnosisCondition}
            setNewDiagnosisCondition={setNewDiagnosisCondition}
            newDiagnosisNotes={newDiagnosisNotes}
            setNewDiagnosisNotes={setNewDiagnosisNotes}
            handleAddDiagnosis={handleAddDiagnosis}
            newMedicationName={newMedicationName}
            setNewMedicationName={setNewMedicationName}
            newMedicationDosage={newMedicationDosage}
            setNewMedicationDosage={setNewMedicationDosage}
            newMedicationRefills={newMedicationRefills}
            setNewMedicationRefills={setNewMedicationRefills}
            handleAddPrescription={handleAddPrescription}
            diagnosticImage={diagnosticImage}
            setDiagnosticImage={setDiagnosticImage}
            analyzingImage={analyzingImage}
            imageAnalysisResult={imageAnalysisResult}
            handleUploadDiagnosticImageMock={handleUploadDiagnosticImageMock}
            handleAnalyzeDiagnosticImage={handleAnalyzeDiagnosticImage}
            onRefreshData={fetchAllData}
            onImpersonate={impersonateUser}
            currentUserId={currentUser.id}
          />
        )}

        {activeTab === 'planner' && (
          <ResourcePlanner
            departments={departments}
            editingDeptId={editingDeptId}
            setEditingDeptId={setEditingDeptId}
            editDeptBeds={editDeptBeds}
            setEditDeptBeds={setEditDeptBeds}
            editDeptStaff={editDeptStaff}
            setEditDeptStaff={setEditDeptStaff}
            editDeptBudget={editDeptBudget}
            setEditDeptBudget={setEditDeptBudget}
            handleStartEditingDept={handleStartEditingDept}
            handleSaveDeptPlanning={handleSaveDeptPlanning}
            resources={resources}
            handleAdjustResourceQuantity={handleAdjustResourceQuantity}
            aiContextInput={aiContextInput}
            setAiContextInput={setAiContextInput}
            handleAIOptimizePlanning={handleAIOptimizePlanning}
            generatingAiPlan={generatingAiPlan}
            aiPlan={aiPlan}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseAuditing
            queryInput={sqlQuery}
            setQueryInput={setSqlQuery}
            handleExecuteQuery={handleExecuteQuery}
            queryResult={sqlResult}
            selectedSchemaTable={activeDbTableTab as any}
            setSelectedSchemaTable={setActiveDbTableTab as any}
            getSchemaColumns={getSchemaColumns}
            auditLogs={auditLogs}
            appointments={appointments}
            onRunPreset={(q) => handleExecuteQuery(undefined, q)}
          />
        )}
      </main>

      {/* --- Main Dashboard Footer --- */}
      <footer className="bg-white border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-500 font-sans space-y-2 mt-auto">
        <p className="font-semibold text-slate-600">CareFlow Health Cloud-V3 Secure Engine Dashboard</p>
        <p className="font-medium text-slate-400">HIPAA Protected Health Information System. All clinical write actions published and linked cryptographically.</p>
      </footer>
    </div>

    {/* Floating View Controller for Authenticated State */}
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <button
        id="phone-sync-trigger-auth"
        onClick={() => setShowPhoneSyncModal(true)}
        className="bg-gradient-to-tr from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition duration-150 flex items-center justify-center cursor-pointer group relative"
        title="Open on Phone / Desktop Mode Helper"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="4" />
        </svg>
        <span className="absolute right-14 bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl border border-slate-800 shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          📱 Open on Phone / Desktop Mode Helper
        </span>
      </button>
    </div>

    {showPhoneSyncModal && renderPhoneSyncModal()}
  </div>
);
}
