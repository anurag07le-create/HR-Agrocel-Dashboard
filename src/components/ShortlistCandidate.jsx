import React, { useState, useEffect } from 'react';
import { Calendar, Star, User, Loader2, Eye, Download, Share2, X } from 'lucide-react';
import { fetchSheetData } from '../utils/googleSheets';
import { GOOGLE_SHEETS_CONFIG } from '../config';
import { getDocUrls, shareDoc } from '../utils/docHelper';

const ShortlistCandidate = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await fetchSheetData(
                    GOOGLE_SHEETS_CONFIG.SHORTLIST_CANDIDATE_ID,
                    GOOGLE_SHEETS_CONFIG.GIDS.SHORTLIST
                );

                // Group candidates by Date
                const grouped = Object.values(result.reduce((acc, candidate) => {
                    const dateStr = candidate.Date || 'Recent';
                    // Normalize date to ensure consistent grouping
                    if (!acc[dateStr]) {
                        acc[dateStr] = { Date: dateStr, Candidates: [] };
                    }
                    acc[dateStr].Candidates.push(candidate);
                    return acc;
                }, {}));

                // Sort groups by date (newest first)
                // Assumes DD/MM/YYYY format based on user screenshot
                grouped.sort((a, b) => {
                    if (a.Date === 'Recent') return 1;
                    if (b.Date === 'Recent') return -1;

                    const parseDate = (dateStr) => {
                        if (!dateStr) return new Date(0);
                        // Handle both / and - separators
                        const parts = dateStr.split(/[\/\-]/);
                        if (parts.length === 3) {
                            const p0 = parseInt(parts[0], 10);
                            const p1 = parseInt(parts[1], 10);
                            const p2 = parseInt(parts[2], 10);

                            // Heuristic to detect format
                            // If 2nd part > 12, it MUST be MM/DD/YYYY (e.g. 02/13/2025 -> Feb 13)
                            if (p1 > 12) {
                                return new Date(`${p0}/${p1}/${p2}`);
                            }
                            // If 1st part > 12, it MUST be DD/MM/YYYY (e.g. 13/02/2025 -> Feb 13)
                            if (p0 > 12) {
                                return new Date(`${p1}/${p0}/${p2}`);
                            }

                            // Ambiguous (e.g. 01/12/2025). User said DD-MM-YYYY, so assume DD/MM/YYYY
                            // DD/MM/YYYY -> MM/DD/YYYY for JS Date constructor
                            return new Date(`${p1}/${p0}/${p2}`);
                        }
                        return new Date(dateStr);
                    };

                    return parseDate(b.Date) - parseDate(a.Date);
                });

                setData(grouped);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const openSheet = () => {
        window.open(`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.SHORTLIST_CANDIDATE_ID}/edit`, '_blank');
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Shortlisted Candidates</h1>
                <p className="text-[var(--text-secondary)] mt-1">Review and manage shortlisted applicants</p>
            </div>

            {data.length === 0 || data[0].Candidates.length === 0 ? (
                <div className="p-8 bg-purple-500/10 text-purple-300 rounded-2xl border border-purple-500/20 flex items-center justify-center">
                    <p className="font-medium">No candidates found. Please check the Sheet GID.</p>
                </div>
            ) : (
                data.map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-6">
                        <div className="flex items-center space-x-3 text-[var(--text-secondary)] px-2">
                            <div className="p-2 bg-[var(--card-bg)] rounded-lg shadow-sm border border-[var(--border-color)]">
                                <Calendar className="w-5 h-5 text-purple-400" />
                            </div>
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">{group.Date}</h2>
                            <div className="h-px bg-[var(--border-color)] flex-1 ml-4"></div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {group.Candidates.map((candidate, index) => {
                                const { preview, download } = getDocUrls(candidate.CV || candidate.Link); // Assuming Link or CV column
                                const status = (candidate.Status || 'Preferred').toUpperCase();

                                return (
                                    <div
                                        key={index}
                                        className="glass-card rounded-2xl p-6 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden border border-[var(--border-color)]"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="flex items-center space-x-4">
                                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-purple-500/30 group-hover:rotate-6 transition-transform duration-300">
                                                    {(candidate['Name of The Candidate'] || candidate.Name || '?').charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-[var(--text-primary)] text-lg group-hover:text-purple-400 transition-colors">
                                                        {candidate['Name of The Candidate'] || candidate.Name || 'Unknown'}
                                                    </h3>
                                                    <p className="text-sm text-[var(--text-secondary)] font-medium">{candidate.Role || 'Unknown Role'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            {status === 'PREFERRED' && (
                                                <button
                                                    onClick={openSheet}
                                                    title="Open Sheet to Update Status"
                                                    className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
                                                >
                                                    Mark Shortlisted
                                                </button>
                                            )}
                                            {status === 'SHORTLISTED' && (
                                                <button
                                                    onClick={openSheet}
                                                    title="Open Sheet to Update Status"
                                                    className="flex-1 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/20"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex justify-between items-center gap-2">
                                            <button
                                                onClick={() => setSelectedDoc({ url: preview, title: `${candidate['Name of The Candidate']}'s Profile` })}
                                                className="flex-1 btn-primary py-2.5 text-sm shadow-none bg-[var(--card-bg)] hover:bg-purple-600 border border-[var(--border-color)] hover:border-purple-500 flex items-center justify-center text-[var(--text-secondary)] hover:text-white"
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Profile
                                            </button>
                                            <button
                                                onClick={() => window.open(download, '_blank')}
                                                className="p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-xl transition-colors border border-[var(--border-color)]"
                                                title="Download"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => shareDoc(`${candidate['Name of The Candidate']}'s Profile`, download)}
                                                className="p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-xl transition-colors border border-[var(--border-color)]"
                                                title="Share"
                                            >
                                                <Share2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}

            {/* Document Preview Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedDoc(null)}>
                    <div className="relative w-full max-w-5xl h-[85vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="absolute -top-12 left-0 right-0 flex justify-between items-center text-white px-2">
                            <h3 className="font-bold text-lg truncate flex-1 mr-4">{selectedDoc.title}</h3>
                            <button
                                onClick={() => setSelectedDoc(null)}
                                className="p-2 hover:text-purple-400 transition-colors"
                            >
                                <X className="w-8 h-8" />
                            </button>
                        </div>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full h-full">
                            <iframe
                                src={selectedDoc.url}
                                title="Document Preview"
                                className="w-full h-full border-none"
                                allow="autoplay"
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShortlistCandidate;
