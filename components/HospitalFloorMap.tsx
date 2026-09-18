/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Department } from '../types';
import { Shield, Users, Activity, Eye, Sliders } from 'lucide-react';

interface HospitalFloorMapProps {
  departments: Department[];
  onSelectDepartment: (dept: Department) => void;
  selectedDeptId: string | null;
}

interface ZoneConfig {
  id: string;
  name: string;
  code: string;
  x: number;
  y: number;
  w: number;
  h: number;
  accentColor: string;
}

// 2D Hospital Floor Plan Coordinate Configuration (Optimized for 600x380 SVG)
const ZONE_MAP: Record<string, ZoneConfig> = {
  ICU: { id: 'ICU', name: 'Intensive Care Unit', code: 'ICU', x: 20, y: 20, w: 165, h: 110, accentColor: '#4f46e5' },
  CARD: { id: 'CARD', name: 'Cardiology Wing', code: 'CARD', x: 415, y: 20, w: 165, h: 110, accentColor: '#ec4899' },
  NEUR: { id: 'NEUR', name: 'Neurology Department', code: 'NEUR', x: 20, y: 250, w: 165, h: 110, accentColor: '#8b5cf6' },
  PEDS: { id: 'PEDS', name: 'Pediatrics Ward', code: 'PEDS', x: 415, y: 250, w: 165, h: 110, accentColor: '#f59e0b' },
  GEN: { id: 'GEN', name: 'General Medicine', code: 'GEN', x: 205, y: 250, w: 190, h: 110, accentColor: '#10b981' },
};

// Common/Unassigned Hospital Areas to make the blueprint feel authentic
const UTILITY_AREAS = [
  { name: 'Central Lobby & Elevators', x: 205, y: 20, w: 190, h: 80, fill: '#f1f5f9', stroke: '#cbd5e1', label: 'MAIN LOBBY / ADMISSION' },
  { name: 'Central Nurse Station', x: 205, y: 110, w: 190, h: 50, fill: '#f8fafc', stroke: '#e2e8f0', label: 'CENTRAL NURSE HUB' },
  { name: 'Emergency Triage & Entrance', x: 20, y: 145, w: 165, h: 80, fill: '#fef2f2', stroke: '#fca5a5', label: 'ER RECEPTION' },
  { name: 'Dispensary & Labs', x: 415, y: 145, w: 165, h: 80, fill: '#f0fdfa', stroke: '#99f6e4', label: 'PHARMACY & LABS' },
];

export default function HospitalFloorMap({
  departments,
  onSelectDepartment,
  selectedDeptId,
}: HospitalFloorMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    dept: Department;
    x: number;
    y: number;
    zoneId: string;
  } | null>(null);

  // Helper to map DB departments to fixed map zones
  const getZoneIdForDept = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('cardio')) return 'CARD';
    if (n.includes('pediat')) return 'PEDS';
    if (n.includes('neuro')) return 'NEUR';
    if (n.includes('general') || n.includes('med')) return 'GEN';
    if (n.includes('intensive') || n.includes('icu') || n.includes('critical')) return 'ICU';
    return '';
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    // Clear previous dynamic content but preserve standard structure
    svg.selectAll('.dynamic-group').remove();

    const dynamicGroup = svg.append('g').attr('class', 'dynamic-group');

    // Create a color interpolator for bed occupancy rates
    // Green (0%) -> Yellow (50%) -> Orange (80%) -> Intense Red (100%)
    const getColorForOccupancy = (rate: number) => {
      if (rate >= 0.85) return '#ef4444'; // critical red
      if (rate >= 0.70) return '#f97316'; // orange warnings
      if (rate >= 0.45) return '#eab308'; // yellow
      return '#3b82f6'; // beautiful serene blue for calm occupancy
    };

    // Draw Department Interactive Zones
    departments.forEach((dept) => {
      const zoneId = getZoneIdForDept(dept.name);
      const zone = ZONE_MAP[zoneId];
      if (!zone) return;

      const rate = dept.bedsAllocated > 0 ? dept.bedsOccupied / dept.bedsAllocated : 0;
      const isOverCapacity = dept.bedsOccupied > dept.bedsAllocated;
      const fillColor = isOverCapacity ? '#ef4444' : getColorForOccupancy(rate);
      const isSelected = selectedDeptId === dept.id;

      const defaultStroke = isOverCapacity ? '#ef4444' : isSelected ? '#4f46e5' : '#cbd5e1';
      const defaultStrokeWidth = isOverCapacity ? 3.5 : isSelected ? 3 : 1.5;
      const defaultFillOpacity = isOverCapacity ? 0.16 : isSelected ? 0.12 : 0.05;

      // Outer room container group
      const roomGroup = dynamicGroup
        .append('g')
        .attr('class', `room-group room-${zoneId} cursor-pointer transition-all`)
        .on('mouseenter', (event) => {
          // Highlight Room Border via D3
          d3.select(`.room-rect-${zoneId}`)
            .transition()
            .duration(150)
            .attr('stroke', isOverCapacity ? '#b91c1c' : '#4f46e5')
            .attr('stroke-width', isOverCapacity ? 4.5 : 3)
            .attr('fill-opacity', isOverCapacity ? 0.25 : 0.15);

          // Position Tooltip relative to the container
          const [mx, my] = d3.pointer(event, svgRef.current);
          setTooltipData({
            dept,
            x: mx + 15,
            y: my - 60,
            zoneId,
          });
        })
        .on('mousemove', (event) => {
          const [mx, my] = d3.pointer(event, svgRef.current);
          setTooltipData((prev) =>
            prev ? { ...prev, x: mx + 15, y: my - 60 } : null
          );
        })
        .on('mouseleave', () => {
          d3.select(`.room-rect-${zoneId}`)
            .transition()
            .duration(150)
            .attr('stroke', defaultStroke)
            .attr('stroke-width', defaultStrokeWidth)
            .attr('fill-opacity', defaultFillOpacity);

          setTooltipData(null);
        })
        .on('click', () => {
          onSelectDepartment(dept);
        });

      // Background rect with occupancy-colored aura
      roomGroup
        .append('rect')
        .attr('class', `room-rect-${zoneId}`)
        .attr('x', zone.x)
        .attr('y', zone.y)
        .attr('width', zone.w)
        .attr('height', zone.h)
        .attr('rx', 8)
        .attr('fill', fillColor)
        .attr('fill-opacity', defaultFillOpacity)
        .attr('stroke', defaultStroke)
        .attr('stroke-width', defaultStrokeWidth)
        .style('transition', 'all 0.2s ease');

      // Top Header ribbon strip for room code
      roomGroup
        .append('rect')
        .attr('x', zone.x)
        .attr('y', zone.y)
        .attr('width', zone.w)
        .attr('height', 24)
        .attr('rx', 8)
        .attr('fill', isOverCapacity ? '#ef4444' : isSelected ? '#4f46e5' : '#e2e8f0')
        .attr('fill-opacity', 0.95);

      // We clip the bottom corners of the header strip to match room rx
      roomGroup
        .append('rect')
        .attr('x', zone.x)
        .attr('y', zone.y + 12)
        .attr('width', zone.w)
        .attr('height', 12)
        .attr('fill', isOverCapacity ? '#ef4444' : isSelected ? '#4f46e5' : '#e2e8f0');

      // Room Code text in Header strip
      roomGroup
        .append('text')
        .attr('x', zone.x + 10)
        .attr('y', zone.y + 16)
        .attr('fill', (isOverCapacity || isSelected) ? '#ffffff' : '#475569')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
        .text(`${dept.code} UNIT`);

      // Bed Occupancy Percentage label
      roomGroup
        .append('text')
        .attr('x', zone.x + zone.w - 10)
        .attr('y', zone.y + 16)
        .attr('text-anchor', 'end')
        .attr('fill', (isOverCapacity || isSelected) ? '#ffffff' : fillColor)
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'ui-monospace, SFMono-Regular, monospace')
        .text(`${Math.round(rate * 100)}% OCC`);

      // Room Main Department Label (Centered)
      roomGroup
        .append('text')
        .attr('x', zone.x + zone.w / 2)
        .attr('y', isOverCapacity ? zone.y + 36 : zone.y + 44)
        .attr('text-anchor', 'middle')
        .attr('fill', '#1e293b')
        .attr('font-size', '11px')
        .attr('font-weight', '800')
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .text(dept.name);

      if (isOverCapacity) {
        // Warning notification overlay directly on map
        roomGroup
          .append('text')
          .attr('x', zone.x + zone.w / 2)
          .attr('y', zone.y + 49)
          .attr('text-anchor', 'middle')
          .attr('fill', '#dc2626')
          .attr('font-size', '8px')
          .attr('font-weight', 'black')
          .attr('font-family', 'ui-monospace, SFMono-Regular, monospace')
          .attr('class', 'animate-pulse')
          .text('🚨 OVER CAPACITY');
      }

      // Bed Grid Layout inside rooms
      // Let's lay out individual micro-indicators representing bed resources
      const bedsTotal = dept.bedsAllocated;
      const bedsOccupied = dept.bedsOccupied;
      
      const gridXOffset = zone.x + 12;
      const gridYOffset = zone.y + 58;
      const gridWidth = zone.w - 24;
      const gridHeight = zone.h - 70;

      // Layout columns/rows depending on capacity size
      const maxCols = Math.ceil(Math.sqrt(bedsTotal));
      const colSpacing = maxCols > 1 ? gridWidth / (maxCols - 1) : gridWidth;
      const rowSpacing = 14;

      // Render micro dots representing physical beds
      for (let i = 0; i < bedsTotal; i++) {
        const row = Math.floor(i / maxCols);
        const col = i % maxCols;

        const bx = gridXOffset + col * colSpacing;
        const by = gridYOffset + row * rowSpacing;

        // Ensure we don't bleed below bounds
        if (by < zone.y + zone.h - 10) {
          const isOccupied = i < bedsOccupied;

          // Bed dot
          roomGroup
            .append('circle')
            .attr('cx', bx)
            .attr('cy', by)
            .attr('r', 3)
            .attr('fill', isOccupied ? '#ef4444' : '#10b981')
            .attr('class', isOccupied ? 'animate-pulse' : '')
            .attr('opacity', 0.8)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 0.5);

          // Tiny glowing ring around occupied beds for visual fidelity
          if (isOccupied) {
            roomGroup
              .append('circle')
              .attr('cx', bx)
              .attr('cy', by)
              .attr('r', 5.5)
              .attr('fill', 'none')
              .attr('stroke', '#fca5a5')
              .attr('stroke-width', 0.75)
              .attr('opacity', 0.5);
          }
        }
      }

      // Add small clinician counting badge on bottom left of room
      roomGroup
        .append('text')
        .attr('x', zone.x + 10)
        .attr('y', zone.y + zone.h - 10)
        .attr('fill', '#64748b')
        .attr('font-size', '9px')
        .attr('font-weight', 'semibold')
        .text(`Staff: ${dept.staffCount}`);

      // Add status indicator dot on bottom right of room
      roomGroup
        .append('circle')
        .attr('cx', zone.x + zone.w - 14)
        .attr('cy', zone.y + zone.h - 13)
        .attr('r', 3.5)
        .attr('fill', dept.status === 'Operational' ? '#10b981' : '#f59e0b');
    });

  }, [departments, selectedDeptId]);

  return (
    <div id="d3-hospital-map-card" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-indigo-600 animate-pulse" /> Live Blueprint Floor Map & Bed Load
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Real-time interactive floor plan. Click on any active department wing to quickly update its resource quota.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-bold font-mono">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Underloaded (&lt;45%)
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> Normal (45-70%)
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Warning (70-85%)
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span> Critical (&ge;85%)
          </span>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full overflow-x-auto border border-slate-150 rounded-xl bg-slate-50/50 p-4">
        <svg
          ref={svgRef}
          viewBox="0 0 600 380"
          className="w-full max-w-[600px] h-auto mx-auto select-none overflow-visible"
        >
          {/* Defined grid background inside the blueprint */}
          <defs>
            <pattern id="grid" width="15" height="15" patternUnits="userSpaceOnUse">
              <path d="M 15 0 L 0 0 0 15" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="600" height="380" fill="url(#grid)" rx="8" />

          {/* Draw Corridors connecting all sections */}
          {/* Main corridor line graphic layout */}
          <rect x="185" y="20" width="20" height="340" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5" />
          <rect x="395" y="20" width="20" height="340" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5" />
          <rect x="20" y="130" width="560" height="15" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5" />
          <rect x="20" y="225" width="560" height="25" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5" />

          {/* Draw non-department utilities (Lobby, Nurse Hub, ER, Lab) */}
          {UTILITY_AREAS.map((area, idx) => (
            <g key={idx} className="utility-group">
              <rect
                x={area.x}
                y={area.y}
                width={area.w}
                height={area.h}
                rx={6}
                fill={area.fill}
                stroke={area.stroke}
                strokeWidth={1}
                strokeDasharray="2,2"
              />
              <text
                x={area.x + area.w / 2}
                y={area.y + area.h / 2 + 3}
                textAnchor="middle"
                fill="#64748b"
                fontSize="8px"
                fontWeight="bold"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                letterSpacing="0.05em"
              >
                {area.label}
              </text>
            </g>
          ))}

          {/* Connected indicators representing pneumatic tube paths or vital flow corridors */}
          <path
            d="M 100,137 L 500,137"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="2"
            strokeDasharray="4,4"
          />
        </svg>

        {/* Dynamic Tooltip Element absolute positioning over the SVG container */}
        {tooltipData && (
          <div
            className="absolute z-40 bg-slate-900 text-white rounded-xl shadow-xl p-3 border border-white/15 w-60 pointer-events-none text-xs transition-all animate-fadeIn"
            style={{ left: tooltipData.x, top: tooltipData.y }}
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-1.5 mb-2">
              <span className="font-mono font-bold text-indigo-400 text-[10px] uppercase">{tooltipData.dept.code} Unit</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                  tooltipData.dept.status === 'Operational' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                {tooltipData.dept.status}
              </span>
            </div>
            <h4 className="font-extrabold text-white text-sm tracking-tight mb-1">{tooltipData.dept.name}</h4>
            
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span>Bed Occupancy:</span>
                <span className="font-mono font-bold text-white">
                  {tooltipData.dept.bedsOccupied} / {tooltipData.dept.bedsAllocated} ({Math.round((tooltipData.dept.bedsOccupied / (tooltipData.dept.bedsAllocated || 1)) * 100)}%)
                </span>
              </div>
              
              {/* Tooltip Mini Progress Bar */}
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full"
                  style={{ width: `${(tooltipData.dept.bedsOccupied / (tooltipData.dept.bedsAllocated || 1)) * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-[10px] pt-1">
                <span>Active Nurses:</span>
                <span className="text-white font-bold">{tooltipData.dept.staffCount} Duty Staff</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>Annual Budget:</span>
                <span className="text-white font-mono font-bold">${tooltipData.dept.budget.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-2.5 pt-1.5 border-t border-white/5 text-[9px] text-slate-400 font-bold uppercase tracking-wide flex items-center gap-1">
              <Sliders className="h-3 w-3 text-indigo-400" /> Click Wing to edit blueprint
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
