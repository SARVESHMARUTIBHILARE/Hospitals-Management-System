/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Activity,
  Table,
  Search,
  ArrowRight
} from 'lucide-react';
import { AuditLog, Appointment } from '../types';

interface QueryDistributionVisualizerProps {
  queryResult: {
    columns: string[];
    rows: Record<string, any>[];
  } | null;
  activeQuery: string;
  onRunQuery: (sql: string) => void;
  auditLogs: AuditLog[];
  appointments: Appointment[];
}

const PALETTE = [
  '#4f46e5', // Indigo
  '#0284c7', // Sky
  '#0d9488', // Teal
  '#16a34a', // Emerald
  '#d97706', // Amber
  '#dc2626', // Red
  '#9333ea', // Purple
  '#db2777', // Pink
  '#475569', // Slate
  '#2563eb'  // Blue
];

const STATUS_COLOR_MAP: Record<string, string> = {
  Success: '#16a34a',
  Approved: '#16a34a',
  Completed: '#16a34a',
  Signed: '#16a34a',
  Routine: '#0284c7',
  Warning: '#d97706',
  Pending: '#d97706',
  Draft: '#d97706',
  Urgent: '#ea580c',
  Error: '#dc2626',
  Failed: '#dc2626',
  Emergency: '#dc2626',
  Cancelled: '#64748b'
};

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const dataObj = item.payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs font-sans space-y-1.5 z-50">
        <div className="flex items-center gap-1.5 border-b border-slate-700 pb-1 font-bold text-slate-200">
          <Activity className="h-3.5 w-3.5 text-indigo-400" />
          <span>{label || dataObj?.name || 'Category'}</span>
        </div>
        <div className="flex items-center justify-between gap-6 font-mono text-[11px]">
          <span className="text-slate-400">Total Records:</span>
          <span className="font-bold text-indigo-400">{item.value}</span>
        </div>
        {dataObj && dataObj.percentage !== undefined && (
          <div className="flex items-center justify-between gap-6 font-mono text-[11px]">
            <span className="text-slate-400">Distribution Share:</span>
            <span className="font-bold text-emerald-400">{dataObj.percentage}%</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function QueryDistributionVisualizer({
  queryResult,
  activeQuery,
  onRunQuery,
  auditLogs,
  appointments
}: QueryDistributionVisualizerProps) {
  // Determine effective dataset:
  // If queryResult is available and has rows, use it.
  // Otherwise, default to appointments or auditLogs as baseline dataset.
  const isQueryResultActive = Boolean(queryResult && queryResult.rows && queryResult.rows.length > 0);
  
  const effectiveRows: Record<string, any>[] = useMemo(() => {
    if (isQueryResultActive && queryResult) {
      return queryResult.rows;
    }
    // Baseline default
    return appointments.length > 0 ? appointments : auditLogs;
  }, [isQueryResultActive, queryResult, appointments, auditLogs]);

  // Detect dataset nature
  const isAppointmentData = useMemo(() => {
    return effectiveRows.some((r) => 'department' in r || 'urgency' in r || 'doctorName' in r);
  }, [effectiveRows]);

  const isLogData = useMemo(() => {
    return effectiveRows.some((r) => 'action' in r || 'hash' in r || ('details' in r && 'status' in r));
  }, [effectiveRows]);

  // Available dimension fields
  const availableDimensions = useMemo(() => {
    if (effectiveRows.length === 0) return [];
    const first = effectiveRows[0];
    const keys = Object.keys(first);

    const preferred: { key: string; label: string }[] = [];

    if (isAppointmentData) {
      if (keys.includes('department')) preferred.push({ key: 'department', label: 'Department' });
      if (keys.includes('status')) preferred.push({ key: 'status', label: 'Appointment Status' });
      if (keys.includes('urgency')) preferred.push({ key: 'urgency', label: 'Urgency Level' });
      if (keys.includes('doctorName')) preferred.push({ key: 'doctorName', label: 'Attending Doctor' });
    } else if (isLogData) {
      if (keys.includes('action')) preferred.push({ key: 'action', label: 'Action Type' });
      if (keys.includes('status')) preferred.push({ key: 'status', label: 'Status' });
      if (keys.includes('user')) preferred.push({ key: 'user', label: 'User / Operator' });
    }

    // Include other potential string columns that have multiple distinct values
    keys.forEach((k) => {
      if (!preferred.some((p) => p.key === k)) {
        const val = first[k];
        if (typeof val === 'string' && val.length < 50 && !k.toLowerCase().includes('id') && !k.toLowerCase().includes('timestamp') && !k.toLowerCase().includes('date') && !k.toLowerCase().includes('hash')) {
          preferred.push({
            key: k,
            label: k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1')
          });
        }
      }
    });

    return preferred;
  }, [effectiveRows, isAppointmentData, isLogData]);

  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [chartType, setChartType] = useState<'both' | 'bar' | 'pie'>('both');
  const [filterText, setFilterText] = useState<string>('');
  const [customSql, setCustomSql] = useState<string>(activeQuery || 'SELECT * FROM appointments;');

  // Sync selectedDimension when dataset changes
  useEffect(() => {
    if (availableDimensions.length > 0) {
      const exists = availableDimensions.some((d) => d.key === selectedDimension);
      if (!exists) {
        setSelectedDimension(availableDimensions[0].key);
      }
    }
  }, [availableDimensions, selectedDimension]);

  // Aggregate distribution
  const distributionData = useMemo(() => {
    if (!selectedDimension || effectiveRows.length === 0) return [];

    const counts: Record<string, number> = {};
    const filteredRows = filterText.trim()
      ? effectiveRows.filter((r) => {
          const str = JSON.stringify(r).toLowerCase();
          return str.includes(filterText.toLowerCase());
        })
      : effectiveRows;

    filteredRows.forEach((row) => {
      const rawVal = row[selectedDimension];
      const val =
        rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== ''
          ? String(rawVal)
          : 'Unspecified';
      counts[val] = (counts[val] || 0) + 1;
    });

    const total = filteredRows.length || 1;
    return Object.entries(counts)
      .map(([name, count], index) => ({
        name,
        count,
        percentage: Number(((count / total) * 100).toFixed(1)),
        color: STATUS_COLOR_MAP[name] || PALETTE[index % PALETTE.length]
      }))
      .sort((a, b) => b.count - a.count);
  }, [effectiveRows, selectedDimension, filterText]);

  // High-level statistics
  const stats = useMemo(() => {
    const totalRecords = effectiveRows.length;
    const topItem = distributionData.length > 0 ? distributionData[0] : null;
    const uniqueCategories = distributionData.length;

    // Calculate quality or priority metric
    let positiveCount = 0;
    if (isLogData) {
      positiveCount = effectiveRows.filter((r) => r.status === 'Success').length;
    } else if (isAppointmentData) {
      positiveCount = effectiveRows.filter((r) => r.status === 'Approved' || r.status === 'Completed').length;
    }
    const positiveRate = totalRecords > 0 ? ((positiveCount / totalRecords) * 100).toFixed(0) : '100';

    return {
      totalRecords,
      topItem,
      uniqueCategories,
      positiveRate
    };
  }, [effectiveRows, distributionData, isLogData, isAppointmentData]);

  const handleRunPreset = (sql: string) => {
    setCustomSql(sql);
    onRunQuery(sql);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSql.trim()) return;
    onRunQuery(customSql);
  };

  return (
    <div id="query-distribution-visualizer" className="space-y-6 animate-fadeIn">
      {/* Top Query Context & Execution Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white">Active SQL Query Result Visualizer</h3>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold ${
                  isQueryResultActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isQueryResultActive ? 'Live SQL Output' : 'Baseline Active Dataset'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                {isAppointmentData ? 'Visualizing Clinical Appointments distribution' : isLogData ? 'Visualizing Audit Logs & Ledger distribution' : 'Visualizing active dataset records'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">
              Active Dataset: <strong className="text-indigo-300">{stats.totalRecords} records</strong>
            </span>
          </div>
        </div>

        {/* Quick SQL Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              1-Click Query Presets (Instant Recharts Reload)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">careflow_db=#</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              id="preset-btn-appointments"
              onClick={() => handleRunPreset('SELECT * FROM appointments;')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-indigo-500/50 px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              <span>SELECT * FROM appointments;</span>
            </button>

            <button
              type="button"
              id="preset-btn-audit-logs"
              onClick={() => handleRunPreset('SELECT * FROM audit_logs;')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-indigo-500/50 px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              <span>SELECT * FROM audit_logs;</span>
            </button>

            <button
              type="button"
              id="preset-btn-apt-dept"
              onClick={() => handleRunPreset('SELECT department, status, urgency, doctorName FROM appointments;')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-indigo-500/50 px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Layers className="h-3.5 w-3.5 text-sky-400" />
              <span>SELECT department, urgency FROM appointments;</span>
            </button>

            <button
              type="button"
              id="preset-btn-log-action"
              onClick={() => handleRunPreset('SELECT action, status, user, timestamp FROM audit_logs;')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-indigo-500/50 px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Activity className="h-3.5 w-3.5 text-purple-400" />
              <span>SELECT action, status FROM audit_logs;</span>
            </button>
          </div>
        </div>

        {/* Inline custom SQL executor */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2 items-center pt-1">
          <div className="relative flex-grow">
            <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-xs font-bold select-none">
              SQL &gt;
            </span>
            <input
              id="distribution-sql-input"
              type="text"
              value={customSql}
              onChange={(e) => setCustomSql(e.target.value)}
              placeholder="SELECT * FROM appointments WHERE department = 'Cardiology';"
              className="w-full pl-14 pr-4 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500 placeholder-slate-600 shadow-inner"
            />
          </div>
          <button
            type="submit"
            id="distribution-run-sql-btn"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md shadow-indigo-900/30"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Query & Chart</span>
          </button>
        </form>
      </div>

      {/* Summary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Queried Records</span>
            <Table className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">{stats.totalRecords}</p>
          <p className="text-[10px] text-slate-400 font-medium">Rows currently in active result set</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Primary Category</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-lg font-black text-slate-900 truncate font-mono" title={stats.topItem?.name}>
            {stats.topItem ? stats.topItem.name : 'N/A'}
          </p>
          <p className="text-[10px] text-indigo-600 font-bold">
            {stats.topItem ? `${stats.topItem.count} rows (${stats.topItem.percentage}%)` : 'No data'}
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Unique Groups</span>
            <Layers className="h-4 w-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">{stats.uniqueCategories}</p>
          <p className="text-[10px] text-slate-400 font-medium">
            Distinct {availableDimensions.find((d) => d.key === selectedDimension)?.label || 'values'}
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>{isLogData ? 'Success Rate' : 'Approval / Completion'}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 font-mono tracking-tight">{stats.positiveRate}%</p>
          <p className="text-[10px] text-slate-400 font-medium">Verified healthy status share</p>
        </div>
      </div>

      {/* Control Filters & Dimension Selection */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Dimension selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-indigo-600" />
            Group By Dimension:
          </span>
          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {availableDimensions.map((dim) => (
              <button
                key={dim.key}
                type="button"
                id={`dim-btn-${dim.key}`}
                onClick={() => setSelectedDimension(dim.key)}
                className={`text-xs px-3 py-1.5 rounded-md font-bold transition cursor-pointer ${
                  selectedDimension === dim.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {dim.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart View Layout Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter categories..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 placeholder-slate-400"
            />
          </div>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setChartType('both')}
              className={`text-xs px-2.5 py-1.5 rounded font-bold transition cursor-pointer flex items-center gap-1 ${
                chartType === 'both' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Combined Side-by-Side"
            >
              <span>Both</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`text-xs px-2.5 py-1.5 rounded font-bold transition cursor-pointer flex items-center gap-1 ${
                chartType === 'bar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Bar Chart Only"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Bar</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('pie')}
              className={`text-xs px-2.5 py-1.5 rounded font-bold transition cursor-pointer flex items-center gap-1 ${
                chartType === 'pie' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Pie / Donut Chart Only"
            >
              <PieChartIcon className="h-3.5 w-3.5" />
              <span>Donut</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Recharts Section */}
      {distributionData.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3 shadow-sm">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">No Distribution Data for Selected Dimension</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The current active query result does not contain non-empty values for &quot;{selectedDimension}&quot;. Try selecting another dimension or running a preset query above.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className={`grid grid-cols-1 ${chartType === 'both' ? 'lg:grid-cols-2' : ''} gap-6`}>
            {/* Recharts Bar Chart */}
            {(chartType === 'both' || chartType === 'bar') && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                      Frequency Distribution ({availableDimensions.find((d) => d.key === selectedDimension)?.label || selectedDimension})
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">Volume Count</span>
                </div>

                <div className="h-[320px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={distributionData}
                      margin={{ top: 15, right: 20, left: 0, bottom: 45 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        angle={-20}
                        textAnchor="end"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        interval={0}
                        height={50}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        allowDecimals={false}
                      />
                      <RechartsTooltip content={<CustomChartTooltip />} />
                      <Bar dataKey="count" name="Records" radius={[6, 6, 0, 0]}>
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-bar-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recharts Pie / Donut Chart */}
            {(chartType === 'both' || chartType === 'pie') && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-indigo-600" />
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                      Proportional Ratio & Share Breakdown
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">Percentage</span>
                </div>

                <div className="h-[320px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={3}
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-pie-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomChartTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={45}
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Frequency Distribution Breakdown Table */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Table className="h-4 w-4 text-indigo-600" />
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  Category Frequency & Proportion Table
                </h4>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {distributionData.length} distinct segments
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                    <th className="p-3 font-bold">Category Name</th>
                    <th className="p-3 font-bold text-center">Record Volume</th>
                    <th className="p-3 font-bold">Share Distribution</th>
                    <th className="p-3 font-bold text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {distributionData.map((item, idx) => (
                    <tr
                      key={item.name}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition"
                    >
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        ></span>
                        <span>{item.name}</span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-800">
                        {item.count}
                      </td>
                      <td className="p-3">
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-xs">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${item.percentage}%`,
                              backgroundColor: item.color
                            }}
                          ></div>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-600">
                        {item.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
