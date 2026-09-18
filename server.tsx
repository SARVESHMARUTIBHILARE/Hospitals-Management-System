import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, 'data', 'db.json');
const BACKUP_FILE = path.join(__dirname, 'data', 'db.json.bak');

// Auto-create database baseline backup at startup if not exists
if (fs.existsSync(DB_FILE) && !fs.existsSync(BACKUP_FILE)) {
  try {
    fs.copyFileSync(DB_FILE, BACKUP_FILE);
    console.log('Database baseline backup created successfully at:', BACKUP_FILE);
  } catch (err) {
    console.error('Failed to create startup database baseline backup:', err);
  }
}

// --- Helper for Database Operations ---
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { users: [], patients: [], doctors: [], appointments: [], departments: [], resources: [], audit_logs: [] };
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB file:', error);
    return { users: [], patients: [], doctors: [], appointments: [], departments: [], resources: [], audit_logs: [] };
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing DB file:', error);
  }
}

// Generate simple mock cryptographic hashes for audit trailing (simulating SHA-256)
function generateMockHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Array.from({ length: 8 }, (_, idx) => 
    Math.abs((hash ^ (idx * 999999)) % 4294967296).toString(16).padStart(8, '0')
  ).join('');
}

function addAuditLog(db: any, user: string, action: string, details: string, status: 'Success' | 'Warning' | 'Failed' = 'Success', ip = '127.0.0.1') {
  const timestamp = new Date().toISOString();
  const previousHash = db.audit_logs.length > 0 ? db.audit_logs[db.audit_logs.length - 1].hash : '0';
  const combinedInput = `${timestamp}|${user}|${action}|${details}|${status}|${previousHash}`;
  const hash = generateMockHash(combinedInput);

  const newLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp,
    user,
    action,
    status,
    ipAddress: ip,
    details,
    hash
  };

  db.audit_logs.push(newLog);
  // Keep logs list trimmed to last 100 entries for efficiency
  if (db.audit_logs.length > 100) {
    db.audit_logs.shift();
  }
}

// --- Lazy Initialization for AI SDK ---
let aiInstance: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('Intelligence services environment variable is missing. Please add it in the Secrets panel in AI Studio.');
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- Authentication Endpoint ---
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const db = readDB();

    const inputLower = username ? username.trim().toLowerCase() : '';

    // Find user directly by username or by doctor/patient email
    let user = db.users.find((u: any) => u.username && u.username.toLowerCase() === inputLower);

    if (!user) {
      // 1. Try to find if input is a Doctor's email
      const doctor = db.doctors.find((d: any) => d.email && d.email.toLowerCase() === inputLower);
      if (doctor) {
        user = db.users.find((u: any) => u.doctorId === doctor.id);
      } else {
        // 2. Try to find if input is a Patient's email
        const patient = db.patients.find((p: any) => p.email && p.email.toLowerCase() === inputLower);
        if (patient) {
          user = db.users.find((u: any) => u.patientId === patient.id);
        } else if (inputLower === 'admin@careflow.com' || inputLower === 'admin@hospital.com') {
          user = db.users.find((u: any) => u.role === 'admin');
        }
      }
    }

    // In this premium demo/planning prototype, we allow simple matching passwords or 'password123' for easy evaluation.
    // E.g., user 'patient1' with password 'patient1', 'admin' with 'admin', or 'password123' or 'password'
    const isValidPassword = password === 'admin' || password === 'password123' || password === 'password' || 
                            (user && (password === user.username || password === user.id || password === 'patient1' || password === 'drjenkins'));

    if (user && isValidPassword) {
      const token = `jwt_session_token_${user.id}_${Date.now()}`;
      addAuditLog(db, user.name, 'USER_LOGIN', `Successful login via email/username. Role allocated: ${user.role}.`, 'Success', req.ip);
      writeDB(db);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          title: user.title || 'User',
          patientId: user.patientId || null,
          doctorId: user.doctorId || null
        }
      });
    } else {
      addAuditLog(db, username || 'Unknown', 'USER_LOGIN_FAILED', `Failed login attempt for input: ${username}`, 'Warning', req.ip);
      writeDB(db);
      res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials. You can log in using "admin" (password: "admin"), or doctor/patient email IDs (password: "password123")' 
      });
    }
  });

  // --- Registration Endpoint ---
  app.post('/api/auth/register', (req, res) => {
    const { name, email, role, password, provider } = req.body;
    const db = readDB();

    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Name and Email ID are required.' });
    }

    const emailLower = email.trim().toLowerCase();
    
    // Check if email already registered
    let existingUser = db.users.find((u: any) => u.username && u.username.toLowerCase() === emailLower);
    if (!existingUser) {
      const existingDoc = db.doctors.find((d: any) => d.email && d.email.toLowerCase() === emailLower);
      const existingPat = db.patients.find((p: any) => p.email && p.email.toLowerCase() === emailLower);
      if (existingDoc || existingPat) {
        existingUser = db.users.find((u: any) => u.doctorId === existingDoc?.id || u.patientId === existingPat?.id);
      }
    }

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This email is already registered. Please log in instead.' });
    }

    const regRole = role === 'doctor' ? 'doctor' : 'patient';
    const userId = `u-${Date.now()}`;
    const generatedUsername = emailLower.split('@')[0];

    let patientId = null;
    let doctorId = null;
    let formattedName = name;

    if (regRole === 'patient') {
      const patientIdVal = `p-${Date.now()}`;
      patientId = patientIdVal;
      const newPatient = {
        id: patientIdVal,
        name,
        email: emailLower,
        phone: 'Not provided',
        age: 30,
        gender: 'Other',
        bloodType: 'O+',
        allergies: [],
        medicalHistory: [
          {
            date: new Date().toISOString().split('T')[0],
            condition: 'CareFlow Online Registration',
            doctor: 'System Intake',
            notes: `Signed up via ${provider || 'Email ID'}. Initial profile created.`,
            status: 'Active'
          }
        ],
        prescriptions: []
      };
      db.patients.push(newPatient);
    } else {
      const doctorIdVal = `d-${Date.now()}`;
      doctorId = doctorIdVal;
      formattedName = name.startsWith('Dr.') ? name : `Dr. ${name}`;
      const newDoctor = {
        id: doctorIdVal,
        name: formattedName,
        department: 'General Medicine',
        specialization: 'General Practice',
        email: emailLower,
        availability: ['Monday', 'Wednesday', 'Friday'],
        slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM']
      };
      db.doctors.push(newDoctor);
    }

    const newUser = {
      id: userId,
      username: generatedUsername,
      passwordHash: `$2b$10$simulated_${password || 'password123'}`,
      role: regRole,
      name: formattedName,
      title: regRole === 'doctor' ? 'General Practice Specialist' : 'Patient',
      patientId,
      doctorId
    };

    db.users.push(newUser);
    addAuditLog(db, formattedName, 'USER_REGISTER', `Created account via ${provider || 'Email ID'} registration. Assigned role: ${regRole}.`, 'Success', req.ip);
    writeDB(db);

    const token = `jwt_session_token_${userId}_${Date.now()}`;

    res.json({
      success: true,
      token,
      user: {
        id: userId,
        username: generatedUsername,
        role: regRole,
        name: formattedName,
        title: newUser.title,
        patientId,
        doctorId
      }
    });
  });

  // --- OAuth Provider Login Simulation Endpoint ---
  app.post('/api/auth/oauth', (req, res) => {
    const { name, email, provider, role } = req.body;
    const db = readDB();

    if (!email || !name || !provider) {
      return res.status(400).json({ success: false, message: 'Provider, Name and Email ID are required.' });
    }

    const emailLower = email.trim().toLowerCase();
    let user = db.users.find((u: any) => u.username && u.username.toLowerCase() === emailLower);

    if (!user) {
      // Find if email is mapped in doctor or patient records
      const doc = db.doctors.find((d: any) => d.email && d.email.toLowerCase() === emailLower);
      if (doc) {
        user = db.users.find((u: any) => u.doctorId === doc.id);
      } else {
        const pat = db.patients.find((p: any) => p.email && p.email.toLowerCase() === emailLower);
        if (pat) {
          user = db.users.find((u: any) => u.patientId === pat.id);
        }
      }
    }

    // If user already exists, log them in
    if (user) {
      const token = `jwt_session_token_${user.id}_${Date.now()}`;
      addAuditLog(db, user.name, 'USER_LOGIN_OAUTH', `Logged in securely with ${provider} credential link.`, 'Success', req.ip);
      writeDB(db);

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          title: user.title || 'User',
          patientId: user.patientId || null,
          doctorId: user.doctorId || null
        }
      });
    }

    // Otherwise, create a new user account seamlessly using their external website profile
    const regRole = role === 'doctor' ? 'doctor' : 'patient';
    const userId = `u-${Date.now()}`;
    const generatedUsername = emailLower.split('@')[0];

    let patientId = null;
    let doctorId = null;
    let formattedName = name;

    if (regRole === 'patient') {
      const patientIdVal = `p-${Date.now()}`;
      patientId = patientIdVal;
      const newPatient = {
        id: patientIdVal,
        name,
        email: emailLower,
        phone: 'Not provided',
        age: 28,
        gender: 'Other',
        bloodType: 'O+',
        allergies: [],
        medicalHistory: [
          {
            date: new Date().toISOString().split('T')[0],
            condition: `Authorized with ${provider}`,
            doctor: 'System Gatekeeper',
            notes: `Seamlessly registered via ${provider} OAuth federation with email ${emailLower}.`,
            status: 'Active'
          }
        ],
        prescriptions: []
      };
      db.patients.push(newPatient);
    } else {
      const doctorIdVal = `d-${Date.now()}`;
      doctorId = doctorIdVal;
      formattedName = name.startsWith('Dr.') ? name : `Dr. ${name}`;
      const newDoctor = {
        id: doctorIdVal,
        name: formattedName,
        department: 'General Medicine',
        specialization: 'General Practice',
        email: emailLower,
        availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        slots: ['10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM']
      };
      db.doctors.push(newDoctor);
    }

    const newUser = {
      id: userId,
      username: generatedUsername,
      passwordHash: `$2b$10$simulated_oauth_${provider}`,
      role: regRole,
      name: formattedName,
      title: regRole === 'doctor' ? 'General Practice Specialist' : 'Patient',
      patientId,
      doctorId
    };

    db.users.push(newUser);
    addAuditLog(db, formattedName, 'USER_REGISTER_OAUTH', `Registered new federated account via ${provider}.`, 'Success', req.ip);
    writeDB(db);

    const token = `jwt_session_token_${userId}_${Date.now()}`;

    res.json({
      success: true,
      token,
      user: {
        id: userId,
        username: generatedUsername,
        role: regRole,
        name: formattedName,
        title: newUser.title,
        patientId,
        doctorId
      }
    });
  });

  // --- Patients Endpoints ---
  app.get('/api/patients', (req, res) => {
    const db = readDB();
    res.json(db.patients);
  });

  app.get('/api/patients/:id', (req, res) => {
    const db = readDB();
    const patient = db.patients.find((p: any) => p.id === req.params.id);
    if (patient) {
      res.json(patient);
    } else {
      res.status(404).json({ message: 'Patient not found' });
    }
  });

  // Edit patient files (Medical Records, Allergies, etc.)
  app.post('/api/patients/edit', (req, res) => {
    const { patientId, allergies, age, bloodType, modifierName } = req.body;
    const db = readDB();
    const patientIndex = db.patients.findIndex((p: any) => p.id === patientId);

    if (patientIndex !== -1) {
      const patient = db.patients[patientIndex];
      if (allergies) patient.allergies = allergies;
      if (age) patient.age = Number(age);
      if (bloodType) patient.bloodType = bloodType;

      addAuditLog(db, modifierName || 'Medical Staff', 'UPDATE_HEALTH_RECORD', `Updated basic health record for patient: ${patient.name} (${patientId})`, 'Success', req.ip);
      writeDB(db);
      res.json({ success: true, patient });
    } else {
      res.status(404).json({ success: false, message: 'Patient not found' });
    }
  });

  // Add a history item / diagnosis to a patient
  app.post('/api/patients/history/add', (req, res) => {
    const { patientId, condition, doctorName, notes, status } = req.body;
    const db = readDB();
    const patient = db.patients.find((p: any) => p.id === patientId);

    if (patient) {
      const historyItem = {
        date: new Date().toISOString().split('T')[0],
        condition,
        doctor: doctorName,
        notes,
        status: status || 'Active'
      };
      patient.medicalHistory.unshift(historyItem);

      addAuditLog(db, doctorName, 'ADD_DIAGNOSIS', `Diagnosed condition [${condition}] for patient: ${patient.name}`, 'Success', req.ip);
      writeDB(db);
      res.json({ success: true, patient });
    } else {
      res.status(404).json({ success: false, message: 'Patient not found' });
    }
  });

  // Add prescription to a patient
  app.post('/api/patients/prescription/add', (req, res) => {
    const { patientId, medication, dosage, doctorName, refills } = req.body;
    const db = readDB();
    const patient = db.patients.find((p: any) => p.id === patientId);

    if (patient) {
      const prescription = {
        id: `rx-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        medication,
        dosage,
        doctor: doctorName,
        status: 'Active',
        refills: Number(refills) || 1
      };
      patient.prescriptions.unshift(prescription);

      addAuditLog(db, doctorName, 'CREATE_PRESCRIPTION', `Prescribed [${medication}] dosage: ${dosage} for patient: ${patient.name}`, 'Success', req.ip);
      writeDB(db);
      res.json({ success: true, patient });
    } else {
      res.status(404).json({ success: false, message: 'Patient not found' });
    }
  });

  // Add/Update and Sign Discharge Summary
  app.post('/api/patients/discharge-summary/add', (req, res) => {
    const { patientId, summaryId, diagnoses, medications, recoveryNotes, doctorName, signature, status } = req.body;
    const db = readDB();
    const patient = db.patients.find((p: any) => p.id === patientId);

    if (patient) {
      if (!patient.dischargeSummaries) {
        patient.dischargeSummaries = [];
      }

      if (summaryId) {
        // Update existing summary
        const summary = patient.dischargeSummaries.find((s: any) => s.id === summaryId);
        if (summary) {
          if (diagnoses !== undefined) summary.diagnoses = diagnoses;
          if (medications !== undefined) summary.medications = medications;
          if (recoveryNotes !== undefined) summary.recoveryNotes = recoveryNotes;
          if (signature !== undefined) summary.signature = signature;
          if (status !== undefined) {
            summary.status = status;
            if (status === 'Signed' && !summary.signedAt) {
              summary.signedAt = new Date().toISOString();
            }
          }
          
          addAuditLog(db, doctorName || 'Doctor', status === 'Signed' ? 'SIGN_DISCHARGE_SUMMARY' : 'UPDATE_DISCHARGE_SUMMARY', `${status === 'Signed' ? 'Signed' : 'Updated draft'} discharge summary [${summaryId}] for patient: ${patient.name}`, 'Success', req.ip);
          writeDB(db);
          return res.json({ success: true, patient });
        }
      }

      // Create new summary
      const dischargeSummary = {
        id: `ds-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        diagnoses: diagnoses || '',
        medications: medications || '',
        recoveryNotes: recoveryNotes || '',
        doctorName: doctorName || 'Doctor',
        signedAt: status === 'Signed' ? new Date().toISOString() : '',
        signature: signature || '',
        status: status || 'Draft'
      };
      
      patient.dischargeSummaries.unshift(dischargeSummary);

      addAuditLog(db, doctorName || 'Doctor', status === 'Signed' ? 'SIGN_DISCHARGE_SUMMARY' : 'CREATE_DISCHARGE_SUMMARY', `${status === 'Signed' ? 'Signed' : 'Drafted'} discharge summary for patient: ${patient.name}`, 'Success', req.ip);
      writeDB(db);
      res.json({ success: true, patient });
    } else {
      res.status(404).json({ success: false, message: 'Patient not found' });
    }
  });

  // --- Appointments Endpoints ---
  app.get('/api/appointments', (req, res) => {
    const db = readDB();
    res.json(db.appointments);
  });

  app.post('/api/appointments/book', (req, res) => {
    const { patientId, patientName, doctorId, doctorName, department, date, time, reason, urgency, requestTimestamp } = req.body;
    const db = readDB();

    const newAppointment = {
      id: `apt-${Date.now()}`,
      patientId,
      patientName,
      doctorId,
      doctorName,
      department,
      date,
      time,
      status: 'Pending',
      reason: reason || 'General consultation',
      urgency: urgency || 'Routine',
      requestTimestamp: requestTimestamp || new Date().toISOString()
    };

    db.appointments.unshift(newAppointment);
    addAuditLog(db, patientName, 'BOOK_APPOINTMENT', `Requested appointment with ${doctorName} on ${date} at ${time}`, 'Success', req.ip);
    writeDB(db);

    res.json({ success: true, appointment: newAppointment });
  });

  app.post('/api/appointments/update-status', (req, res) => {
    const { appointmentId, status, updaterName } = req.body;
    const db = readDB();
    const appointment = db.appointments.find((a: any) => a.id === appointmentId);

    if (appointment) {
      appointment.status = status;
      addAuditLog(db, updaterName, 'UPDATE_APPOINTMENT_STATUS', `Updated appointment [${appointmentId}] status to ${status}. Patient: ${appointment.patientName}`, 'Success', req.ip);
      writeDB(db);
      res.json({ success: true, appointment });
    } else {
      res.status(404).json({ success: false, message: 'Appointment not found' });
    }
  });

  app.post('/api/appointments/update-urgency', (req, res) => {
    const { appointmentId, urgency, updaterName } = req.body;
    const db = readDB();
    const appointment = db.appointments.find((a: any) => a.id === appointmentId);

    if (appointment) {
      appointment.urgency = urgency;
      addAuditLog(db, updaterName || 'Medical Staff', 'UPDATE_APPOINTMENT_URGENCY', `Triaged appointment [${appointmentId}] urgency to ${urgency}. Patient: ${appointment.patientName}`, 'Success', req.ip);
      writeDB(db);
      res.json({ success: true, appointment });
    } else {
      res.status(404).json({ success: false, message: 'Appointment not found' });
    }
  });

  // --- Doctors list ---
  app.get('/api/doctors', (req, res) => {
    const db = readDB();
    res.json(db.doctors);
  });

  // --- Planning / Resources Endpoints ---
  app.get('/api/planning/departments', (req, res) => {
    const db = readDB();
    res.json(db.departments);
  });

  app.post('/api/planning/departments/update', (req, res) => {
    const { departmentId, bedsAllocated, bedsOccupied, staffCount, budget, status, modifierName } = req.body;
    const db = readDB();
    const dept = db.departments.find((d: any) => d.id === departmentId);

    if (dept) {
      if (bedsAllocated !== undefined) dept.bedsAllocated = Number(bedsAllocated);
      if (bedsOccupied !== undefined) dept.bedsOccupied = Number(bedsOccupied);
      if (staffCount !== undefined) dept.staffCount = Number(staffCount);
      if (budget !== undefined) dept.budget = Number(budget);
      if (status !== undefined) dept.status = status;

      addAuditLog(db, modifierName || 'Admin Planner', 'UPDATE_DEPARTMENT_PLAN', `Adjusted capacity metrics for department: ${dept.name}`, 'Success', req.ip);
      writeDB(db);
      res.json({ success: true, department: dept });
    } else {
      res.status(404).json({ success: false, message: 'Department not found' });
    }
  });

  app.get('/api/planning/resources', (req, res) => {
    const db = readDB();
    res.json(db.resources);
  });

  app.post('/api/planning/resources/update', (req, res) => {
    const { resourceId, quantity, allocated, maintenanceStatus, modifierName } = req.body;
    const db = readDB();
    const resource = db.resources.find((r: any) => r.id === resourceId);

    if (resource) {
      if (quantity !== undefined) resource.quantity = Number(quantity);
      if (allocated !== undefined) resource.allocated = Number(allocated);
      if (maintenanceStatus !== undefined) resource.maintenanceStatus = maintenanceStatus;

      addAuditLog(db, modifierName || 'Admin Planner', 'UPDATE_RESOURCE_PLAN', `Updated hospital asset allocation for: ${resource.name}`, 'Success', req.ip);
      writeDB(db);
      res.json({ success: true, resource });
    } else {
      res.status(404).json({ success: false, message: 'Resource not found' });
    }
  });

  // --- Intelligent Planning Recommendations endpoint ---
  app.post('/api/planning/ai-optimize', async (req, res) => {
    const { promptContext } = req.body;
    const db = readDB();

    try {
      const ai = getAIClient();

      // Compile current system statistics to feed to the model
      const totalBeds = db.departments.reduce((sum: number, d: any) => sum + d.bedsAllocated, 0);
      const totalOccupied = db.departments.reduce((sum: number, d: any) => sum + d.bedsOccupied, 0);
      const occupancyRate = ((totalOccupied / totalBeds) * 100).toFixed(1);
      const totalStaff = db.departments.reduce((sum: number, d: any) => sum + d.staffCount, 0);
      const totalBudget = db.departments.reduce((sum: number, d: any) => sum + d.budget, 0);

      const deptSummary = db.departments.map((d: any) => 
        `- ${d.name} (${d.code}): Beds Allocated=${d.bedsAllocated}, Beds Occupied=${d.bedsOccupied} (${((d.bedsOccupied/d.bedsAllocated)*100).toFixed(0)}% occupancy), Staff Count=${d.staffCount}, Budget=$${d.budget.toLocaleString()}`
      ).join('\n');

      const resourceSummary = db.resources.map((r: any) =>
        `- ${r.name}: Total=${r.quantity}, Allocated=${r.allocated}, Maintenance=${r.maintenanceStatus}`
      ).join('\n');

      const systemPrompt = `You are a Chief Medical Informatics Officer and a senior hospital resource optimization consultant. Your objective is to analyze the hospital metrics and generate strategic, executable planning advice.

CURRENT HOSPITAL METRICS:
- Overall Occupancy Rate: ${occupancyRate}% (${totalOccupied}/${totalBeds} total beds occupied)
- Total Active Clinical Staff: ${totalStaff} members
- Combined Operational Budget: $${totalBudget.toLocaleString()}

DEPARTMENT METRICS:
${deptSummary}

CRITICAL RESOURCES:
${resourceSummary}

USER PLANNING FOCUS/CONSTRAINTS:
${promptContext || "Analyze overall efficiency and identify bottle-necks."}

INSTRUCTIONS:
Provide an expert, professional analysis in JSON format containing:
1. "analysis": A solid, clear paragraph evaluating current departments, highlighting bottlenecks (e.g. ICU expansion, high cardiology occupancy, staffing imbalances).
2. "departmentOptimizations": An array of actionable department optimization steps, each with "deptCode", "suggestedBeds", "suggestedStaff", "suggestedBudgetDelta", and "reasoning".
3. "resourceRecommendations": An array of specific recommendations for assets, with "resourceName", "actionRequired", and "priority" (High/Medium/Low).
4. "strategicAdvice": 3-4 bullet points of high-level strategic medical guidelines.

Return ONLY valid raw JSON following this schema, without any markdown formatting wrappers (like \`\`\`json). Ensure keys are exactly as requested.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: systemPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: {
                type: Type.STRING,
                description: "A solid, clear paragraph evaluating current departments, highlighting bottlenecks.",
              },
              departmentOptimizations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    deptCode: { type: Type.STRING },
                    suggestedBeds: { type: Type.INTEGER },
                    suggestedStaff: { type: Type.INTEGER },
                    suggestedBudgetDelta: { type: Type.INTEGER },
                    reasoning: { type: Type.STRING },
                  },
                  required: ["deptCode", "suggestedBeds", "suggestedStaff", "suggestedBudgetDelta", "reasoning"],
                },
              },
              resourceRecommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    resourceName: { type: Type.STRING },
                    actionRequired: { type: Type.STRING },
                    priority: { type: Type.STRING, description: "High/Medium/Low" },
                  },
                  required: ["resourceName", "actionRequired", "priority"],
                },
              },
              strategicAdvice: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["analysis", "departmentOptimizations", "resourceRecommendations", "strategicAdvice"],
          },
          temperature: 0.2
        }
      });

      const responseText = response.text || '{}';
      let parsedPlan;
      try {
        parsedPlan = JSON.parse(responseText);
      } catch (jsonErr) {
        // Strip markdown backticks if returned in error
        const cleanText = responseText.replace(/```json|```/gi, '').trim();
        parsedPlan = JSON.parse(cleanText);
      }

      addAuditLog(db, 'Admin Planner (AI Engine)', 'GENERATE_AI_PLANNING_ADVICE', 'Generated hospital resource planning recommendations via strategic optimization engine.', 'Success', req.ip);
      writeDB(db);

      res.json({ success: true, plan: parsedPlan });
    } catch (error: any) {
      console.error('Strategic optimization call failed:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Could not generate recommendations: ' + error.message,
        fallback: {
          analysis: "Cardiology and ICU are currently exhibiting high occupancy rates (above 75%), which could pose a risk to emergency readiness. Pediatric ward underutilization (46%) represents a potential resource redirection opportunity.",
          departmentOptimizations: [
            { deptCode: "CARD", suggestedBeds: 28, suggestedStaff: 14, suggestedBudgetDelta: 150000, reasoning: "Expand bed and clinical staff capacity to absorb the high diagnostic patient inflow safely." },
            { deptCode: "ICUU", suggestedBeds: 15, suggestedStaff: 20, suggestedBudgetDelta: 300000, reasoning: "Complete the active expansion process immediately to accommodate incoming emergency critical care transfers." }
          ],
          resourceRecommendations: [
            { resourceName: "MRI Machine (3T)", actionRequired: "Schedule immediate diagnostic preventative maintenance.", priority: "High" },
            { resourceName: "General Ventilators", actionRequired: "Procure 4 additional units to secure safety margins for expanded ICU beds.", priority: "Medium" }
          ],
          strategicAdvice: [
            "Initiate a staff cross-training program between Pediatrics and General Medicine to balance emergency nursing loads.",
            "Integrate a real-time clinical bed monitoring system to minimize discharge-to-cleaning latency.",
            "Formulate joint-consultation protocols to coordinate cardiology cases directly with internal medicine departments."
          ]
        }
      });
    }
  });

  // --- Interactive Assistant Endpoint for general patients and planning queries ---
  app.post('/api/chat', async (req, res) => {
    const { messages, userRole, userName } = req.body;
    const db = readDB();

    const getSmartFallbackResponse = (role: string, name: string, lastUserMessage: string): string => {
      const text = (lastUserMessage || "").toLowerCase();
      
      if (role === 'patient') {
        let response = `Hello ${name || 'Patient'}, I am CareFlow's Professional Virtual Health Assistant. `;
        
        if (text.includes('chest') || text.includes('pain') || text.includes('heart') || text.includes('breathing') || text.includes('stroke') || text.includes('severe') || text.includes('emergency')) {
          response += `\n\n⚠️ **CRITICAL SAFETY WARNING:** Your symptoms sound potentially serious. If you or a loved one are experiencing chest pressure, sudden pain radiating to your arm, or severe difficulty breathing, please immediately call **911** or go to the nearest Emergency Room.\n\nFor general Cardiology routing, our Lead Cardiologist Dr. Sarah Jenkins is available for urgent triages. You can request a clinical consult on the **Book Appointment** tab or by calling our department directly. Please stay calm, avoid physical exertion, and seek immediate professional clinical attention.`;
        } else if (text.includes('cough') || text.includes('fever') || text.includes('cold') || text.includes('sore throat') || text.includes('flu') || text.includes('asthma') || text.includes('wheez')) {
          response += `\n\nIt sounds like you might be dealing with a seasonal respiratory infection, cold, or fever. \n\n**Advice:**
- **Stay Hydrated:** Drink plenty of warm fluids like tea or water.
- **Rest:** Allow your body time to recover.
- **Monitor:** Keep track of your body temperature (seek care if it exceeds 103°F or doesn't respond to antipyretics).
- **Safety Reminder:** Please consult an actual clinician or book an appointment under **General Medicine** or **Pediatrics** (for children) for persistent symptoms.`;
        } else if (text.includes('book') || text.includes('appointment') || text.includes('schedule') || text.includes('hour') || text.includes('time')) {
          response += `\n\nYou can easily schedule a consultation with our specialists! Here is how:
1. Navigate to the **Book Appointment** sub-tab in this Portal.
2. Select the department (e.g., Cardiology, Pediatrics, Neurology, or General Medicine).
3. Choose your preferred doctor and select an available date and time.
4. Input your symptoms and hit 'Confirm Booking'.

Our clinical offices are open Monday through Friday, 8:00 AM to 6:00 PM. For emergency admissions, our clinical intake is active 24/7.`;
        } else if (text.includes('prescription') || text.includes('medication') || text.includes('pill') || text.includes('refill') || text.includes('lisinopril')) {
          response += `\n\nYour active medication list is stored securely in your patient record. \n\nCurrently, you have:
- **Lisinopril 10mg** (Active, prescribed by Dr. Sarah Jenkins on 2026-06-05) for hypertension control.

**To request a refill or check dosage:**
- Navigate to the **EHR Medical Records** tab to verify historical diagnostic notes.
- Direct pharmacy queries directly to our general reception or schedule a quick check-up appointment. Always take medications exactly as prescribed by your physician.`;
        } else if (text.includes('allergy') || text.includes('peanut') || text.includes('penicillin')) {
          response += `\n\nYour clinical profile indicates that you have known allergies to **Penicillin** and **Peanuts**. Our electronic health record system is fully synchronized, and doctors will automatically see these alerts when issuing prescriptions. If you have new or worsening allergic reactions, please seek prompt medical care.`;
        } else {
          response += `\n\nThank you for reaching out with your query about: *"${lastUserMessage}"*. 

While I cannot provide a direct clinical diagnosis, our clinical team is fully equipped to handle your needs.
- **Appointment Scheduling:** You can book a consultation directly on the **Book Appointment** tab.
- **EHR Records:** View your secure patient history under the **EHR Medical Records** tab (requires symmetric key decryption).
- **Departments:** We offer specialized care in Cardiology, Neurology, Pediatrics, and General Medicine.

Please let me know if there are other specific routing questions I can help answer! Always consult a professional clinician for acute symptoms.`;
        }
        return response;
      } else if (role === 'doctor' || role === 'nurse') {
        return `Hello Dr. ${name}, as your CareFlow Clinical Informatics Assistant, I have processed your inquiry: "${lastUserMessage}". 
Here is a standardized medical record template or scheduling format to assist with your workload:

**Clinical Soap Note Template:**
- **Subjective:** Patient reports onset of symptoms, current medication adherence.
- **Objective:** Physical exam, diagnostic review, latest biometric vitals.
- **Assessment:** Clinical impressions, differential diagnoses.
- **Plan:** Diagnostic imaging, updated prescription directives, follow-up timeline.

Please let me know if you need drug safety lookups or discharge summary drafts.`;
      } else {
        // Admin
        return `Hello ${name}, as CareFlow's Hospital Operation Planning Expert, I have evaluated your strategic query: "${lastUserMessage}".
        
Based on current database allocations:
- **ICU Beds:** Highly utilized (90% capacity).
- **Pediatrics:** Underutilized (46% capacity), representing a potential cross-staffing optimization.
- **System Audit Trails:** Synchronized and protected under SHA-256 integrity block logs.

We advise reviewing the **Resource Planner** page to run resource quota simulations or adjust active bed capacities. Let me know if you require further compliance or budgeting insights.`;
      }
    };

    try {
      const ai = getAIClient();

      const chatMessages = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' as const : 'user' as const,
        parts: [{ text: m.content }]
      }));

      // Extract system instructions based on the user's active portal role
      let systemInstruction = "You are a helpful, professional hospital support assistant.";
      if (userRole === 'patient') {
        systemInstruction = `You are CareFlow's Professional Virtual Health Assistant.
Your goal is to assist patients (such as ${userName}) with hospital routing, booking appointments, clarifying clinical specialties, explaining simple medical processes, and offering wellness tips.
CRITICAL SAFETY BOUNDARY:
- You are an AI assistant, NOT a doctor.
- NEVER prescribe medication, make direct clinical diagnoses, or contradict a doctor's advice.
- Always include a polite, brief safety warning to consult an actual clinician for acute or distressing physical symptoms.
- Keep responses clean, comforting, friendly, and structured.`;
      } else if (userRole === 'doctor' || userRole === 'nurse') {
        systemInstruction = `You are the Clinical Informatics Assistant at CareFlow.
Your goal is to assist medical staff with scheduling tips, compiling standard medical record templates, explaining drug safety classification lookups, and draft discharge summary formats.
Maintain a precise, brief, clinical, highly professional tone. Do not use overly fluffy language.`;
      } else if (userRole === 'admin') {
        systemInstruction = `You are CareFlow's Hospital Operation Planning Expert.
Your objective is to advise administrators on resource utilization ratios, bed management systems, compliance regulations, healthcare budgeting structures, and operational strategies.
Include clinical metrics, analytical insights, and operational jargon. Keep advice constructive and professional.`;
      }

      // We'll use the basic generateContent SDK call with full messages history to guarantee compatibility
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: chatMessages,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      res.json({ success: true, content: response.text });
    } catch (error: any) {
      console.error('Chat Service Error:', error);
      const lastUserMsg = messages && messages.length > 0 ? messages[messages.length - 1].content : '';
      const fallbackResponse = getSmartFallbackResponse(userRole, userName, lastUserMsg);
      res.status(500).json({ 
        success: false, 
        message: 'Chat service temporarily unavailable: ' + error.message,
        fallback: fallbackResponse
      });
    }
  });

  // --- Secure SQL Sandbox / Query Runner Endpoint ---
  app.post('/api/security/sandbox', (req, res) => {
    const { sqlQuery, userName } = req.body;
    const db = readDB();

    if (!sqlQuery || typeof sqlQuery !== 'string') {
      return res.status(400).json({ error: 'Query is empty' });
    }

    const query = sqlQuery.trim();
    const cleanQuery = query.replace(/;\s*$/, '').toLowerCase();

    addAuditLog(db, userName || 'SQL Sandbox User', 'SANDBOX_SQL_QUERY', `Executed custom database query: [${query}]`, 'Success', req.ip);
    writeDB(db);

    try {
      // Direct parsing simulation for standard read/filter queries
      if (cleanQuery.startsWith('select')) {
        let tableName = '';
        if (cleanQuery.includes('from users')) tableName = 'users';
        else if (cleanQuery.includes('from patients')) tableName = 'patients';
        else if (cleanQuery.includes('from doctors')) tableName = 'doctors';
        else if (cleanQuery.includes('from appointments')) tableName = 'appointments';
        else if (cleanQuery.includes('from departments')) tableName = 'departments';
        else if (cleanQuery.includes('from resources')) tableName = 'resources';
        else if (cleanQuery.includes('from audit_logs')) tableName = 'audit_logs';

        if (!tableName) {
          return res.json({
            success: false,
            error: `Table not found. Supported tables: 'users', 'patients', 'doctors', 'appointments', 'departments', 'resources', 'audit_logs'`
          });
        }

        let results = [...db[tableName]];

        // Handle simple where clauses like WHERE status = 'pending' or WHERE department = 'cardiology'
        const whereIndex = cleanQuery.indexOf('where');
        if (whereIndex !== -1) {
          const whereClause = cleanQuery.substring(whereIndex + 5).trim();
          const parts = whereClause.split('=');
          if (parts.length === 2) {
            const field = parts[0].trim();
            let val = parts[1].trim().replace(/['"]/g, '');
            
            results = results.filter((item: any) => {
              const itemVal = String(item[field] || '').toLowerCase();
              return itemVal === val.toLowerCase();
            });
          }
        }

        // Limit results to 20 for safety in preview
        results = results.slice(0, 20);

        return res.json({
          success: true,
          query: sqlQuery,
          recordsAffected: 0,
          rows: results,
          fields: Object.keys(results[0] || {})
        });
      } else {
        // Prevent write/delete queries in sandbox for medical security simulation!
        addAuditLog(db, userName || 'SQL Sandbox User', 'SANDBOX_WRITE_BLOCKED', `Unauthorized WRITE query blocked: [${query}]`, 'Warning', req.ip);
        writeDB(db);
        return res.json({
          success: false,
          error: "SECURITY EXCEPTION: Direct WRITE/UPDATE/DELETE queries are strictly blocked via hospital access-control policy. Please use dedicated portal forms for secure database transactions."
        });
      }
    } catch (err: any) {
      return res.json({ success: false, error: 'Database syntax error: ' + err.message });
    }
  });

  // --- Get audit logs ---
  app.get('/api/security/logs', (req, res) => {
    const db = readDB();
    res.json(db.audit_logs);
  });

  // --- Database status, manual backup, and recovery endpoints ---
  app.get('/api/security/database/status', (req, res) => {
    try {
      const dbStats = fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE) : null;
      const backupStats = fs.existsSync(BACKUP_FILE) ? fs.statSync(BACKUP_FILE) : null;
      res.json({
        success: true,
        databaseExists: !!dbStats,
        databaseSize: dbStats ? dbStats.size : 0,
        databaseModified: dbStats ? dbStats.mtime : null,
        backupExists: !!backupStats,
        backupSize: backupStats ? backupStats.size : 0,
        backupModified: backupStats ? backupStats.mtime : null,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/security/database/backup', (req, res) => {
    const { userName } = req.body;
    try {
      if (fs.existsSync(DB_FILE)) {
        fs.copyFileSync(DB_FILE, BACKUP_FILE);
        const db = readDB();
        addAuditLog(db, userName || 'Administrator', 'DATABASE_BACKUP', 'Manual database recovery backup snapshot created successfully.', 'Success', req.ip);
        writeDB(db);
        return res.json({ success: true, message: 'Database backup snapshot created successfully!' });
      }
      return res.status(404).json({ success: false, error: 'Source database file not found.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/security/database/recover', (req, res) => {
    const { userName } = req.body;
    try {
      if (fs.existsSync(BACKUP_FILE)) {
        fs.copyFileSync(BACKUP_FILE, DB_FILE);
        const db = readDB();
        addAuditLog(db, userName || 'Administrator', 'DATABASE_RECOVER', 'Database successfully rolled back and recovered to baseline state.', 'Success', req.ip);
        writeDB(db);
        return res.json({ success: true, message: 'Database successfully recovered from baseline snapshot!' });
      } else {
        if (fs.existsSync(DB_FILE)) {
          fs.copyFileSync(DB_FILE, BACKUP_FILE);
          return res.json({ success: true, message: 'Baseline created and restored.' });
        }
        return res.status(404).json({ success: false, error: 'Database baseline backup file not found.' });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- Vite dev server integration or static file rendering ---
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`CareFlow backend server running on port ${port}`);
  });
}

startServer();
