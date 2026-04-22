import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Eye, Play, Link, FileText } from 'lucide-react';
import { getDocUrls } from '../utils/docHelper';

const CandidateDetailPopup = ({ candidate, onClose, data }) => {
    const item = data || candidate;
    if (!item) return null;

    const [selectedDoc, setSelectedDoc] = useState(null);

    useEffect(() => {
        document.body.classList.add('modal-open');
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => {
            document.body.classList.remove('modal-open');
            window.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const name = item['Name of the Candidate'] || item.name || item.Name || 'Unknown';
    const email = item.Email || item.email || '';
    const role = item.Role || item.role || 'N/A';
    const score = item.Score || item.score || '';
    const status = item.Status || item.status || 'Pending';
    const contact = item['Contact Number'] || item.contact || '';
    const summary = item.Summary || item.summary || '';
    const cv = item.CV || item.cv || '';
    const interviewDate = item['Interview date'] || item.date || '';
    const interviewType = item['Interview type'] || item.interviewType || '';
    const meetingLink = item['Meeting link'] || item.link || '';
    const callStatus = item['Call status'] || item.callData?.status || '';
    const callSummary = item['call summary'] || '';
    const fullConversion = item['fullConvertion'] || '';
    const recordingUrl = item['recording URL'] || item.callData?.recording || '';

    const conversationData = callSummary || fullConversion;
    let isConversation = false;
    if (conversationData) {
        try {
            const parsed = JSON.parse(conversationData);
            isConversation = Array.isArray(parsed);
        } catch {}
    }

    const renderConversation = () => {
        try {
            let messages = JSON.parse(conversationData);
            try {
                messages = JSON.parse(conversationData);
            } catch {
                messages = JSON.parse(JSON.parse(conversationData));
            }
            if (Array.isArray(messages) && messages.length > 0 && Array.isArray(messages[0])) {
                messages = messages.flat();
            }
            messages = messages.filter(m => m && typeof m === 'object' && m.role && m.content);
            if (messages.length === 0) {
                return <div className="text-sm text-gray-500 italic">No messages found</div>;
            }
            return messages.map((msg, i) => {
                const isUser = msg.role === 'user';
                return (
                    <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`} style={{ animationDelay: `${Math.min(i * 30, 300)}ms`, animationFillMode: 'backwards' }}>
                        <div className={`flex items-end gap-2 max-w-[75%] ${isUser ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                                {isUser ? 'U' : 'AI'}
                            </div>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isUser ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}>
                                <p className="leading-relaxed">{msg.content}</p>
                            </div>
                        </div>
                    </div>
                );
            });
        } catch {
            return <div className="text-sm text-gray-500 italic">Unable to display conversation</div>;
        }
    };

    return createPortal(
        <>
            <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden border border-gray-200 animate-scale-in" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                                {(name || '?').charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{name}</h2>
                                <p className="text-sm text-gray-500">{email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {cv && (
                                <button
                                    onClick={() => {
                                        const { preview } = getDocUrls(cv);
                                        if (preview) {
                                            setSelectedDoc({ url: preview, title: `${name}'s Resume` });
                                        }
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-500 transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    Preview CV
                                </button>
                            )}
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="popup-scroll overflow-y-auto h-[calc(90vh-140px)] p-8 space-y-6 scroll-smooth">
                        {/* Status & Quick Info Row */}
                        <div className="flex items-center gap-4 flex-wrap">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                                (status || '').toLowerCase().includes('shortlist') 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : (status || '').toLowerCase().includes('reject')
                                        ? 'bg-rose-100 text-rose-700'
                                        : 'bg-amber-100 text-amber-700'
                            }`}>
                                {status || 'Pending'}
                            </span>
                            <div className="flex gap-3 flex-1">
                                <div className="flex-1 bg-gray-50 px-4 py-3 rounded-xl">
                                    <p className="text-xs font-medium text-gray-400 uppercase mb-1">Role</p>
                                    <p className="text-sm font-semibold text-gray-900">{role}</p>
                                </div>
                                <div className="flex-1 bg-gray-50 px-4 py-3 rounded-xl">
                                    <p className="text-xs font-medium text-gray-400 uppercase mb-1">Contact</p>
                                    <p className="text-sm font-semibold text-gray-900">{contact || 'N/A'}</p>
                                </div>
                                <div className="w-32 bg-gray-50 px-4 py-3 rounded-xl text-center">
                                    <p className="text-xs font-medium text-gray-400 uppercase mb-1">Score</p>
                                    <p className="text-sm font-semibold text-gray-900">{score ? `${score}/10` : 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Interview Details */}
                        {(interviewDate || interviewType || meetingLink) && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Interview Details</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {interviewDate && (
                                        <div className="bg-gray-50 p-4 rounded-xl">
                                            <p className="text-xs font-medium text-gray-400 uppercase mb-1">Date & Time</p>
                                            <p className="text-sm font-semibold text-gray-900">{interviewDate}</p>
                                        </div>
                                    )}
                                    {interviewType && (
                                        <div className="bg-gray-50 p-4 rounded-xl">
                                            <p className="text-xs font-medium text-gray-400 uppercase mb-1">Type</p>
                                            <p className="text-sm font-semibold text-gray-900">{interviewType}</p>
                                        </div>
                                    )}
                                    {meetingLink && (
                                        <a href={meetingLink} target="_blank" rel="noopener noreferrer" className="bg-indigo-50 p-4 rounded-xl hover:bg-indigo-100 transition-colors">
                                            <p className="text-xs font-medium text-indigo-400 uppercase mb-1">Meeting</p>
                                            <p className="text-sm font-semibold text-indigo-600 flex items-center gap-1">
                                                <Link className="w-3 h-3" /> Join
                                            </p>
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Summary */}
                        {summary && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Summary</h3>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
                                </div>
                            </div>
                        )}

                        {/* Call Details */}
                        {(callStatus || conversationData || recordingUrl) && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Call Details</h3>
                                <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                                    <div className="flex items-center gap-4 flex-wrap">
                                        {callStatus && (
                                            <div>
                                                <p className="text-xs font-medium text-gray-400 uppercase mb-1">Status</p>
                                                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                                                    callStatus?.toLowerCase().includes('success') || callStatus?.toLowerCase().includes('completed') || callStatus?.toLowerCase().includes('done')
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : callStatus?.toLowerCase().includes('fail')
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {callStatus}
                                                </span>
                                            </div>
                                        )}
                                        {recordingUrl && (
                                            <div className="ml-auto">
                                                <p className="text-xs font-medium text-gray-400 uppercase mb-1">Recording</p>
                                                <button
                                                    onClick={() => {
                                                        const audio = new Audio(recordingUrl);
                                                        audio.play().catch(err => console.error('Audio play error:', err));
                                                    }}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-500 transition-colors"
                                                >
                                                    <Play className="w-4 h-4" />
                                                    Play Recording
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {(isConversation || callSummary?.includes('"role"') || fullConversion?.includes('"role"')) && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-400 uppercase mb-2">Conversation</p>
                                            <div className="conversation-scroll bg-white border border-gray-200 rounded-xl p-4 max-h-80 overflow-y-auto space-y-3 scroll-smooth">
                                                {renderConversation()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Preview Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 z-[1600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setSelectedDoc(null)}>
                    <div className="relative w-full max-w-5xl h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-6 z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-gray-900 truncate max-w-md">{selectedDoc.title}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => window.open(selectedDoc.url.replace('&embedded=true', ''), '_blank')} className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Open in New Tab">
                                    <Eye className="w-5 h-5" />
                                </button>
                                <button onClick={() => setSelectedDoc(null)} className="p-2.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center">
                            {selectedDoc.url ? (
                                <iframe src={selectedDoc.url} title="Document Preview" className="w-full h-full border-none" style={{ height: 'calc(90vh - 70px)' }} allow="autoplay"></iframe>
                            ) : (
                                <div className="text-center p-12">
                                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-xl shadow-rose-500/10">
                                        <X className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Preview Failed</h3>
                                    <p className="text-sm font-bold text-gray-400 max-w-xs mx-auto">We couldn't generate a preview for this document.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .conversation-scroll, .popup-scroll {
                    scroll-behavior: smooth;
                    scrollbar-width: thin;
                    scrollbar-color: #d1d5db transparent;
                }
                .conversation-scroll::-webkit-scrollbar, .popup-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .conversation-scroll::-webkit-scrollbar-track, .popup-scroll::-webkit-scrollbar-track {
                    background: transparent;
                    margin: 8px 0;
                }
                .conversation-scroll::-webkit-scrollbar-thumb, .popup-scroll::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 10px;
                    transition: background 0.2s;
                }
                .conversation-scroll::-webkit-scrollbar-thumb:hover, .popup-scroll::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out forwards;
                }
            `}</style>
        </>,
        document.body
    );
};

export default CandidateDetailPopup;
