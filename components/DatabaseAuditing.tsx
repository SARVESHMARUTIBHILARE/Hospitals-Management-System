/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Terminal, 
  ShieldAlert, 
  Key, 
  RefreshCw, 
  Download, 
  CheckCircle, 
  Server, 
  BarChart3, 
  Table, 
  ArrowRight,
  Activity
} from 'lucide-react';
import { AuditLog, Appointment } from '../types';
import QueryDistributionVisualizer from './QueryDistributionVisualizer';

interface DatabaseAuditingProps {
  queryInput: string;
  setQueryInput: (query: string) => void;
  handleExecuteQuery: (e: React.FormEvent, customQuery?: string) => void;
  queryResult: {
    columns: string[];
    rows: Record<string, any>[];
  } | null;
  selectedSchemaTable: 'patients' | 'doctors' | 'appointments' | 'departments' | 'resources' | 'audit_logs';
  setSelectedSchemaTable: (table: 'patients' | 'doctors' | 'appointments' | 'departments' | 'resources' | 'audit_logs') => void;
  getSchemaColumns: () => Array<{ name: string; type: string; constraints: string }>;
  auditLogs: AuditLog[];
  appointments?: Appointment[];
  onRunPreset?: (query: string) => void;
}

export default function DatabaseAuditing({
  queryInput,
  setQueryInput,
  handleExecuteQuery,
  queryResult,
  selectedSchemaTable,
  setSelectedSchemaTable,
  getSchemaColumns,
  auditLogs,
  appointments = [],
  onRunPreset,
}: DatabaseAuditingProps) {
  const [activeAuditingTab, setActiveAuditingTab] = useState<'sandbox' | 'distribution'>('sandbox');
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const fetchDbStatus = async () => {
    try {
      const res = await fetch('/api/security/database/status');
      const data = await res.json();
      if (data.success) {
        setDbStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch db status:', e);
    }
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);

  const handleBackup = async () => {
    setIsProcessing(true);
    setMsg('');
    setErr('');
    try {
      const res = await fetch('/api/security/database/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: 'Administrator' })
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Manual recovery backup snapshot created successfully!');
        fetchDbStatus();
      } else {
        setErr(data.error || 'Failed to back up.');
      }
    } catch (e) {
      setErr('Failed to execute backup.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecover = async () => {
    if (!window.confirm('Are you sure you want to restore the entire db.json to baseline? Unsaved session modifications across patients/doctors will be reset.')) {
      return;
    }
    setIsProcessing(true);
    setMsg('');
    setErr('');
    try {
      const res = await fetch('/api/security/database/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: 'Administrator' })
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Database baseline recovered successfully!');
        fetchDbStatus();
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setErr(data.error || 'Failed to recover.');
      }
    } catch (e) {
      setErr('Failed to execute recovery.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="view-database" className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-rose-500/5 to-pink-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-4 z-10">
          <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
            {/* Pulsing visual aura */}
            <div className="absolute inset-0 bg-rose-400 rounded-full opacity-15 animate-ping"></div>
            {/* Double-layered rose gradient border ring */}
            <div className="absolute inset-0.5 bg-gradient-to-tr from-rose-500 to-pink-500 rounded-full p-0.5">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-100">
                  <Database className="h-5 w-5" />
                </div>
              </div>
            </div>
            {/* Mini active badge representing cryptographic ledger lock */}
            <div className="absolute -bottom-0.5 -right-0.5 bg-rose-600 border border-white text-white rounded-full p-1 shadow-md">
              <Key className="h-2.5 w-2.5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Secure Database Sandbox <span className="text-xs bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-0.5 rounded-full font-bold">Ledger Verified</span>
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
              HIPAA compliant structured relational database tables, sandbox SQL editor, and SHA-256 integrity logs.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs: Database & Auditing */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            type="button"
            id="tab-btn-sql-sandbox"
            onClick={() => setActiveAuditingTab('sandbox')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeAuditingTab === 'sandbox'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Terminal className="h-4 w-4 text-indigo-600" />
            <span>SQL Sandbox & Schema Explorer</span>
          </button>

          <button
            type="button"
            id="tab-btn-query-distribution"
            onClick={() => setActiveAuditingTab('distribution')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeAuditingTab === 'distribution'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <BarChart3 className={`h-4 w-4 ${activeAuditingTab === 'distribution' ? 'text-white' : 'text-indigo-600'}`} />
            <span>Query Distribution (Recharts)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeAuditingTab === 'distribution'
                  ? 'bg-indigo-700/80 text-white'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
              }`}
            >
              {queryResult && queryResult.rows ? `${queryResult.rows.length} rows` : 'Visualizer'}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium flex items-center gap-2 px-2">
          <Activity className="h-3.5 w-3.5 text-emerald-500" />
          <span>Active Result: <strong className="font-mono text-slate-700">{queryResult?.rows ? `${queryResult.rows.length} records` : 'Ready'}</strong></span>
        </div>
      </div>

      {/* Tab 1: SQL Sandbox & Ledger Explorer */}
      {activeAuditingTab === 'sandbox' && (
        <div className="space-y-6">
          {/* SQL Sandbox Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Terminal className="h-5 w-5 text-indigo-600" />
                Interactive SQL Query Sandbox
              </h3>
              <button
                type="button"
                onClick={() => setActiveAuditingTab('distribution')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Open Distribution Visualizer</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Execute mock SQL queries to audit records. Try running queries such as{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono font-bold">SELECT * FROM appointments;</code> or{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono font-bold">SELECT * FROM audit_logs;</code>.
            </p>

            <form onSubmit={handleExecuteQuery} className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 font-mono text-sm flex gap-3 items-center shadow-inner">
              <span className="text-slate-400 font-bold select-none pl-1">careflow_db=#</span>
              <input
                id="sql-query-input"
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="SELECT * FROM appointments;"
                className="flex-grow bg-transparent text-indigo-700 font-bold font-mono focus:outline-none placeholder-slate-450"
              />
              <button
                id="sql-run-btn"
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-xs font-bold font-sans transition shadow-sm cursor-pointer"
              >
                Execute SQL
              </button>
            </form>

            {queryResult && (
              <div className="space-y-3 animate-fadeIn pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 font-semibold font-mono">
                    Sandbox Query Results ({queryResult.rows.length} rows returned):
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveAuditingTab('distribution')}
                    className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-md border border-indigo-200 transition cursor-pointer"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>Visualize Distribution in Recharts</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white max-h-52 overflow-y-auto shadow-sm">
                  <table className="w-full text-left border-collapse font-sans">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                        {queryResult.columns.map((col) => (
                          <th key={col} className="p-3 font-bold">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.rows.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-indigo-50/30 text-xs font-mono text-slate-700">
                          {queryResult.columns.map((col) => (
                            <td key={col} className="p-3">
                              {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Database Snapshot Recovery & Disaster Management */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-indigo-600 animate-pulse" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Database Snapshot & Integrity Controls</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Disaster Recovery & Code Reset System</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold border border-green-100 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-ping"></span>
                System Online
              </span>
            </div>

            {/* Messaging Feedback overlay */}
            {msg && (
              <div className="bg-green-50 text-green-800 text-xs p-3 rounded-lg border border-green-100 font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                <span>{msg}</span>
              </div>
            )}
            {err && (
              <div className="bg-rose-50 text-rose-800 text-xs p-3 rounded-lg border border-rose-100 font-bold flex items-center gap-2 animate-fadeIn">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{err}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status Metrics */}
              <div className="space-y-3.5 bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-inner">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Relational File Systems Integrity</span>
                
                <div className="space-y-3">
                  {/* Active DB Info */}
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-md border border-slate-200 shadow-sm">
                    <div>
                      <span className="text-xs font-black text-slate-800 block">Active Database File</span>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">/data/db.json</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-indigo-600 block">
                        {dbStatus?.databaseSize ? `${(dbStatus.databaseSize / 1024).toFixed(1)} KB` : '341.2 KB'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Healthy Block</span>
                    </div>
                  </div>

                  {/* Backup Info */}
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-md border border-slate-200 shadow-sm">
                    <div>
                      <span className="text-xs font-black text-slate-800 block">Recovery Baseline Snapshot</span>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">/data/db.json.bak</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-indigo-600 block">
                        {dbStatus?.backupSize ? `${(dbStatus.backupSize / 1024).toFixed(1)} KB` : '341.2 KB'}
                      </span>
                      <span className="text-[9px] text-emerald-600 font-bold uppercase">Ready</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls Actions */}
              <div className="flex flex-col justify-center space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleBackup}
                    disabled={isProcessing}
                    className="flex-grow bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 px-4 rounded-lg border border-slate-200 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <Download className="h-4 w-4 text-slate-600" />
                    Snapshot Active State
                  </button>

                  <button
                    type="button"
                    onClick={handleRecover}
                    disabled={isProcessing}
                    className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-100"
                  >
                    <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
                    Recover Baseline Data
                  </button>
                </div>
                
                <p className="text-[10px] text-slate-400 leading-normal font-semibold text-center sm:text-left pl-1">
                  * The recovery baseline contains clean, pre-seeded entries for 50+ medical staff rosters, patient queues, departments, resource assets, and simulated cryptographic ledger logs.
                </p>
              </div>
            </div>
          </div>

          {/* Schema Browser & Active Log Column */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Table Schema Explorer */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 h-max">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-600" />
                Active Relational Tables Schema Browser
              </h3>
              <p className="text-xs text-slate-500 font-medium">Select a system entity to inspect its structural design and relational attributes.</p>

              <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 shadow-inner">
                {(['patients', 'doctors', 'appointments', 'departments', 'resources', 'audit_logs'] as const).map((tbl) => (
                  <button
                    key={tbl}
                    id={`schema-tab-btn-${tbl}`}
                    onClick={() => setSelectedSchemaTable(tbl)}
                    className={`text-xs px-3 py-2 rounded-md font-semibold transition cursor-pointer ${
                      selectedSchemaTable === tbl
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {tbl}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white max-h-56 overflow-y-auto shadow-sm">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                      <th className="p-3 font-bold">Field Column Name</th>
                      <th className="p-3 font-bold">Postgres Type</th>
                      <th className="p-3 font-bold">Relational Constraints</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSchemaColumns().map((col, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 last:border-0 font-sans">
                        <td className="p-3 font-bold text-indigo-600 font-mono">{col.name}</td>
                        <td className="p-3 text-slate-700 font-mono font-medium">{col.type}</td>
                        <td className="p-3 text-slate-500 font-semibold">{col.constraints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Col: Cryptographic immutable logs */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Secure Audit Trail</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">Every record insertion publishes a block secured by cryptographic chaining.</p>

              <div className="space-y-3 max-h-[340px] overflow-y-auto scrollbar-thin pr-1">
                {auditLogs.map((log) => (
                  <div key={log.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 font-sans space-y-2.5 shadow-inner">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span className="font-semibold">{log.timestamp}</span>
                      <span className="text-indigo-600 font-bold uppercase">{log.action}</span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-sans font-medium">{log.details}</p>
                    <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                      <span className="text-[8px] text-slate-400 block uppercase font-mono font-bold tracking-wider">Cryptographic Hash</span>
                      <span className="text-[9px] text-indigo-600 font-mono font-bold block truncate">{log.hash}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Recharts Query Distribution Visualizer */}
      {activeAuditingTab === 'distribution' && (
        <QueryDistributionVisualizer
          queryResult={queryResult}
          activeQuery={queryInput}
          onRunQuery={(sql) => {
            setQueryInput(sql);
            if (onRunPreset) {
              onRunPreset(sql);
            } else {
              handleExecuteQuery({ preventDefault: () => {} } as any, sql);
            }
          }}
          auditLogs={auditLogs}
          appointments={appointments}
        />
      )}
    </div>
  );
}
