/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Activity, Scale, Heart, TrendingUp, PlusCircle, Trash2, Calendar, Check, Sparkles } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface EHRVitalsProps {
  patientId: string;
}

export interface EHRVitalRecord {
  date: string;
  weight: number;
  systolic: number;
  diastolic: number;
  heartRate: number;
}

// Default historical data for the main demo patients
const DEFAULT_PATIENT_VITALS: Record<string, EHRVitalRecord[]> = {
  'p-101': [
    { date: '2026-02-10', weight: 182, systolic: 130, diastolic: 85, heartRate: 72 },
    { date: '2026-03-12', weight: 180, systolic: 128, diastolic: 82, heartRate: 70 },
    { date: '2026-04-15', weight: 179, systolic: 124, diastolic: 80, heartRate: 68 },
    { date: '2026-05-20', weight: 176, systolic: 122, diastolic: 78, heartRate: 66 },
    { date: '2026-06-18', weight: 175, systolic: 119, diastolic: 77, heartRate: 65 },
    { date: '2026-07-17', weight: 174, systolic: 118, diastolic: 76, heartRate: 64 },
  ],
  'p-102': [
    { date: '2026-02-15', weight: 145, systolic: 126, diastolic: 82, heartRate: 78 },
    { date: '2026-03-20', weight: 144, systolic: 124, diastolic: 80, heartRate: 75 },
    { date: '2026-04-22', weight: 146, systolic: 122, diastolic: 79, heartRate: 74 },
    { date: '2026-05-25', weight: 145, systolic: 120, diastolic: 78, heartRate: 72 },
    { date: '2026-06-28', weight: 147, systolic: 122, diastolic: 80, heartRate: 73 },
    { date: '2026-07-17', weight: 146, systolic: 121, diastolic: 79, heartRate: 70 },
  ]
};

export default function EHRVitals({ patientId }: EHRVitalsProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'weight' | 'bp' | 'hr'>('all');
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // Form states
  const [inputDate, setInputDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [inputWeight, setInputWeight] = useState<number>(150);
  const [inputSystolic, setInputSystolic] = useState<number>(120);
  const [inputDiastolic, setInputDiastolic] = useState<number>(80);
  const [inputHeartRate, setInputHeartRate] = useState<number>(72);

  // Local state to store custom added logs and override defaults
  const [customVitals, setCustomVitals] = useState<Record<string, EHRVitalRecord[]>>(() => {
    try {
      const stored = localStorage.getItem('careflow_ehr_vitals');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Save to localStorage whenever custom logs change
  useEffect(() => {
    localStorage.setItem('careflow_ehr_vitals', JSON.stringify(customVitals));
  }, [customVitals]);

  // Merge default records and custom records
  const patientRecords = useMemo(() => {
    let baseRecords: EHRVitalRecord[] = [];

    if (DEFAULT_PATIENT_VITALS[patientId]) {
      baseRecords = [...DEFAULT_PATIENT_VITALS[patientId]];
    } else {
      // Seed dynamically based on patientId to keep it consistent
      const seed = patientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const seedRandom = (offset: number, min: number, max: number) => {
        const val = Math.sin(seed + offset) * 10000;
        const r = val - Math.floor(val);
        return Math.floor(r * (max - min + 1)) + min;
      };

      const startWeight = 110 + (seed % 100);
      const startSystolic = 110 + (seed % 30);
      const startDiastolic = 70 + (seed % 15);
      const startHeartRate = 60 + (seed % 25);

      const months = ['02', '03', '04', '05', '06', '07'];
      baseRecords = months.map((month, idx) => {
        const weightDrift = seedRandom(idx * 1.5, -4, 4);
        const sysDrift = seedRandom(idx * 2.5, -6, 8);
        const diaDrift = seedRandom(idx * 3.5, -4, 4);
        const hrDrift = seedRandom(idx * 4.5, -8, 8);

        return {
          date: `2026-${month}-15`,
          weight: startWeight + weightDrift,
          systolic: startSystolic + sysDrift,
          diastolic: startDiastolic + diaDrift,
          heartRate: startHeartRate + hrDrift
        };
      });
    }

    // Append any custom added records for this patient
    const customList = customVitals[patientId] || [];
    const merged = [...baseRecords, ...customList];

    // Sort by date chronologically
    return merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [patientId, customVitals]);

  // Set default values for form input based on last record
  useEffect(() => {
    if (patientRecords.length > 0) {
      const lastRecord = patientRecords[patientRecords.length - 1];
      setInputWeight(lastRecord.weight);
      setInputSystolic(lastRecord.systolic);
      setInputDiastolic(lastRecord.diastolic);
      setInputHeartRate(lastRecord.heartRate);
    } else {
      setInputWeight(150);
      setInputSystolic(120);
      setInputDiastolic(80);
      setInputHeartRate(72);
    }
    setInputDate(new Date().toISOString().split('T')[0]);
    setIsConfirmingClear(false);
  }, [patientId, patientRecords.length]);

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();

    const newRecord: EHRVitalRecord = {
      date: inputDate,
      weight: Number(inputWeight),
      systolic: Number(inputSystolic),
      diastolic: Number(inputDiastolic),
      heartRate: Number(inputHeartRate)
    };

    setCustomVitals(prev => {
      const currentList = prev[patientId] || [];
      // Avoid duplicate dates if possible or overwrite
      const filtered = currentList.filter(item => item.date !== inputDate);
      return {
        ...prev,
        [patientId]: [...filtered, newRecord]
      };
    });

    setSuccessMsg('Vital signs successfully registered to EHR ledger');
    setIsAddingLog(false);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleClearCustomRecords = () => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      return;
    }
    setCustomVitals(prev => {
      const copy = { ...prev };
      delete copy[patientId];
      return copy;
    });
    setSuccessMsg('Reverted patient vitals to default baseline records.');
    setIsConfirmingClear(false);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Format date for chart XAxis labels
  const chartData = useMemo(() => {
    return patientRecords.map(r => {
      const dateObj = new Date(r.date + 'T00:00:00');
      const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        ...r,
        formattedDate: label,
        fullDateStr: dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      };
    });
  }, [patientRecords]);

  // Calculate high-level aggregates
  const stats = useMemo(() => {
    if (patientRecords.length === 0) return { avgWeight: 0, avgBP: '0/0', avgHR: 0 };
    const totalWeight = patientRecords.reduce((acc, curr) => acc + curr.weight, 0);
    const totalSys = patientRecords.reduce((acc, curr) => acc + curr.systolic, 0);
    const totalDia = patientRecords.reduce((acc, curr) => acc + curr.diastolic, 0);
    const totalHR = patientRecords.reduce((acc, curr) => acc + curr.heartRate, 0);

    const len = patientRecords.length;
    return {
      avgWeight: Math.round((totalWeight / len) * 10) / 10,
      avgBP: `${Math.round(totalSys / len)}/${Math.round(totalDia / len)}`,
      avgHR: Math.round(totalHR / len)
    };
  }, [patientRecords]);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4" id="patient-ehr-vitals-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600 animate-pulse" />
            Patient Vitals History (EHR)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">Historical clinical track record of weight, blood pressure, and heart rate</p>
        </div>

        {/* Metric Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              All Metrics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('weight')}
              className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                activeTab === 'weight'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              Weight
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bp')}
              className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                activeTab === 'bp'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              Blood Pressure
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hr')}
              className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                activeTab === 'hr'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-950'
              }`}
            >
              Heart Rate
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsAddingLog(!isAddingLog)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer flex items-center gap-1 shrink-0"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Record Vitals</span>
            </button>
            {(customVitals[patientId] && customVitals[patientId].length > 0) && (
              <button
                type="button"
                onClick={handleClearCustomRecords}
                onMouseLeave={() => setIsConfirmingClear(false)}
                title={isConfirmingClear ? "Click again to confirm reset" : "Reset to baseline"}
                className={`transition-all duration-200 p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer select-none ${
                  isConfirmingClear
                    ? "bg-rose-500 text-white border-rose-500 hover:bg-rose-600 animate-pulse font-bold"
                    : "bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border-slate-200 hover:border-red-200"
                }`}
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                {isConfirmingClear && <span className="text-[10px] font-bold">Click to Confirm Reset</span>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium animate-fadeIn">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Add New Vital Sign Record Form */}
      {isAddingLog && (
        <form onSubmit={handleAddRecord} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4 animate-slideDown shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h5 className="text-xs font-bold uppercase text-indigo-900 tracking-wider flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-600" />
              Add Vital Check Record
            </h5>
            <button
              type="button"
              onClick={() => setIsAddingLog(false)}
              className="text-[11px] text-slate-400 hover:text-slate-700 font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Record Date</label>
              <input
                type="date"
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Weight (lbs)</label>
              <input
                type="number"
                min="30"
                max="500"
                value={inputWeight}
                onChange={(e) => setInputWeight(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Systolic BP</label>
              <input
                type="number"
                min="60"
                max="250"
                value={inputSystolic}
                onChange={(e) => setInputSystolic(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Diastolic BP</label>
              <input
                type="number"
                min="40"
                max="150"
                value={inputDiastolic}
                onChange={(e) => setInputDiastolic(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Heart Rate (BPM)</label>
              <input
                type="number"
                min="30"
                max="220"
                value={inputHeartRate}
                onChange={(e) => setInputHeartRate(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-lg transition shadow hover:shadow-md cursor-pointer"
          >
            Record Vital Entry to Ledger
          </button>
        </form>
      )}

      {/* Stats Quick Readout Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg text-center flex flex-col justify-center">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-center gap-1">
            <Scale className="h-3 w-3 text-emerald-600" />
            Avg Weight
          </span>
          <span className="text-md sm:text-lg font-black text-slate-800 block mt-1 font-mono">
            {stats.avgWeight} <span className="text-[9px] font-semibold text-slate-500">lbs</span>
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg text-center flex flex-col justify-center">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-center gap-1">
            <TrendingUp className="h-3 w-3 text-indigo-600" />
            Avg Pressure
          </span>
          <span className="text-md sm:text-lg font-black text-slate-800 block mt-1 font-mono">
            {stats.avgBP} <span className="text-[9px] font-semibold text-slate-500">mmHg</span>
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg text-center flex flex-col justify-center">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-center gap-1">
            <Heart className="h-3 w-3 text-pink-500" />
            Avg Heart Rate
          </span>
          <span className="text-md sm:text-lg font-black text-slate-800 block mt-1 font-mono">
            {stats.avgHR} <span className="text-[9px] font-semibold text-slate-500">BPM</span>
          </span>
        </div>
      </div>

      {/* Main Longitudinal Trend Chart */}
      <div className="w-full h-[240px] border border-slate-150 rounded-xl p-3 bg-slate-50/30 relative flex flex-col justify-center">
        {chartData.length === 0 ? (
          <p className="text-center text-xs text-slate-400 italic font-semibold">No patient biometric records found.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="formattedDate"
                stroke="#94a3b8"
                fontSize={10}
                fontWeight={500}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={10}
                fontWeight={500}
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 15', 'dataMax + 15']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white/95 border border-slate-200 p-2.5 rounded-lg shadow-lg text-[11px] text-slate-700 min-w-[130px] space-y-1">
                        <p className="font-extrabold text-slate-900 border-b border-slate-100 pb-0.5 mb-1">{data.fullDateStr}</p>
                        {(activeTab === 'all' || activeTab === 'weight') && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1 font-semibold text-slate-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              Weight:
                            </span>
                            <span className="font-mono font-bold text-slate-900">{data.weight} lbs</span>
                          </div>
                        )}
                        {(activeTab === 'all' || activeTab === 'bp') && (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1 font-semibold text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                                Systolic:
                              </span>
                              <span className="font-mono font-bold text-slate-900">{data.systolic} mmHg</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1 font-semibold text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-pink-500"></span>
                                Diastolic:
                              </span>
                              <span className="font-mono font-bold text-slate-900">{data.diastolic} mmHg</span>
                            </div>
                          </>
                        )}
                        {(activeTab === 'all' || activeTab === 'hr') && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1 font-semibold text-slate-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                              Heart Rate:
                            </span>
                            <span className="font-mono font-bold text-slate-900">{data.heartRate} BPM</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                height={28}
                iconType="circle"
                iconSize={6}
                wrapperStyle={{ fontSize: '10px', fontWeight: 600 }}
              />

              {(activeTab === 'all' || activeTab === 'weight') && (
                <Line
                  name="Weight (lbs)"
                  type="monotone"
                  dataKey="weight"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              )}

              {(activeTab === 'all' || activeTab === 'bp') && (
                <Line
                  name="Systolic BP (mmHg)"
                  type="monotone"
                  dataKey="systolic"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              )}

              {(activeTab === 'all' || activeTab === 'bp') && (
                <Line
                  name="Diastolic BP (mmHg)"
                  type="monotone"
                  dataKey="diastolic"
                  stroke="#ec4899"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              )}

              {(activeTab === 'all' || activeTab === 'hr') && (
                <Line
                  name="Heart Rate (BPM)"
                  type="monotone"
                  dataKey="heartRate"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 flex items-start gap-2 text-[10px] text-slate-500 font-semibold leading-relaxed">
        <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
        <span>
          <strong>Clinical Analysis:</strong> Longitudinal vitals track record supports baseline stability checks during each scheduled visit. Deviations outside 20% of moving average should trigger immediate physician triage review.
        </span>
      </div>
    </div>
  );
}
