import React, { useState } from 'react';
import { X, CheckCircle, XCircle, FileText, ExternalLink, Loader2, Bell } from 'lucide-react';

const NotificationModal = ({ isOpen, onClose, onActionComplete, data }) => {
    const [processing, setProcessing] = useState(false);

    if (!isOpen || !data) return null;

    const handleAction = async (url, type) => {
        setProcessing(true);
        try {
            // Assuming GET request for approval/rejection based on user description
            const response = await fetch(url);

            if (response.ok) {
                alert(`Successfully ${type === 'accept' ? 'approved' : 'rejected'} the JD.`);
                if (onActionComplete) {
                    onActionComplete();
                } else {
                    onClose();
                }
            } else {
                alert(`Failed to ${type} the JD. Please try again.`);
            }
        } catch (error) {
            console.error(`Error ${type}ing JD:`, error);
            alert(`An error occurred while ${type}ing. Please check console.`);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="glass-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh] border border-white/10 relative">
                {/* Decorative Gradient */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"></div>

                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Bell className="w-5 h-5 text-purple-400 animate-pulse" />
                        </div>
                        <h2 className="text-xl font-bold text-white">JD Approval Required</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* JD Poster Image */}
                    {data.JD_Poster && (
                        <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black/40 relative group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <img
                                src={data.JD_Poster}
                                alt="JD Poster"
                                className="w-full h-auto object-contain max-h-[400px]"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/400x300?text=Image+Load+Error';
                                }}
                            />
                        </div>
                    )}

                    {/* JD Text Link */}
                    {data.Text && (
                        <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center justify-between group hover:bg-blue-500/20 transition-colors">
                            <div className="flex items-center text-blue-400 font-medium">
                                <FileText className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                                <span>View Full Job Description Text</span>
                            </div>
                            <a
                                href={data.Text}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary py-2 px-4 text-sm flex items-center bg-blue-600 hover:bg-blue-500 border-none text-white"
                            >
                                Open Document <ExternalLink className="w-4 h-4 ml-2" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex gap-4">
                    <button
                        onClick={() => handleAction(data.Reject_URL, 'reject')}
                        disabled={processing}
                        className="flex-1 py-3 px-4 rounded-xl border border-rose-500/30 text-rose-400 font-bold hover:bg-rose-500/10 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5 mr-2" />}
                        Reject
                    </button>
                    <button
                        onClick={() => handleAction(data.Accept_URL, 'accept')}
                        disabled={processing}
                        className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed border-none"
                    >
                        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                        Approve & Publish
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;
