import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, User, Briefcase, ExternalLink, Loader2, Eye, Download, Share2, X, FileText, AlignLeft } from 'lucide-react';
import { fetchScheduledEvents } from '../utils/calendly';
import { fetchSheetData } from '../utils/googleSheets';
import { GOOGLE_SHEETS_CONFIG } from '../config';
import { getDocUrls, shareDoc } from '../utils/docHelper';

const Interviews = () => {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [events, logData] = await Promise.all([
                    fetchScheduledEvents(),
                    fetchSheetData(GOOGLE_SHEETS_CONFIG.HR_WORKFLOW_ID, GOOGLE_SHEETS_CONFIG.GIDS.LOG)
                ]);

                // Filter out events that have ended
                const now = new Date();
                const activeEvents = events.filter(event => {
                    const endTime = new Date(event.end_time);
                    return endTime > now;
                });

                const formattedInterviews = activeEvents.map(event => {
                    const startDate = new Date(event.start_time);
                    const email = event.candidate_email;

                    // Find matching candidate in Log sheet
                    const logEntry = logData.find(item =>
                        item.Email && email && item.Email.toLowerCase().trim() === email.toLowerCase().trim()
                    );

                    return {
                        name: event.candidate_name || event.name,
                        email: email,
                        role: logEntry?.Role || event.name, // Prefer Role from Log, fallback to event name
                        date: startDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
                        time: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                        link: event.location?.join_url || event.location?.url || '#',
                        cv: logEntry?.CV,
                        summary: logEntry?.Summary,
                        score: logEntry?.Score
                    };
                });

                setInterviews(formattedInterviews);
            } catch (err) {
                console.error("Failed to load data", err);
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
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Upcoming Interviews</h1>
                <p className="text-[var(--text-secondary)] mt-1">Scheduled interviews from Calendly</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {interviews.map((interview, index) => (
                    <div key={index} className="glass-card p-6 rounded-2xl hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group border-l-4 border-purple-500 flex flex-col border border-[var(--border-color)]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-lg">
                                    {interview.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-[var(--text-primary)] group-hover:text-purple-400 transition-colors">
                                        {interview.name}
                                    </h3>
                                    <div className="flex items-center text-xs text-[var(--text-secondary)] mt-0.5">
                                        <Briefcase className="w-3 h-3 mr-1" />
                                        {interview.role}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6 flex-1">
                            <div className="flex items-center text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] p-2 rounded-lg border border-[var(--border-color)]">
                                <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                                {interview.date}
                            </div>
                            <div className="flex items-center text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] p-2 rounded-lg border border-[var(--border-color)]">
                                <Clock className="w-4 h-4 mr-2 text-purple-400" />
                                {interview.time}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-auto">
                            <button
                                onClick={() => setSelectedCandidate(interview)}
                                className="flex-1 btn-primary bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] shadow-none flex items-center justify-center text-sm py-2"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                View Details
                            </button>
                            <a
                                href={interview.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 btn-primary flex items-center justify-center py-2 text-sm shadow-none bg-[var(--card-bg)] hover:bg-purple-600 border border-[var(--border-color)] hover:border-purple-500 text-[var(--text-primary)] hover:text-white"
                            >
                                <Video className="w-4 h-4 mr-2" />
                                Join
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {/* Candidate Details Modal */}
            {selectedCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedCandidate(null)}>
                    <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col glass-card rounded-2xl shadow-2xl overflow-hidden animate-scale-in border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/30 shrink-0">
                            <div className="flex items-center space-x-4">
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-500/30">
                                    {selectedCandidate.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">{selectedCandidate.name}</h2>
                                    <p className="text-[var(--text-secondary)] flex items-center">
                                        <Briefcase className="w-4 h-4 mr-1.5" />
                                        {selectedCandidate.role}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-[var(--bg-secondary)] rounded-full transition-colors">
                                <X className="w-6 h-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Interview Date</div>
                                    <div className="flex items-center font-semibold text-[var(--text-primary)]">
                                        <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                                        {selectedCandidate.date}
                                    </div>
                                </div>
                                <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                    <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Time</div>
                                    <div className="flex items-center font-semibold text-[var(--text-primary)]">
                                        <Clock className="w-4 h-4 mr-2 text-purple-400" />
                                        {selectedCandidate.time}
                                    </div>
                                </div>
                            </div>

                            {selectedCandidate.summary && (
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3 flex items-center">
                                        <AlignLeft className="w-4 h-4 mr-2 text-purple-500" />
                                        Professional Summary
                                    </h3>
                                    <div className="p-4 bg-[var(--bg-secondary)] rounded-xl text-[var(--text-primary)] text-sm leading-relaxed border border-[var(--border-color)]">
                                        {selectedCandidate.summary
                                            .replace(/([\.\!\?]\s+)(?=\d+\.\s+[A-Z])/g, "$1\n")
                                            .split('\n')
                                            .map((line, i) => (
                                                <p key={i} className={i > 0 ? "mt-2" : ""}>
                                                    {line.trim()}
                                                </p>
                                            ))
                                        }
                                    </div>
                                </div>
                            )}

                            {selectedCandidate.cv ? (
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3 flex items-center">
                                        <FileText className="w-4 h-4 mr-2 text-purple-500" />
                                        Resume / CV
                                    </h3>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                const { preview } = getDocUrls(selectedCandidate.cv);
                                                setSelectedDoc({ url: preview, title: `${selectedCandidate.name}'s CV` });
                                            }}
                                            className="flex-1 btn-primary py-2.5 flex items-center justify-center bg-[var(--card-bg)] hover:bg-purple-600 border border-[var(--border-color)] hover:border-purple-500 text-[var(--text-primary)] hover:text-white"
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            View CV
                                        </button>
                                        <button
                                            onClick={() => {
                                                const { download } = getDocUrls(selectedCandidate.cv);
                                                window.open(download, '_blank');
                                            }}
                                            className="p-2.5 border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                            title="Download"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                const { download } = getDocUrls(selectedCandidate.cv);
                                                shareDoc(`${selectedCandidate.name}'s CV`, download);
                                            }}
                                            className="p-2.5 border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                            title="Share"
                                        >
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-[var(--bg-secondary)] rounded-xl text-[var(--text-secondary)] text-sm text-center italic border border-[var(--border-color)]">
                                    No CV attached to candidate profile
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex justify-end shrink-0">
                            <a
                                href={selectedCandidate.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 px-8 text-white"
                            >
                                <Video className="w-4 h-4 mr-2" />
                                Join Meeting
                            </a>
                        </div>
                    </div>
                </div>
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

export default Interviews;
