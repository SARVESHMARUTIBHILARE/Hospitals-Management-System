/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Activity, Heart, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
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

interface Vitals30DaysProps {
  patientId: string;
}

export default function Vitals30Days({ patientId }: Vitals30DaysProps) {
  const [filter, setFilter] = useState<'all' | 'bp' | 'hr'>('all');

  // Generate 30 days of daily data based on patientId
  const vitalsData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    // Seed random generator based on patientId to keep the data consistent per patient
    let seed = 0;
    for (let i = 0; i < patientId.length; i++) {
      seed += patientId.charCodeAt(i);
    }
    
    const pseudoRandom = (min: number, max: number, offset: number) => {
      const val = Math.sin(seed + offset * 1.7) * 10000;
      const r = val - Math.floor(val);
      return Math.floor(r * (max - min + 1)) + min;
    };

    // Generate 30 points (one for each day)
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const dayStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Base values with realistic ranges and slight drift
      const bpBase = patientId === 'p-101' ? 122 : patientId === 'p-102' ? 125 : 108;
      const hrBase = patientId === 'p-101' ? 68 : patientId === 'p-102' ? 74 : 72;

      // Small day-to-day fluctuations
      const systolic = bpBase + pseudoRandom(-6, 8, i);
      const diastolic = Math.round(systolic * 0.65) + pseudoRandom(-4, 4, i + 50);
      const heartRate = hrBase + pseudoRandom(-8, 10, i + 100);

      data.push({
        day: dayStr,
        systolic,
        diastolic,
        heartRate,
        label: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      });
    }
    return data;
  }, [patientId]);

  // Compute 30-day aggregates
  const stats = useMemo(() => {
    if (vitalsData.length === 0) return { avgSys: 0, avgDia: 0, avgHR: 0, stability: 'Stable' };
    const sumSys = vitalsData.reduce((acc, curr) => acc + curr.systolic, 0);
    const sumDia = vitalsData.reduce((acc, curr) => acc + curr.diastolic, 0);
    const sumHR = vitalsData.reduce((acc, curr) => acc + curr.heartRate, 0);
    
    const avgSys = Math.round(sumSys / vitalsData.length);
    const avgDia = Math.round(sumDia / vitalsData.length);
    const avgHR = Math.round(sumHR / vitalsData.length);

    // Calculate stability based on variance
    const varianceSys = vitalsData.reduce((acc, curr) => acc + Math.pow(curr.systolic - avgSys, 2), 0) / vitalsData.length;
    const stability = varianceSys < 15 ? 'Excellent' : varianceSys < 25 ? 'Normal/Stable' : 'Fluctuating';

    return {
      avgSys,
      avgDia,
      avgHR,
      stability,
    };
  }, [vitalsData]);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5" id="vitals-30days-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            30-Day Vitals Trend Analysis
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Continuous longitudinal biometrics record over the last 30 days</p>
        </div>

        {/* Filters */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`text-xs px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Vitals
          </button>
          <button
            type="button"
            onClick={() => setFilter('bp')}
            className={`text-xs px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
              filter === 'bp'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Blood Pressure
          </button>
          <button
            type="button"
            onClick={() => setFilter('hr')}
            className={`text-xs px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
              filter === 'hr'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Heart Rate
          </button>
        </div>
      </div>

      {/* Stats Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-50/20 p-4 rounded-xl border border-indigo-100/80">
          <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            30-Day Average BP
          </span>
          <span className="text-2xl font-black text-indigo-950 block mt-1.5 font-mono">
            {stats.avgSys}/{stats.avgDia} <span className="text-xs font-semibold text-indigo-500">mmHg</span>
          </span>
          <p className="text-[10px] text-slate-500 mt-1">Target range is below 120/80 mmHg</p>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-50/20 p-4 rounded-xl border border-pink-100/80">
          <span className="text-[10px] text-pink-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
            <Heart className="h-3 w-3" />
            30-Day Average HR
          </span>
          <span className="text-2xl font-black text-pink-950 block mt-1.5 font-mono">
            {stats.avgHR} <span className="text-xs font-semibold text-pink-500">BPM</span>
          </span>
          <p className="text-[10px] text-slate-500 mt-1">Resting range: 60 - 100 BPM</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/20 p-4 rounded-xl border border-emerald-100/80">
          <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Vitals Stability
          </span>
          <span className="text-2xl font-black text-emerald-950 block mt-1.5">
            {stats.stability}
          </span>
          <p className="text-[10px] text-slate-500 mt-1">Calculated based on daily pressure variance</p>
        </div>
      </div>

      {/* Chart Wrapper */}
      <div className="w-full h-[320px] border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-center relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={vitalsData}
            margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#94a3b8"
              fontSize={10}
              fontWeight={500}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              fontWeight={500}
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 10', 'dataMax + 10']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white/95 border border-slate-200/80 p-3 rounded-lg shadow-xl backdrop-blur-sm space-y-1.5 text-xs text-slate-700 min-w-[140px]">
                      <p className="font-extrabold text-slate-900 border-b border-slate-100 pb-1 mb-1">{data.label}</p>
                      {(filter === 'all' || filter === 'bp') && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5 font-medium text-slate-500">
                            <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                            Systolic:
                          </span>
                          <span className="font-mono font-black text-slate-900">{data.systolic} mmHg</span>
                        </div>
                      )}
                      {(filter === 'all' || filter === 'bp') && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5 font-medium text-slate-500">
                            <span className="h-2 w-2 rounded-full bg-pink-500"></span>
                            Diastolic:
                          </span>
                          <span className="font-mono font-black text-slate-900">{data.diastolic} mmHg</span>
                        </div>
                      )}
                      {(filter === 'all' || filter === 'hr') && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5 font-medium text-slate-500">
                            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                            Heart Rate:
                          </span>
                          <span className="font-mono font-black text-slate-900">{data.heartRate} BPM</span>
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
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingBottom: '10px' }}
            />
            
            {(filter === 'all' || filter === 'bp') && (
              <Line
                name="Systolic BP (mmHg)"
                type="monotone"
                dataKey="systolic"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 1.5, fill: '#fff' }}
              />
            )}
            
            {(filter === 'all' || filter === 'bp') && (
              <Line
                name="Diastolic BP (mmHg)"
                type="monotone"
                dataKey="diastolic"
                stroke="#ec4899"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, stroke: '#ec4899', strokeWidth: 1.5, fill: '#fff' }}
              />
            )}
            
            {(filter === 'all' || filter === 'hr') && (
              <Line
                name="Heart Rate (BPM)"
                type="monotone"
                dataKey="heartRate"
                stroke="#f43f5e"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, stroke: '#f43f5e', strokeWidth: 1.5, fill: '#fff' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-start gap-2 text-[11px] text-slate-600 font-medium">
        <AlertCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
        <span>
          <strong>Biometric Analysis:</strong> Over the last 30 days, your cardiac stability metrics indicate stable adaptation. Diurnal variations are well within baseline ranges. Continue active dietary and medical plan compliance.
        </span>
      </div>
    </div>
  );
}
