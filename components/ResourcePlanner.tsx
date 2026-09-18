/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sliders, Brain, RefreshCw, Cpu } from 'lucide-react';
import { Department, Resource, AIOptimizationPlan } from '../types';
import HospitalFloorMap from './HospitalFloorMap';

interface ResourcePlannerProps {
  departments: Department[];
  editingDeptId: string | null;
  setEditingDeptId: (id: string | null) => void;
  editDeptBeds: number;
  setEditDeptBeds: (beds: number) => void;
  editDeptStaff: number;
  setEditDeptStaff: (staff: number) => void;
  editDeptBudget: number;
  setEditDeptBudget: (budget: number) => void;
  handleStartEditingDept: (dept: Department) => void;
  handleSaveDeptPlanning: () => Promise<void>;
  resources: Resource[];
  handleAdjustResourceQuantity: (resourceId: string, delta: number) => Promise<void>;
  aiContextInput: string;
  setAiContextInput: (input: string) => void;
  handleAIOptimizePlanning: () => Promise<void>;
  generatingAiPlan: boolean;
  aiPlan: AIOptimizationPlan | null;
}

export default function ResourcePlanner({
  departments,
  editingDeptId,
  setEditingDeptId,
  editDeptBeds,
  setEditDeptBeds,
  editDeptStaff,
  setEditDeptStaff,
  editDeptBudget,
  setEditDeptBudget,
  handleStartEditingDept,
  handleSaveDeptPlanning,
  resources,
  handleAdjustResourceQuantity,
  aiContextInput,
  setAiContextInput,
  handleAIOptimizePlanning,
  generatingAiPlan,
  aiPlan,
}: ResourcePlannerProps) {
  const overCapacityDepts = departments.filter((d) => d.bedsOccupied > d.bedsAllocated);

  return (
    <div id="view-planner" className="space-y-6 animate-fadeIn">
      {/* Real-time Over Capacity warning banner */}
      {overCapacityDepts.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-pulse">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-extrabold text-lg shrink-0">
              ⚠️
            </div>
            <div>
              <h4 className="text-sm font-black text-red-950 uppercase tracking-tight">Department Bed Overload Warning</h4>
              <p className="text-xs text-red-700 mt-0.5 font-semibold">
                The following departments are exceeding their allocated bed capacity: <span className="font-extrabold text-red-800">{overCapacityDepts.map(d => `${d.name} (${d.bedsOccupied}/${d.bedsAllocated} beds)`).join(', ')}</span>. Urgent staff/bed reallocation recommended.
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-red-600 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm shrink-0">
            {overCapacityDepts.length} Unit(s) Over capacity
          </span>
        </div>
      )}

      {/* Header info */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-violet-500/5 to-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-4 z-10">
          <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
            {/* Pulsing visual aura */}
            <div className="absolute inset-0 bg-violet-400 rounded-full opacity-15 animate-ping"></div>
            {/* Double-layered violet gradient border ring */}
            <div className="absolute inset-0.5 bg-gradient-to-tr from-violet-600 to-purple-400 rounded-full p-0.5">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-purple-400 text-white flex items-center justify-center shadow-md shadow-violet-100">
                  <Sliders className="h-5 w-5" />
                </div>
              </div>
            </div>
            {/* Mini active badge representing admin blueprint status */}
            <div className="absolute -bottom-0.5 -right-0.5 bg-violet-500 border border-white text-white rounded-full p-1 shadow-md">
              <Cpu className="h-2.5 w-2.5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              CMO Planning Dashboard <span className="text-xs bg-violet-50 text-violet-700 border border-violet-100 px-2.5 py-0.5 rounded-full font-bold">Strategic Level</span>
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
              Strategic Department Bed Allocation, Medical Budgets, & Clinical Resource Capacity
            </p>
          </div>
        </div>
        <div className="bg-indigo-55 bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-lg text-xs font-mono text-indigo-800 font-bold shadow-inner">
          ACTIVE BUDGET: ${departments.reduce((sum, d) => sum + d.budget, 0).toLocaleString()}
        </div>
      </div>

      {/* Department Allocations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Department Metrics Table/Cards */}
        <div className="lg:col-span-2 space-y-6">
          <HospitalFloorMap
            departments={departments}
            onSelectDepartment={handleStartEditingDept}
            selectedDeptId={editingDeptId}
          />

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Hospital Departments Operational Setup</h3>
            <div className="space-y-4">
              {departments.map((dept) => {
                const isEditing = editingDeptId === dept.id;
                const occupancyPercent = ((dept.bedsOccupied / (dept.bedsAllocated || 1)) * 100).toFixed(0);
                const isOverCapacity = dept.bedsOccupied > dept.bedsAllocated;
                const isFullyLoaded = dept.bedsOccupied === dept.bedsAllocated;

                return (
                  <div
                    key={dept.id}
                    className={`p-4 rounded-lg border space-y-4 shadow-inner transition duration-300 ${
                      isOverCapacity
                        ? 'bg-red-50/60 border-red-200 ring-2 ring-red-500/10'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs uppercase font-bold text-indigo-600 font-mono font-bold">{dept.code}</span>
                          {isOverCapacity && (
                            <span className="text-[9px] bg-red-100 border border-red-300 text-red-700 px-2 py-0.5 rounded font-black uppercase animate-pulse flex items-center gap-1 shadow-sm">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping"></span>
                              ⚠️ OVER CAPACITY
                            </span>
                          )}
                          {isFullyLoaded && (
                            <span className="text-[9px] bg-amber-100 border border-amber-300 text-amber-700 px-2 py-0.5 rounded font-black uppercase flex items-center gap-1 shadow-sm">
                              ⚠️ AT 100% CAPACITY
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm mt-0.5">{dept.name}</h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                          isOverCapacity
                            ? 'bg-red-600 text-white border-red-700'
                            : dept.status === 'Operational'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isOverCapacity ? 'CRITICAL OVERLOAD' : dept.status}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm animate-fadeIn">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-500 font-bold block">Beds Quota</label>
                          <input
                            type="number"
                            value={editDeptBeds}
                            onChange={(e) => setEditDeptBeds(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono focus:ring-1 focus:ring-indigo-500 font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-500 font-bold block">Staff Counts</label>
                          <input
                            type="number"
                            value={editDeptStaff}
                            onChange={(e) => setEditDeptStaff(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono focus:ring-1 focus:ring-indigo-500 font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-500 font-bold block">Annual Budget ($)</label>
                          <input
                            type="number"
                            value={editDeptBudget}
                            onChange={(e) => setEditDeptBudget(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono focus:ring-1 focus:ring-indigo-500 font-semibold"
                          />
                        </div>
                        <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setEditingDeptId(null)}
                            className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 px-2.5 py-1 rounded-md font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            id="save-planning-btn"
                            onClick={handleSaveDeptPlanning}
                            className="text-[10px] bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1 rounded-md font-bold cursor-pointer shadow-sm"
                          >
                            Save Blueprint
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans font-medium text-slate-700">
                        <div>
                          <span className={`block font-semibold ${isOverCapacity ? 'text-red-700' : 'text-slate-500'}`}>Bed Occupancy:</span>
                          <span className={`font-mono font-bold ${isOverCapacity ? 'text-red-700 text-sm animate-pulse' : 'text-slate-900'}`}>
                            {dept.bedsOccupied} / {dept.bedsAllocated} ({occupancyPercent}%)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Nurse Staff Quota:</span>
                          <span className="text-slate-900 font-bold">{dept.staffCount} Clinicals</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Active Budget:</span>
                          <span className="text-slate-900 font-mono font-bold">${dept.budget.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-end">
                          <button
                            id={`edit-dept-btn-${dept.id}`}
                            onClick={() => handleStartEditingDept(dept)}
                            className="text-[10px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg transition font-bold cursor-pointer shadow-sm"
                          >
                            Edit Metrics
                          </button>
                        </div>

                        {/* Progress bar representing bed occupancy */}
                        <div className="col-span-2 sm:col-span-4 space-y-1">
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isOverCapacity
                                  ? 'bg-gradient-to-r from-red-500 to-rose-600 animate-pulse'
                                  : Number(occupancyPercent) > 85
                                  ? 'bg-red-500'
                                  : 'bg-indigo-600'
                              }`}
                              style={{ width: `${Math.min(Number(occupancyPercent), 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Critical Equipment Assets List */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Critical Resource Equipment Ledger</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {resources.map((resrc) => (
                <div key={resrc.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center justify-between gap-4 shadow-inner">
                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-600 uppercase font-mono font-bold">{resrc.category}</span>
                    <h4 className="font-bold text-slate-800 text-xs mt-0.5">{resrc.name}</h4>
                    <div className="text-[10px] text-slate-500 font-semibold font-mono">
                      Total: {resrc.quantity} • Allocated: {resrc.allocated} • Status: {resrc.maintenanceStatus}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <button
                      id={`res-plus-btn-${resrc.id}`}
                      onClick={() => handleAdjustResourceQuantity(resrc.id, 1)}
                      className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 p-1 rounded font-bold text-xs cursor-pointer shadow-sm"
                    >
                      +1 Qty
                    </button>
                    <button
                      id={`res-minus-btn-${resrc.id}`}
                      onClick={() => handleAdjustResourceQuantity(resrc.id, -1)}
                      className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 p-1 rounded font-bold text-xs cursor-pointer shadow-sm"
                    >
                      -1 Qty
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Intelligent Planning Optimizer */}
        <div className="space-y-6">
          {/* Main Dark Card Strategic Optimizer to give contrast */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4 border border-white/10">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 text-indigo-400 p-1.5 rounded-lg border border-white/10">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Smart Strategic Optimizer</h3>
                <span className="text-[10px] text-slate-400 block font-mono">Powered by CareFlow Advanced Engine</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Query the medical model to analyze the current hospital metrics (bed capacity alerts, staffing ratios, operational budgets) and return strategic blueprints instantly.
            </p>

            <div className="space-y-3">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Planning Goals Context</label>
              <textarea
                id="ai-prompt-context"
                value={aiContextInput}
                onChange={(e) => setAiContextInput(e.target.value)}
                placeholder="e.g. Focus on Cardiology high occupancy or allocate equipment safety reserves..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 p-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500 rounded-lg font-sans"
              />
              <button
                id="ai-optimize-btn"
                onClick={handleAIOptimizePlanning}
                disabled={generatingAiPlan}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow cursor-pointer shadow-indigo-900"
              >
                {generatingAiPlan ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                {generatingAiPlan ? 'Computing Strategic Blueprint...' : 'Compute Resource Strategy'}
              </button>
            </div>
          </div>

          {/* Render strategy output (Dark styled box) */}
          {aiPlan && (
            <div className="bg-slate-900 border border-white/10 text-white p-6 rounded-2xl shadow-xl space-y-5 animate-fadeIn">
              <div className="border-b border-white/10 pb-3 flex justify-between items-center">
                <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
                  <Cpu className="h-4 w-4" /> Optimizations Strategy Computed
                </h4>
                <span className="text-[8px] uppercase tracking-wide font-mono bg-white/10 text-indigo-400 px-2 py-0.5 rounded border border-white/10">
                  Success
                </span>
              </div>

              <div className="space-y-3 text-xs leading-relaxed font-sans">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Capacity Evaluation</span>
                  <p className="text-slate-300 leading-relaxed">{aiPlan.analysis}</p>
                </div>

                {aiPlan.departmentOptimizations && aiPlan.departmentOptimizations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Recommended Quotas</span>
                    <div className="space-y-2">
                      {aiPlan.departmentOptimizations.map((opt, idx) => (
                        <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/10 text-[11px] space-y-1.5">
                          <div className="flex justify-between font-bold text-slate-200">
                            <span>{opt.deptCode} (Recommended Plan)</span>
                            <span className="text-indigo-400 font-semibold">Budget Delta: +${opt.suggestedBudgetDelta?.toLocaleString()}</span>
                          </div>
                          <div className="flex gap-4 text-[10px] text-slate-400 font-medium">
                            <span>Beds: {opt.suggestedBeds} units</span>
                            <span>Clinician Staff: {opt.suggestedStaff} members</span>
                          </div>
                          <p className="text-slate-400 italic text-[10px]">Reason: {opt.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiPlan.resourceRecommendations && aiPlan.resourceRecommendations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Asset Maintenance Alerts</span>
                    <div className="space-y-1.5">
                      {aiPlan.resourceRecommendations.map((rec, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] bg-white/5 p-2 rounded border border-white/10">
                          <div>
                            <span className="font-bold text-slate-200">{rec.resourceName}</span>
                            <span className="text-slate-400 block mt-0.5">{rec.actionRequired}</span>
                          </div>
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold uppercase text-[8px] ${
                              rec.priority === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {rec.priority} Priority
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiPlan.strategicAdvice && aiPlan.strategicAdvice.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Strategic Clinical Directives</span>
                    <ul className="list-disc list-inside space-y-1 text-[10px] text-slate-400 font-medium">
                      {aiPlan.strategicAdvice.map((adv, idx) => (
                        <li key={idx}>{adv}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
