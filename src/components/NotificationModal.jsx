import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, XCircle, FileText, ExternalLink, Loader2, Bell, ChevronLeft, ChevronRight, Trash2, XSquare, RefreshCw, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useNotification } from '../context/NotificationContext';
import { useLoading } from '../context/LoadingContext';
import { useNavigate } from 'react-router-dom';

import { WEBHOOK_URLS } from '../config';
import { getDocUrls } from '../utils/docHelper';

const NotificationModal = ({ isOpen, onClose, onActionComplete, data }) => {
    const toast = useToast();
    const { startLoading, stopLoading } = useLoading();
    const { waitingForLogId, setWaitingForLogId, setPollingStartTime, refreshNotifications, markAsProcessed, clearProcessedLogId } = useNotification();
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showRegenerateOptions, setShowRegenerateOptions] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [activeItem, setActiveItem] = useState(null);

    // Ensure data is always an array
    const items = Array.isArray(data) ? data : (data ? [data] : []);
    const currentItem = items[currentIndex] || items[0];

    // Sync activeItem with currentItem ONLY when not in a sub-flow (like rejection options)
    useEffect(() => {
        if (isOpen && currentItem && !showRegenerateOptions) {
            setActiveItem(currentItem);
        }
    }, [isOpen, currentItem, showRegenerateOptions]);

    // Reset activeItem when modal closes
    useEffect(() => {
        if (!isOpen) {
            setActiveItem(null);
            setShowRegenerateOptions(false);
            setCurrentIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        if (activeItem && !showRegenerateOptions) {
            console.log('[DEBUG Modal] Active Item Structure:', activeItem);
        }
    }, [activeItem, showRegenerateOptions]);

    // Reset index when data changes substantially (or empty)
    useEffect(() => {
        if (isOpen && !items[currentIndex] && !showRegenerateOptions) {
            setCurrentIndex(0);
        }
    }, [data, items.length, currentIndex, isOpen, showRegenerateOptions]);

    // Manage body class for modal blurring
    useEffect(() => {
        if (isOpen && (items.length > 0 || activeItem)) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isOpen, items.length, activeItem]);

    if (!isOpen || !activeItem) return null;

    const handleNext = () => {
        if (currentIndex < items.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleAction = async (url, type) => {
        const actionLabel = type === 'accept' ? 'Approving JD' : 'Rejecting JD';
        toast.info('Processing...', 'Communicating your decision to the system in background.', 2000);

        console.log(`[JD Action] Decision: ${type}, Log ID: ${activeItem['Log ID']}`);

        try {
            let success = false;

            // 1. Dynamic URL from Sheet (GET request)
            if (url) {
                try {
                    console.log(`[JD Action] Hitting Dynamic ${type} URL:`, url);

                    // Create a timeout promise (15 seconds for reliability)
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000);

                    const response = await fetch(url, {
                        method: 'GET',
                        mode: 'no-cors', // URLs usually trigger a script which might not have CORS headers
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);
                    success = true;
                    console.log(`[JD Action] Dynamic ${type} URL hit triggered (no-cors).`);
                } catch (e) {
                    console.error(`[JD Action] Dynamic URL fetch failed for ${type}:`, e);
                    if (e.name === 'AbortError') {
                        toast.error(`Request timed out. The system might still process your ${type}.`);
                        success = true; // Often it still goes through on the backend
                    } else {
                        toast.error(`Failed to trigger ${type} link. Please try again.`);
                    }
                }
            } else {
                console.warn(`[JD Action] No ${type}_URL found for Log ID: ${activeItem['Log ID']}.`);
                toast.error(`Missing ${type} link from database.`);
            }

            if (success) {
                // Regardless of accept or reject, we mark it so it doesn't pop up again while backend syncs
                markAsProcessed(activeItem['Log ID']);

                if (type === 'accept') {
                    // Trigger Final JD Publish Webhook
                    try {
                        const publishPayload = {
                            log_id: activeItem['Log ID'],
                            role: activeItem.Role_Name || activeItem.Role || 'Untitled Role',
                            experience: activeItem.Experience || '',
                            salary: activeItem.Salary || '',
                            location: activeItem.Location || '',
                            description: activeItem.Description || activeItem.Job_Description || '',
                            poster: activeItem.JD_Poster || '',
                            timestamp: new Date().toISOString(),
                            action: 'publish_final_jd'
                        };

                        console.log('[JD Action] Triggering Final JD Publish Webhook:', WEBHOOK_URLS.FINAL_JD_PUBLISH);
                        fetch(WEBHOOK_URLS.FINAL_JD_PUBLISH, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(publishPayload)
                        }).catch(err => console.error('[JD Action] Final JD Publish Webhook background error:', err));

                    } catch (publishError) {
                        console.error('[JD Action] Error preparing publish webhook:', publishError);
                    }

                    toast.success('JD Approved! Publishing to JD page...');
                    setTimeout(() => {
                        onClose();
                        refreshNotifications();
                        navigate('/jd', { state: { waitingForLogId: activeItem['Log ID'] } });
                    }, 1000);
                } else {
                    toast.success('JD Rejected. What would you like to do next?');
                    setShowRegenerateOptions(true);
                    refreshNotifications();
                }
            }
        } catch (error) {
            console.error(`[JD Action] Critical error during ${type}:`, error);
            toast.error(`An error occurred while ${type}ing.`);
        } finally {
            stopLoading();
        }
    };

    const handleDelete = async () => {
        toast.info('Processing...', 'Removing JD from the database in background.', 2000);
        try {
            const rawData = activeItem.originalData || activeItem;
            const logId = activeItem['Log ID'] || rawData['Log ID'] || rawData['log_id'];
            const role = activeItem.Role_Name || rawData['Role Name'] || rawData['Role'] || rawData['role'] || 'Untitled Role';

            if (!logId) {
                toast.error("Log ID is missing. Cannot delete.");
                return;
            }

            console.log(`[Delete JD] Deleting ${role} (${logId})`);

            const response = await fetch(WEBHOOK_URLS.REQUIREMENT_INTAKE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    log_id: logId,
                    action: 'delete',
                    role: role,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) throw new Error('Delete webhook failed');

            markAsProcessed(logId);
            toast.success(`Successfully deleted ${role}.`);
            onClose();
            refreshNotifications(); // Update count immediately
            navigate('/jd');

        } catch (error) {
            console.error('[Delete JD Error]', error);
            toast.error('Failed to delete JD. Please try again.');
        } finally {
            stopLoading();
        }
    };
    const handleRegenerate = async () => {
        const rawData = activeItem.originalData || activeItem;
        const logId = activeItem['Log ID'] || rawData['Log ID'] || rawData['log_id'];

        if (!logId) {
            toast.error("Log ID is missing. Cannot regenerate.");
            return;
        }

        toast.info('Processing...', 'Requesting a new draft based on criteria in background.', 2000);
        try {
            const payload = {
                role: activeItem.Role_Name || rawData['Role Name'] || 'Untitled Role',
                experience: activeItem.Experience || 'Not specified',
                salary: activeItem.Salary || 'Not specified',
                location: activeItem.Location || 'Not specified',
                priority: activeItem.Urgency || 'Normal',
                total: activeItem.Total || 1,
                education: activeItem.Education || '',
                department: activeItem.Department || '',
                jobDescription: activeItem.Job_Description || '',
                keyResponsibilities: activeItem.Key_Responsibilities || '',
                log_id: logId,
                category: "Regenerate JD",
                timestamp: new Date().toISOString(),
                status: "Open",
                hired: 0
            };

            const response = await fetch(WEBHOOK_URLS.REQUIREMENT_INTAKE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Regeneration webhook failed');

            // Set polling state in context so the global poller starts
            clearProcessedLogId(logId);
            setWaitingForLogId(logId);
            setPollingStartTime(Date.now());

            toast.success('Regeneration request sent successfully! Redirecting to JD page...');

            // Wait a moment for toast
            setTimeout(() => {
                onClose();
                refreshNotifications();
                // Redirect to JD page with polling state
                navigate('/jd', {
                    state: {
                        waitingForLogId: logId,
                        isRegenerating: true
                    }
                });
            }, 1000);

        } catch (error) {
            console.error('[Regenerate JD Error]', error);
            toast.error('Failed to trigger regeneration. Please try again.');
        } finally {
            stopLoading();
        }
    };

    const handleRevise = () => {
        const rawData = activeItem.originalData || activeItem;
        const logId = activeItem['Log ID'] || rawData['Log ID'] || rawData['log_id'];

        const regenerationData = {
            role: activeItem.Role_Name || rawData['Role Name'] || '',
            experience: activeItem.Experience || '',
            salary: activeItem.Salary || '',
            location: activeItem.Location || '',
            priority: activeItem.Urgency || 'Normal',
            total: activeItem.Total || 1,
            education: activeItem.Education || '',
            department: activeItem.Department || '',
            jobDescription: activeItem.Job_Description || '',
            keyResponsibilities: activeItem.Key_Responsibilities || '',
            log_id: logId
        };

        onClose();
        navigate('/', { state: { regenerationData } });
    };



    return createPortal(
        <>
            <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in ${waitingForLogId ? 'cursor-wait' : ''}`}>
                <div className={`bg-[var(--card-bg)] rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh] border border-[var(--border-color)] relative transition-all duration-300 ${showRegenerateOptions ? 'max-w-2xl' : ''}`}>

                    {/* Loading Overlay for Regeneration */}
                    {waitingForLogId === activeItem?.['Log ID'] && (
                        <div className="absolute inset-0 z-[50] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 space-y-6 animate-fade-in">
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-10 h-10 text-indigo-500 animate-pulse" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Regenerating JD...</h3>
                                <p className="text-sm font-medium text-slate-400 max-w-xs leading-relaxed">
                                    Our AI is crafting a new version for you. This usually takes 5-10 seconds.
                                </p>
                            </div>
                        </div>
                    )}
                    {/* Decorative Gradient Line */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"></div>

                    {/* Header */}
                    <div className="px-8 py-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/30">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl shadow-inner border border-indigo-500/20">
                                <Bell className="w-6 h-6 text-indigo-600 animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                                    {showRegenerateOptions ? 'JD Rejected' : (activeItem.Role_Name ? activeItem.Role_Name : 'JD Approval Required')}
                                </h2>
                                {items.length > 1 && (
                                    <span className="text-xs text-[var(--text-secondary)] font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                        JD {currentIndex + 1} of {items.length}
                                    </span>
                                )}
                            </div>
                        </div>

                        {!showRegenerateOptions && (
                            <div className="flex items-center space-x-2">
                                {/* Navigation Controls */}
                                {items.length > 1 && (
                                    <div className="flex items-center bg-[var(--bg-secondary)] rounded-full p-1 mr-4 border border-[var(--border-color)] shadow-sm">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                            disabled={currentIndex === 0}
                                            className="p-2 rounded-full hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-indigo-600"
                                            title="Previous JD"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <div className="w-px h-4 bg-[var(--border-color)] mx-1"></div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                            disabled={currentIndex === items.length - 1}
                                            className="p-2 rounded-full hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-indigo-600"
                                            title="Next JD"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-[var(--bg-hover)] rounded-full transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-110 active:scale-95"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className={`p-8 flex-1 space-y-8 ${showRegenerateOptions ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                        {showRegenerateOptions ? (
                            <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
                                <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-2">
                                    <XCircle className="w-10 h-10 text-rose-500" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">What would you like to do next?</h3>
                                <p className="text-[var(--text-secondary)] max-w-xs">
                                    You can regenerate a new JD based on the same criteria, or simply close this notification.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* JD Poster Image */}
                                {(() => {
                                    const rawData = activeItem.originalData || activeItem;
                                    const imageKey = Object.keys(rawData).find(k =>
                                        ['jd image', 'jd image ', 'image', 'poster', 'preview', 'visual', 'jd_image', 'job image', 'Job image', 'JOB IMAGE'].includes(String(k).trim())
                                    );
                                    const imageUrl = activeItem.JD_Poster || (imageKey ? rawData[imageKey] : null);
                                    const isValidUrl = imageUrl && String(imageUrl) !== 'undefined' && String(imageUrl) !== 'null' && String(imageUrl).startsWith('http');
                                    
                                    return (
                                        <div className="rounded-2xl overflow-hidden border border-[var(--border-color)] bg-gray-50 min-h-[150px] flex items-center justify-center">
                                            {isValidUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt="Job Image"
                                                    className="w-full h-auto object-contain max-h-[400px]"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                                                    }}
                                                />
                                            ) : (
                                                <div className="text-center p-6 text-gray-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <p className="text-sm font-medium">No Job Image Available</p>
                                                    {imageKey && <p className="text-xs mt-1">Field: {imageKey}</p>}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* JD Description */}
                                {activeItem.Description && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest px-1">Job Description</h3>
                                        <div className="p-6 bg-[var(--bg-secondary)]/50 rounded-2xl border border-[var(--border-color)] text-[var(--text-primary)] leading-relaxed shadow-inner">
                                            {activeItem.Description}
                                        </div>
                                    </div>
                                )}

                                {/* JD Text Link */}
                                {(activeItem.Text || activeItem['JD DOC'] || activeItem['JD Doc'] || activeItem['JD text'] || activeItem['JD description link']) && (
                                    <div className="p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex items-center justify-between group hover:bg-indigo-500/10 transition-all duration-300">
                                        <div className="flex items-center text-indigo-700 font-bold">
                                            <div className="p-2 bg-indigo-500/10 rounded-lg mr-4 group-hover:scale-110 transition-transform">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-indigo-400 font-medium uppercase tracking-widest">Document</span>
                                                <span className="text-lg">Full Job Description</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const rawUrl = String(activeItem.Text || activeItem['JD DOC'] || activeItem['JD Doc'] || activeItem['JD text'] || activeItem['JD description link'] || '').trim();
                                                setSelectedDoc({
                                                    url: getDocUrls(rawUrl).preview,
                                                    title: activeItem.Role_Name || 'Job Description'
                                                });
                                            }}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center space-x-2 transition-all active:scale-95"
                                        >
                                            <span>View Document</span> <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex gap-6">
                        {showRegenerateOptions ? (
                            <>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-4 px-4 rounded-2xl bg-white text-slate-500 border border-slate-200 font-bold hover:bg-slate-50 transition-all duration-300 flex items-center justify-center group"
                                >
                                    <XCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                                    Close
                                </button>
                                <button
                                    onClick={handleRegenerate}
                                    className="flex-[2] py-4 px-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 transition-all duration-300 flex items-center justify-center group"
                                >
                                    <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                                    Regenerate JD
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleAction(activeItem.Reject_URL, 'reject')}
                                    className="flex-1 py-4 px-6 rounded-2xl border-2 border-rose-500/20 text-rose-600 font-bold hover:bg-rose-500 hover:text-white transition-all duration-300 flex items-center justify-center group shadow-sm"
                                >
                                    <XCircle className="w-6 h-6 mr-3 group-hover:rotate-90 transition-transform" />
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleAction(activeItem.Accept_URL, 'accept')}
                                    className="flex-1 py-4 px-6 rounded-2xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 transition-all duration-300 flex items-center justify-center border-none group transform hover:-translate-y-1 active:translate-y-0"
                                >
                                    <CheckCircle className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                                    Approve & Publish
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {selectedDoc && createPortal(
                <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl animate-fade-in" onClick={() => setSelectedDoc(null)}>
                    <div className="relative w-full max-w-5xl h-[85vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="absolute -top-12 left-0 right-0 flex justify-between items-center text-white px-4">
                            <h3 className="font-bold text-lg truncate flex-1 mr-4 text-shadow-sm">{selectedDoc.title}</h3>
                            <button
                                onClick={() => setSelectedDoc(null)}
                                className="p-2 text-white bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md"
                            >
                                <X className="w-8 h-8" />
                            </button>
                        </div>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full h-full border border-white/20">
                            <iframe
                                src={selectedDoc.url}
                                title="Document Preview"
                                className="w-full h-full border-none"
                                allow="autoplay"
                            ></iframe>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>,
        document.body
    );
};

export default NotificationModal;
