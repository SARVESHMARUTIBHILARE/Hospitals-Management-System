/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MedicalHistoryItem {
  date: string;
  condition: string;
  doctor: string;
  notes: string;
  status: string;
}

export interface Prescription {
  id: string;
  date: string;
  medication: string;
  dosage: string;
  doctor: string;
  status: string;
  refills: number;
}

export interface DischargeSummary {
  id: string;
  date: string;
  diagnoses: string;
  medications: string;
  recoveryNotes: string;
  doctorName: string;
  signedAt: string;
  signature: string;
  status: 'Draft' | 'Signed';
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  bloodType: string;
  allergies: string[];
  medicalHistory: MedicalHistoryItem[];
  prescriptions: Prescription[];
  dischargeSummaries?: DischargeSummary[];
}

export interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
  email: string;
  availability: string[];
  slots: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: string;
  reason: string;
  urgency?: 'Routine' | 'Urgent' | 'Emergency';
  requestTimestamp?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  bedsAllocated: number;
  bedsOccupied: number;
  staffCount: number;
  budget: number;
  status: string;
}

export interface Resource {
  id: string;
  name: string;
  category: string;
  quantity: number;
  allocated: number;
  maintenanceStatus: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  status: string;
  ipAddress: string;
  details: string;
  hash: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIOptimizationPlan {
  analysis: string;
  departmentOptimizations: Array<{
    deptCode: string;
    suggestedBeds: number;
    suggestedStaff: number;
    suggestedBudgetDelta: number;
    reasoning: string;
  }>;
  resourceRecommendations: Array<{
    resourceName: string;
    actionRequired: string;
    priority: 'High' | 'Medium' | 'Low';
  }>;
  strategicAdvice: string[];
}
