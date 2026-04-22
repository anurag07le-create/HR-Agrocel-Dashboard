import React, { useState, useEffect, useMemo } from 'react';
import { useSearch } from '../context/SearchContext';
import { createPortal } from 'react-dom';
import { Calendar, Star, User, Loader2, Eye, Download, X, CheckCircle, LayoutGrid, List, FileText, ChevronRight, Phone, Video } from 'lucide-react';
import { fetchSheetData } from '../utils/googleSheets';
import { GOOGLE_SHEETS_CONFIG } from '../config';
import { getDocUrls } from '../utils/docHelper';
import CandidateDetailPopup from './CandidateDetailPopup';

import { useData } from '../context/DataContext';

// ... (imports)

const ShortlistCandidate = () => {
    const { log: logData, loading: contextLoading, setActiveRoute } = useData();
    const [data, setData] = useState([]);
    // const [loading, setLoading] = useState(true); // Derived
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [viewType, setViewType] = useState('grid');
    const { searchQuery } = useSearch();

    useEffect(() => { setActiveRoute('shortlist'); }, [setActiveRoute]);

    useEffect(() => {
        if (contextLoading) return;

        try {
            // Filter for Shortlisted candidates
            const shortlistedOnly = logData.filter(item =>
                (item.Status || '').toUpperCase().includes('SHORTLIST')
            );

            // Group candidates by Date
            const grouped = Object.values(shortlistedOnly.reduce((acc, candidate) => {
                const dateStr = candidate.Date || 'Recent';
                if (!acc[dateStr]) {
                    acc[dateStr] = { Date: dateStr, Candidates: [] };
                }
                acc[dateStr].Candidates.push(candidate);
                return acc;
            }, {}));

            // Sort groups by date (newest first)
            grouped.sort((a, b) => {
                if (a.Date === 'Recent') return 1;
                if (b.Date === 'Recent') return -1;

                const parseDate = (dateStr) => {
                    if (!dateStr) return new Date(0);
                    const parts = dateStr.split(/[\/\-]/);
                    if (parts.length === 3) {
                        const p0 = parseInt(parts[0], 10);
                        const p1 = parseInt(parts[1], 10);
                        const p2 = parseInt(parts[2], 10);
                        if (p1 > 12) return new Date(`${p0}/${p1}/${p2}`);
                        if (p0 > 12) return new Date(`${p1}/${p0}/${p2}`);
                        return new Date(`${p1}/${p0}/${p2}`);
                    }
                    return new Date(dateStr);
                };

                return parseDate(b.Date) - parseDate(a.Date);
            });

            setData(grouped);
        } catch (err) {
            console.error(err);
        }
    }, [logData, contextLoading]);

    const loading = contextLoading && data.length === 0;

    const filteredGroups = useMemo(() => {
        return data.map(group => ({
            ...group,
            Candidates: group.Candidates.filter(c =>
                (c['Name of the Candidate'] || c.Name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.Role || '').toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(group => group.Candidates.length > 0);
    }, [data, searchQuery]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header / Summary Bar */}
            <div className="flex justify-between items-center bg-white/80 backdrop-blur-md p-2.5 px-6 rounded-2xl border border-[var(--border-color)]/60 mx-1 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center h-full">
                    <span className="mt-0.5">{filteredGroups.reduce((acc, g) => acc + g.Candidates.length, 0)} Shortlisted Candidates</span>
                </div>
                <div className="flex items-center bg-slate-100/50 p-1 rounded-2xl border border-slate-200/60">
                    <button
                        onClick={() => setViewType('grid')}
                        className={`p-2 rounded-xl transition-all duration-300 ${viewType === 'grid' ? 'bg-black text-white shadow-xl shadow-black/10 scale-[1.02] font-bold' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 font-semibold'}`}
                        title="Grid View"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewType('list')}
                        className={`p-2 rounded-xl transition-all duration-300 ${viewType === 'list' ? 'bg-black text-white shadow-xl shadow-black/10 scale-[1.02] font-bold' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 font-semibold'}`}
                        title="List View"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {filteredGroups.length === 0 ? (
                <div className="p-12 text-center bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border-color)]">
                    <User className="w-12 h-12 mx-auto mb-4 text-purple-400 opacity-20" />
                    <p className="text-lg font-medium text-[var(--text-secondary)]">No candidates found for "{searchQuery}"</p>
                </div>
            ) : (
                filteredGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-6">
                        <div className="flex items-center space-x-3 text-[var(--text-secondary)] px-2">
                            <div className="p-2 bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)]">
                                <Calendar className="w-4 h-4 text-indigo-400" />
                            </div>
                            <h2 className="text-md font-bold text-[var(--text-primary)]">{group.Date}</h2>
                            <div className="h-px bg-gradient-to-r from-[var(--border-color)] to-transparent flex-1 ml-4"></div>
                        </div>

                        {viewType === 'grid' ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {group.Candidates.map((candidate, index) => {
                                    const { preview, download } = getDocUrls(candidate.CV || candidate.Documents || candidate.Link);
                                    return (
                                        <div
                                            key={`${candidate.Email || 'candidate'}-${index}`}
                                            className="glass-card rounded-2xl p-6 group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                                        >
                                            {/* Accent Background */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-125"></div>

                                            <div className="relative z-10">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg group-hover:rotate-3 transition-transform">
                                                            <div className="h-full w-full rounded-[10px] bg-black/20 flex items-center justify-center text-white text-xl font-bold backdrop-blur-sm">
                                                                {(candidate['Name of the Candidate'] || candidate.Name || '?').charAt(0)}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors">
                                                                {candidate['Name of the Candidate'] || candidate.Name || 'Unknown'}
                                                            </h3>
                                                            <p className="text-xs text-[var(--text-secondary)] font-medium flex items-center">
                                                                <Star className="w-3 h-3 mr-1 text-amber-400 fill-amber-400" />
                                                                {candidate.Role || 'Role Not Specified'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex gap-2 flex-wrap">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-[0.1em]">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        {candidate.Status || 'Shortlisted'}
                                                    </span>
                                                    {(candidate['Contact Number'] || candidate['Contact Number ']) && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 tracking-[0.05em] truncate max-w-[120px]" title="Contact Number">
                                                            <Phone className="w-2.5 h-2.5 mr-1" />
                                                            {candidate['Contact Number'] || candidate['Contact Number ']}
                                                        </span>
                                                    )}
                                                    {(candidate['Interview type'] || candidate['Interview Type']) && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-[0.1em] truncate max-w-[120px]" title="Interview Type">
                                                            <Video className="w-2.5 h-2.5 mr-1" />
                                                            {candidate['Interview type'] || candidate['Interview Type']}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-6 flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedCandidate(candidate)}
                                                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 active:scale-95 group/btn"
                                                    >
                                                        <Eye className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                                                        View Profile
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)] overflow-hidden mx-1">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[var(--bg-secondary)]/50 text-[var(--text-secondary)] text-[10px] uppercase tracking-widest font-bold">
                                                <th className="px-8 py-5">Candidate</th>
                                                <th className="px-8 py-5">Role</th>
                                                <th className="px-8 py-5">Status</th>
                                                <th className="px-8 py-5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-color)]/50">
                                            {group.Candidates.map((candidate, index) => {
                                                const { preview, download } = getDocUrls(candidate.CV || candidate.Documents || candidate.Link);
                                                return (
                                                    <tr key={`${candidate.Email || 'candidate'}-${index}`} className="group hover:bg-slate-500/5 transition-all duration-300 relative">
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center space-x-4">
                                                                <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                                    {(candidate['Name of the Candidate'] || candidate.Name || '?').charAt(0)}
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="font-semibold text-sm text-[var(--text-primary)] truncate tracking-tight group-hover:text-indigo-500 transition-colors">
                                                                        {candidate['Name of the Candidate'] || candidate.Name}
                                                                    </span>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <span className="text-[10px] text-[var(--text-secondary)] truncate opacity-60 font-medium">{candidate.Email || 'No email provided'}</span>
                                                                        {(candidate['Contact Number'] || candidate['Contact Number ']) && (
                                                                            <span className="text-[9px] font-bold text-indigo-400/80 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{candidate['Contact Number'] || candidate['Contact Number ']}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-sm font-semibold text-[var(--text-primary)]">
                                                            <div className="max-w-[200px] truncate">{candidate.Role || 'Not specified'}</div>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <div className="flex flex-col items-start gap-1">
                                                                <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-emerald-500/5 text-emerald-500 border border-emerald-500/20 backdrop-blur-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                                                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                                                                    {candidate.Status || 'Shortlisted'}
                                                                </span>
                                                                {(candidate['Interview type'] || candidate['Interview Type']) && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-amber-500/5 text-amber-500 border border-amber-500/20 whitespace-nowrap">
                                                                        {candidate['Interview type'] || candidate['Interview Type']}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <div className="flex justify-end items-center gap-1.5">
                                                                <button
                                                                    onClick={() => setSelectedCandidate(candidate)}
                                                                    className="p-2.5 text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:shadow-indigo-500/10 border border-transparent hover:border-indigo-500/20"
                                                                    title="View Profile"
                                                                >
                                                                    <Eye className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}

            {/* Document Preview Modal */}
            {
                selectedDoc && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setSelectedDoc(null)}>
                        <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] w-full max-w-5xl h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-scale-up" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--card-bg)]">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                                        <FileText className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <h3 className="font-bold text-lg text-[var(--text-primary)] truncate">{selectedDoc.title}</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedDoc(null)}
                                    className="p-2 hover:bg-rose-500/10 rounded-xl text-[var(--text-secondary)] hover:text-rose-500 transition-all transform"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center">
                                {selectedDoc.url ? (
                                    <iframe
                                        src={selectedDoc.url}
                                        title="Document Preview"
                                        className="w-full h-full border-none"
                                        style={{ height: 'calc(90vh - 70px)' }}
                                        allow="autoplay"
                                    ></iframe>
                                ) : (
                                    <div className="text-center p-12">
                                        <div className="p-4 bg-rose-50 text-rose-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                            <X className="w-8 h-8" />
                                        </div>
                                        <p className="text-lg font-bold text-gray-900">Preview Failed</p>
                                        <p className="text-sm text-gray-500">The document link is invalid or could not be previewed.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Candidate Detail Popup */}
            {selectedCandidate && (
                <CandidateDetailPopup 
                    data={selectedCandidate}
                    onClose={() => setSelectedCandidate(null)}
                />
            )}
        </div >
    );
};

export default ShortlistCandidate;
