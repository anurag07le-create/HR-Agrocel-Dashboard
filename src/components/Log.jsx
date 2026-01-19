import React, { useState, useEffect } from 'react';
import { FileText, Mail, Star, User, CheckCircle, XCircle, Clock, Loader2, Eye, Download, Share2, X } from 'lucide-react';
import { fetchSheetData } from '../utils/googleSheets';
import { GOOGLE_SHEETS_CONFIG } from '../config';
import { getDocUrls, shareDoc } from '../utils/docHelper';

const Log = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await fetchSheetData(
                    GOOGLE_SHEETS_CONFIG.HR_WORKFLOW_ID,
                    GOOGLE_SHEETS_CONFIG.GIDS.LOG
                );
                setData(result);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Candidate Log</h1>
                <p className="text-[var(--text-secondary)] mt-1">Track candidate status and activities</p>
            </div>

            {data.length === 0 ? (
                <div className="p-8 bg-purple-500/10 text-purple-300 rounded-2xl border border-purple-500/20 flex items-center justify-center">
                    <p className="font-medium">No logs found. Please check the Sheet GID.</p>
                </div>
            ) : (
                <>
                    {/* Desktop View - Table */}
                    <div className="hidden md:block glass-card rounded-2xl overflow-hidden border border-[var(--border-color)]">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="min-w-full divide-y divide-[var(--border-color)]">
                                <thead className="bg-[var(--bg-secondary)]">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Candidate</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Score</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)] bg-transparent">
                                    {data.map((item, index) => {
                                        const { preview, download } = getDocUrls(item.CV);

                                        return (
                                            <tr key={index} className="hover:bg-[var(--bg-hover)] transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                                                                {(item['Name of the Candidate'] || item.Name || '?').charAt(0)}
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-bold text-[var(--text-primary)] group-hover:text-purple-400 transition-colors">{item['Name of the Candidate'] || item.Name}</div>
                                                            <div className="text-sm text-[var(--text-secondary)] flex items-center mt-0.5">
                                                                <Mail className="w-3 h-3 mr-1" />
                                                                {item.Email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] px-3 py-1 rounded-lg inline-block border border-[var(--border-color)]">
                                                        {item.Role}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm font-bold text-[var(--text-primary)]">
                                                        <Star className="w-4 h-4 text-amber-400 mr-1.5 fill-amber-400" />
                                                        {item.Score || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${(item.Status || '').toUpperCase().includes('SHORTLIST')
                                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                        : (item.Status || '').toUpperCase().includes('REJECT')
                                                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                                        }`}>
                                                        {item.Status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {item.CV ? (
                                                        <div className="flex items-center space-x-3">
                                                            <button
                                                                onClick={() => setSelectedDoc({ url: preview, title: `${item['Name of the Candidate']}'s CV` })}
                                                                className="text-purple-400 hover:text-purple-300 flex items-center hover:underline decoration-2 underline-offset-2"
                                                            >
                                                                <Eye className="w-4 h-4 mr-1.5" />
                                                                View
                                                            </button>
                                                            <button
                                                                onClick={() => window.open(download, '_blank')}
                                                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                                                title="Download"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => shareDoc(`${item['Name of the Candidate']}'s CV`, download)}
                                                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                                                title="Share"
                                                            >
                                                                <Share2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[var(--text-secondary)] flex items-center cursor-not-allowed">
                                                            <XCircle className="w-4 h-4 mr-1.5" />
                                                            No CV
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile View - Cards */}
                    <div className="md:hidden space-y-4">
                        {data.map((item, index) => {
                            const { preview, download } = getDocUrls(item.CV);
                            return (
                                <div key={index} className="glass-card rounded-xl p-5 border border-[var(--border-color)] space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
                                                {(item['Name of the Candidate'] || item.Name || '?').charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-[var(--text-primary)]">{item['Name of the Candidate'] || item.Name}</h3>
                                                <div className="flex items-center text-xs text-[var(--text-secondary)] mt-0.5">
                                                    <Mail className="w-3 h-3 mr-1" />
                                                    {item.Email}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-sm font-bold text-[var(--text-primary)] bg-[var(--bg-secondary)] px-2 py-1 rounded-lg border border-[var(--border-color)]">
                                            <Star className="w-3 h-3 text-amber-400 mr-1 fill-amber-400" />
                                            {item.Score || '-'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-[var(--bg-secondary)] p-2 rounded-lg border border-[var(--border-color)]">
                                            <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block mb-1">Role</span>
                                            <span className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">{item.Role}</span>
                                        </div>
                                        <div className="bg-[var(--bg-secondary)] p-2 rounded-lg border border-[var(--border-color)]">
                                            <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block mb-1">Status</span>
                                            <span className={`inline-flex text-xs leading-tight font-bold ${(item.Status || '').toUpperCase().includes('SHORTLIST') ? 'text-emerald-400' :
                                                    (item.Status || '').toUpperCase().includes('REJECT') ? 'text-rose-400' :
                                                        'text-blue-400'
                                                }`}>
                                                {item.Status || 'Pending'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-[var(--border-color)] flex justify-between items-center">
                                        {item.CV ? (
                                            <div className="flex gap-2 w-full">
                                                <button
                                                    onClick={() => setSelectedDoc({ url: preview, title: `${item['Name of the Candidate']}'s CV` })}
                                                    className="flex-1 btn-primary py-2 text-xs flex items-center justify-center bg-[var(--card-bg)] hover:bg-purple-600 border border-[var(--border-color)] hover:border-purple-500 text-[var(--text-primary)] hover:text-white"
                                                >
                                                    <Eye className="w-3 h-3 mr-1.5" />
                                                    View CV
                                                </button>
                                                <button
                                                    onClick={() => window.open(download, '_blank')}
                                                    className="p-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => shareDoc(`${item['Name of the Candidate']}'s CV`, download)}
                                                    className="p-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                                >
                                                    <Share2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-[var(--text-secondary)] text-xs flex items-center italic w-full justify-center py-2 bg-[var(--bg-secondary)] rounded-lg">
                                                <XCircle className="w-3 h-3 mr-1.5" />
                                                No CV Available
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
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

export default Log;
