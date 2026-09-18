/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, PlusCircle, Heart, Plus } from 'lucide-react';
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

export interface VitalLog {
  date: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
}

interface VitalsHistoryProps {
  activeVitals: VitalLog[];
  activeChartTab: 'bp' | 'hr' | 'all';
  setActiveChartTab: (tab: 'bp' | 'hr' | 'all') => void;
  isAddingLog: boolean;
  setIsAddingLog: (val: boolean) => void;
  newSystolic: number;
  setNewSystolic: (val: number) => void;
  newDiastolic: number;
  setNewDiastolic: (val: number) => void;
  newHeartRate: number;
  setNewHeartRate: (val: number) => void;
  newVitalDate: string;
  setNewVitalDate: (val: string) => void;
  handleAddVitalLog: (e: React.FormEvent) => void;
  localSuccess: string;
}

export default function VitalsHistory({
  activeVitals,
  activeChartTab,
  setActiveChartTab,
  isAddingLog,
  setIsAddingLog,
  newSystolic,
  setNewSystolic,
  newDiastolic,
  setNewDiastolic,
  newHeartRate,
  setNewHeartRate,
  newVitalDate,
  setNewVitalDate,
  handleAddVitalLog,
  localSuccess,
}: VitalsHistoryProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            Personal Health Vitals Trend
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Biometrics track history and trend pattern analyzer</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveChartTab('bp')}
              className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                activeChartTab === 'bp'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              BP Only
            </button>
            <button
              onClick={() => setActiveChartTab('hr')}
              className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                activeChartTab === 'hr'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              HR Only
            </button>
            <button
              onClick={() => setActiveChartTab('all')}
              className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                activeChartTab === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Vitals
            </button>
          </div>

          <button
            onClick={() => setIsAddingLog(!isAddingLog)}
            className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Log Vitals
          </button>
        </div>
      </div>

      {/* Dynamic inline notification */}
      {localSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 font-medium animate-fadeIn">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
          {localSuccess}
        </div>
      )}

      {/* Add Vital Log Form */}
      {isAddingLog && (
        <form onSubmit={handleAddVitalLog} className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3 animate-slideDown">
          <h4 className="text-xs font-bold uppercase text-slate-600 tracking-wider">Record New Vital Measurements</h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Log Date</label>
              <input
                type="date"
                value={newVitalDate}
                onChange={(e) => setNewVitalDate(e.target.value)}
                className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase">BP Systolic (mmHg)</label>
              <input
                type="number"
                min="70"
                max="220"
                value={newSystolic}
                onChange={(e) => setNewSystolic(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase">BP Diastolic (mmHg)</label>
              <input
                type="number"
                min="40"
                max="130"
                value={newDiastolic}
                onChange={(e) => setNewDiastolic(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Heart Rate (BPM)</label>
              <input
                type="number"
                min="40"
                max="200"
                value={newHeartRate}
                onChange={(e) => setNewHeartRate(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingLog(false)}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-md text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 transition cursor-pointer shadow-sm"
            >
              Save Measurements
            </button>
          </div>
        </form>
      )}

      {/* The Recharts Plot */}
      <div className="w-full h-[300px] border border-slate-100 rounded-lg p-2 bg-slate-50/50 flex flex-col justify-center">
        {activeVitals.length === 0 ? (
          <p className="text-sm text-slate-400 text-center">No health vitals logged yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={activeVitals}
              margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[
                  (dataMin: number) => Math.max(0, Math.floor(dataMin * 0.9)),
                  (dataMax: number) => Math.ceil(dataMax * 1.1)
                ]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '12px'
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', fontWeight: 500 }}
              />
              
              {(activeChartTab === 'bp' || activeChartTab === 'all') && (
                <Line
                  name="Systolic BP (mmHg)"
                  type="monotone"
                  dataKey="systolic"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, stroke: '#6366f1', strokeWidth: 1.5, fill: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              )}
              
              {(activeChartTab === 'bp' || activeChartTab === 'all') && (
                <Line
                  name="Diastolic BP (mmHg)"
                  type="monotone"
                  dataKey="diastolic"
                  stroke="#ec4899"
                  strokeWidth={2.5}
                  dot={{ r: 4, stroke: '#ec4899', strokeWidth: 1.5, fill: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              )}
              
              {(activeChartTab === 'hr' || activeChartTab === 'all') && (
                <Line
                  name="Heart Rate (BPM)"
                  type="monotone"
                  dataKey="heartRate"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={{ r: 4, stroke: '#f43f5e', strokeWidth: 1.5, fill: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
