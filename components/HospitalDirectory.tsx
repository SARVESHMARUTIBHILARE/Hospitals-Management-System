/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, UserCheck, Shield, ChevronLeft, ChevronRight, User, Users, Clipboard, Mail, Phone, Heart, Hash, FileText, Clock, Download } from 'lucide-react';
import { Doctor, Patient } from '../types';

interface HospitalDirectoryProps {
  doctors: Doctor[];
  patients: Patient[];
  onImpersonate: (type: 'doctor' | 'patient', id: string) => void;
  currentUserId: string;
  onSelectPatient?: (id: string) => void;
  onSelectDoctor?: (name: string, department: string) => void;
}

export default function HospitalDirectory({
  doctors,
  patients,
  onImpersonate,
  currentUserId,
  onSelectPatient,
  onSelectDoctor,
}: HospitalDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'doctors' | 'patients'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Derive login usernames for doctors
  const getDoctorUsername = (doc: Doctor) => {
    const lastName = doc.name.replace('Dr. ', '').split(' ').pop()?.toLowerCase() || 'doc';
    // Find approximate index based on his ID
    const match = doc.id.match(/\d+/);
    const num = match ? match[0] : '';
    return `dr${lastName}${num ? parseInt(num, 10) - 100 : ''}`;
  };

  // Derive login usernames for patients
  const getPatientUsername = (pat: Patient) => {
    const parts = pat.name.split(' ');
    const first = parts[0]?.toLowerCase() || '';
    const last = parts[1]?.toLowerCase() || '';
    const match = pat.id.match(/\d+/);
    const num = match ? match[0] : '';
    return `${first}${last}${num ? parseInt(num, 10) - 100 : ''}`;
  };

  // Build the combined dataset with unified schema
  const combinedList = [
    ...doctors.map(d => ({
      id: d.id,
      name: d.name,
      role: 'doctor' as const,
      email: d.email,
      phone: '+1 (555) 019-3321', // standard organization line
      username: getDoctorUsername(d),
      badgeText: d.department,
      subText: d.specialization,
      extraInfo: { label: 'Availability', value: d.availability.join(', ') }
    })),
    ...patients.map(p => ({
      id: p.id,
      name: p.name,
      role: 'patient' as const,
      email: p.email,
      phone: p.phone,
      username: getPatientUsername(p),
      badgeText: `Blood Type: ${p.bloodType}`,
      subText: `Age: ${p.age} • ${p.gender}`,
      extraInfo: { label: 'Primary Allergy', value: p.allergies?.[0] || 'None' }
    }))
  ];

  // Apply Search Filtering
  const filteredList = combinedList.filter(item => {
    // Filter Type
    if (filterType === 'doctors' && item.role !== 'doctor') return false;
    if (filterType === 'patients' && item.role !== 'patient') return false;

    // Search Term
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      item.id.toLowerCase().includes(term) ||
      item.email.toLowerCase().includes(term) ||
      item.username.toLowerCase().includes(term) ||
      item.badgeText.toLowerCase().includes(term) ||
      item.subText.toLowerCase().includes(term)
    );
  });

  // Calculate Pagination
  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredList.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  const handleFilterChange = (type: 'all' | 'doctors' | 'patients') => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const downloadDirectoryCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    
    if (filterType === 'patients') {
      headers = ['Patient ID', 'Name', 'Email', 'Phone', 'System Username', 'Blood Type', 'Details / Age & Gender', 'Primary Allergy / Info'];
      rows = filteredList.map(item => [
        item.id,
        item.name,
        item.email,
        item.phone,
        item.username,
        item.badgeText,
        item.subText,
        item.extraInfo?.value || 'None'
      ]);
    } else if (filterType === 'doctors') {
      headers = ['Doctor ID', 'Name', 'Email', 'Phone', 'System Username', 'Department', 'Specialization', 'Availability'];
      rows = filteredList.map(item => [
        item.id,
        item.name,
        item.email,
        item.phone,
        item.username,
        item.badgeText,
        item.subText,
        item.extraInfo?.value || ''
      ]);
    } else {
      headers = ['ID', 'Name', 'Role', 'Email', 'Phone', 'System Username', 'Badge Text', 'Sub Text', 'Extra Info'];
      rows = filteredList.map(item => [
        item.id,
        item.name,
        item.role,
        item.email,
        item.phone,
        item.username,
        item.badgeText,
        item.subText,
        item.extraInfo ? `${item.extraInfo.label}: ${item.extraInfo.value}` : ''
      ]);
    }
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const strVal = (val || '').toString();
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hospital_${filterType}_registry_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="hospital-directory-section" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Hospital Doctors & Patients Registry
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Browse through all <span className="text-indigo-600 font-bold">{doctors.length} Doctors</span> and{' '}
            <span className="text-indigo-600 font-bold">{patients.length} Patients</span> loaded in our secure relational sandboxed directory.
          </p>
        </div>

        {/* Counts Card */}
        <div className="flex gap-4 font-sans text-xs bg-slate-50 p-3 rounded-xl border border-slate-150">
          <div>
            <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Doctors On Duty</span>
            <span className="text-slate-900 font-black text-sm">{doctors.length}</span>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Patients Enrolled</span>
            <span className="text-slate-900 font-black text-sm">{patients.length}</span>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Total Records</span>
            <span className="text-indigo-600 font-black text-sm">{doctors.length + patients.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex gap-1.5 p-1 bg-white rounded-lg border border-slate-200 w-full sm:w-auto shadow-inner">
          <button
            onClick={() => handleFilterChange('all')}
            className={`text-xs px-3.5 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">{totalItems}</span>
          </button>
          <button
            onClick={() => handleFilterChange('doctors')}
            className={`text-xs px-3.5 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'doctors'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Doctors <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">{doctors.length}</span>
          </button>
          <button
            onClick={() => handleFilterChange('patients')}
            className={`text-xs px-3.5 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'patients'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Patients <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">{patients.length}</span>
          </button>
        </div>

        {/* Live Search & Export */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by name, ID, email, specialty..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={downloadDirectoryCSV}
            title="Download currently filtered list as CSV"
            className="w-full sm:w-auto bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-100 hover:border-indigo-600 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            <Download className="h-4 w-4 shrink-0" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Directory Flat List */}
      <div className="space-y-2">
        {paginatedItems.length > 0 ? (
          paginatedItems.map((item) => {
            const isDoctor = item.role === 'doctor';
            return (
              <div
                key={item.id}
                className="group bg-white rounded-xl border border-slate-200 hover:border-indigo-400 p-3.5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
              >
                {/* 1. Name and Avatar Badge */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    isDoctor ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {isDoctor ? <User className="h-4.5 w-4.5" /> : <Heart className="h-4.5 w-4.5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {item.name}
                      </h3>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase tracking-wider ${
                        isDoctor ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {item.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-0.5">
                      <span>{item.subText}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{item.id}</span>
                    </div>
                  </div>
                </div>

                {/* 2. System Role Key / Dept Key */}
                <div className="text-xs font-medium text-slate-600 min-w-[150px] md:text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Role / Dept Key</span>
                  <span className="text-slate-800 font-bold">{item.badgeText}</span>
                </div>

                {/* 3. Credentials (Email) */}
                <div className="text-xs font-medium text-slate-600 min-w-[180px]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Contact E-Mail</span>
                  <span className="text-slate-700 font-semibold truncate block max-w-[180px]" title={item.email}>{item.email}</span>
                </div>

                {/* 4. Login Credentials */}
                <div className="text-xs min-w-[120px] md:text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Login ID</span>
                  <span className="font-mono font-black text-indigo-700 text-xs bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded">
                    {item.username}
                  </span>
                </div>

                {/* 5. Impersonate Button */}
                <div className="shrink-0 flex items-center gap-2">
                  {!isDoctor && onSelectPatient && (
                    <button
                      onClick={() => onSelectPatient(item.id)}
                      className="w-full md:w-auto bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-indigo-100 hover:border-indigo-600 shadow-sm"
                    >
                      <FileText className="h-3.5 w-3.5" /> Load EHR
                    </button>
                  )}
                  {isDoctor && onSelectDoctor && (
                    <button
                      onClick={() => onSelectDoctor(item.name, item.badgeText)}
                      className="w-full md:w-auto bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-indigo-100 hover:border-indigo-600 shadow-sm"
                    >
                      <Clock className="h-3.5 w-3.5" /> View Roster
                    </button>
                  )}
                  <button
                    onClick={() => onImpersonate(item.role, item.id)}
                    className="w-full md:w-auto bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 hover:border-indigo-600 shadow-sm"
                  >
                    <UserCheck className="h-3.5 w-3.5" /> Impersonate
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <span className="text-slate-400 block font-bold text-xs">No registry entries found matching your query</span>
            <button
              onClick={() => { setSearchTerm(''); handleFilterChange('all'); }}
              className="mt-2 text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Clear filters & search
            </button>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-5 text-xs font-bold text-slate-500">
          <span className="font-medium text-slate-400">
            Showing <span className="text-slate-800 font-bold">{startIndex + 1}</span> to{' '}
            <span className="text-slate-800 font-bold">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of{' '}
            <span className="text-indigo-600 font-bold">{totalItems}</span> registry entries
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Pagination numbers array */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Sliding window for pagination centered on current page
              let pageNum = i + 1;
              if (currentPage > 3 && totalPages > 5) {
                if (currentPage + 2 <= totalPages) {
                  pageNum = currentPage - 3 + i + 1;
                } else {
                  pageNum = totalPages - 5 + i + 1;
                }
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg border text-xs font-bold transition cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && currentPage + 2 < totalPages && (
              <>
                <span className="text-slate-300 font-bold">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-8 h-8 rounded-lg border text-xs font-bold transition cursor-pointer ${
                    currentPage === totalPages
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
