import React, { useState, useEffect, useRef } from 'react';
import { useSearch } from '../context/SearchContext';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { FileText, Image as ImageIcon, ExternalLink, X, Loader2, Eye, Share2, Send, CheckCircle, Users, Mail, MessageCircle, LayoutGrid, List, Search, Calendar, ChevronDown, XCircle, Clock, Linkedin, Trash2, MapPin, Star, Sparkles, Phone, Video, Download } from 'lucide-react';
import { fetchSheetData } from '../utils/googleSheets';
import { GOOGLE_SHEETS_CONFIG, WEBHOOK_URLS } from '../config';
import { getDocUrls, shareDoc } from '../utils/docHelper';
import { useNotification } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CustomDropdown = ({ label, options, value, onChange, name, placeholder = "Select an option", icon: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange({ target: { name, value: optionValue } });
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === value);
    const DisplayIcon = selectedOption?.icon || Icon;

    return (
        <div className={`relative group w-full ${isOpen ? 'z-[100]' : 'z-20'}`} ref={dropdownRef}>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-slate-50 border-2 border-slate-100 rounded-2xl ${DisplayIcon ? 'pl-[3.75rem]' : 'pl-4'} pr-10 h-[56px] text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all cursor-pointer flex items-center justify-between ${isOpen ? 'ring-4 ring-indigo-500/10 border-indigo-500 bg-white' : ''}`}
            >
                {DisplayIcon && <DisplayIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 pointer-events-none z-10 transition-transform group-hover:scale-110" />}
                <span className={!selectedOption ? 'text-gray-500' : ''}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[100] w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={`w-full px-4 py-2.5 text-sm font-bold text-left flex items-center gap-3 rounded-xl transition-all ${value === option.value ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-500'}`}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    {option.icon ? (
                                        <option.icon className={`w-5 h-5 ${value === option.value ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    ) : DisplayIcon ? (
                                        <div className="w-5 h-5" /> // Spacer for alignment
                                    ) : null}
                                    <span>{option.label}</span>
                                </div>
                                {value === option.value && <CheckCircle className="h-4 w-4" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Custom Styles for DatePicker
const datePickerStyles = `
    .custom-datepicker-container .react-datepicker-wrapper {
        width: 100%;
        display: block;
    }
    .glass-datepicker {
        font-family: inherit;
        background: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 16px !important;
        box-shadow: 
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06),
            0 20px 25px -5px rgba(0, 0, 0, 0.1) !important;
        padding: 0 !important;
    }
    .glass-datepicker .react-datepicker__month-container {
        padding: 20px;
    }
    .glass-datepicker .react-datepicker__header {
        background: transparent !important;
        border-bottom: 1px solid #f1f5f9;
        padding-top: 0;
        padding-bottom: 16px;
        margin-bottom: 8px;
    }
    .glass-datepicker .react-datepicker__current-month {
        color: #0f172a;
        font-weight: 800;
        font-size: 1.1rem;
        margin-bottom: 8px;
        letter-spacing: -0.025em;
    }
    .glass-datepicker .react-datepicker__day-name {
        color: #64748b;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 0.75rem;
        width: 36px;
        line-height: 36px;
        margin: 2px;
        letter-spacing: 0.05em;
    }
    .glass-datepicker .react-datepicker__day {
        color: #334155;
        width: 36px;
        line-height: 36px;
        margin: 2px;
        border-radius: 10px;
        font-weight: 600;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid transparent;
    }
    .glass-datepicker .react-datepicker__day:hover {
        background-color: #f1f5f9;
        color: #0f172a;
        transform: scale(1.1);
    }
    .glass-datepicker .react-datepicker__day--selected,
    .glass-datepicker .react-datepicker__day--keyboard-selected {
        background: #0f172a !important;
        color: white !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        transform: scale(1.05);
    }
    .glass-datepicker .react-datepicker__day--today {
        color: #0f172a;
        font-weight: 900;
        background-color: transparent;
        border: 1px solid #e2e8f0;
    }
    .glass-datepicker .react-datepicker__day--disabled {
        color: #cbd5e1 !important;
        cursor: not-allowed;
    }
    .glass-datepicker .react-datepicker__time-container {
        border-left: 1px solid #f1f5f9 !important;
        width: 110px !important;
        background: #ffffff;
        border-radius: 0 16px 16px 0;
    }
    .glass-datepicker .react-datepicker__time-container .react-datepicker__time {
        background: transparent !important;
        border-radius: 0 0 16px 0;
    }
    .glass-datepicker .react-datepicker__time-container .react-datepicker__time-box {
        width: 100% !important;
    }
    .glass-datepicker .react-datepicker__header--time {
        background: transparent !important;
        border-bottom: 1px solid #f1f5f9;
        padding: 20px 10px 16px !important;
        font-weight: 800;
        font-size: 0.85rem;
        color: #0f172a;
    }
    .glass-datepicker .react-datepicker__time-list {
        height: 260px !important;
        overflow-y: auto !important;
    }
    .glass-datepicker .react-datepicker__time-list::-webkit-scrollbar {
        width: 4px;
    }
    .glass-datepicker .react-datepicker__time-list::-webkit-scrollbar-track {
        background: transparent;
    }
    .glass-datepicker .react-datepicker__time-list::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 4px;
    }
    .glass-datepicker .react-datepicker__time-list-item {
        height: auto !important;
        padding: 6px 8px !important;
        transition: all 0.15s;
        font-size: 0.8rem;
        font-weight: 500;
        color: #475569;
        display: flex !important;
        align-items: center;
        justify-content: center;
        margin: 2px 6px;
        border-radius: 8px;
    }
    .glass-datepicker .react-datepicker__time-list-item:hover {
        background-color: #f1f5f9 !important;
        color: #0f172a !important;
    }
    .glass-datepicker .react-datepicker__time-list-item--selected {
        background: #0f172a !important;
        color: white !important;
        font-weight: 700;
    }
    .glass-datepicker .react-datepicker__navigation {
        top: 20px;
        border-radius: 50%;
        background-color: #f8fafc;
        width: 32px;
        height: 32px;
        transition: all 0.2s;
        border: 1px solid #e2e8f0;
    }
    .glass-datepicker .react-datepicker__navigation--previous {
        left: 20px;
    }
    .glass-datepicker .react-datepicker__navigation--next {
        right: auto;
        left: 260px;
    }
    .glass-datepicker .react-datepicker__navigation:hover {
        background-color: #f1f5f9;
        transform: scale(1.05);
        border-color: #cbd5e1;
    }
    .glass-datepicker .react-datepicker__navigation-icon::before {
        border-color: #475569;
        border-width: 2px 2px 0 0;
        height: 7px;
        width: 7px;
        top: 11px;
    }
    .react-datepicker-popper {
        z-index: 99999 !important;
    }
    .react-datepicker-popper .react-datepicker__triangle {
        display: none !important;
    }
`;

import { useData } from '../context/DataContext';

const formatToIST = (dateString) => {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (e) {
        return dateString;
    }
};

// Helper to find JD document URL from the 'Job Description' column
const getJdDocUrl = (item) => {
    if (!item) return '';
    // Look for 'Job Description' column in various casings
    const urlKeys = ['Job Description', 'Job description', 'job description', 'JOB DESCRIPTION', 'JD DOC', 'JD Doc', 'JD description link'];
    for (const key of urlKeys) {
        const val = item[key];
        if (val && typeof val === 'string' && (val.trim().startsWith('http://') || val.trim().startsWith('https://'))) {
            return val.trim();
        }
    }
    // Fallback: search all keys case-insensitively
    for (const key of Object.keys(item)) {
        const lk = key.toLowerCase().trim();
        if (lk === 'job description' || lk === 'jd doc' || lk === 'jd description link') {
            const val = item[key];
            if (val && typeof val === 'string' && (val.trim().startsWith('http://') || val.trim().startsWith('https://'))) {
                return val.trim();
            }
        }
    }
    return '';
};

const DocIframeViewer = ({ docUrl, originalUrl, jdText }) => {
    const [textContent, setTextContent] = useState(null);
    const [iframeUrl, setIframeUrl] = useState(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState(null); // 'text' or 'iframe'

    useEffect(() => {
        let isMounted = true;

        const loadDoc = async () => {
            // If we already have the JD text from the spreadsheet, use it directly!
            // But skip if jdText is actually a URL (not text content)
            const isJdTextUrl = jdText && (jdText.trim().startsWith('http://') || jdText.trim().startsWith('https://'));
            if (jdText && jdText.trim().length > 10 && !isJdTextUrl) {
                if (isMounted) {
                    setMode('text');
                    setTextContent(jdText.trim());
                    setLoading(false);
                }
                return;
            }

            if (!docUrl.includes('studio.pucho.ai')) {
                // Non-Pucho URLs: use iframe (Google Docs viewer for unknown types)
                if (isMounted) {
                    setMode('iframe');
                    setIframeUrl(docUrl.includes('docs.google.com') ? docUrl : `https://docs.google.com/viewer?url=${encodeURIComponent(docUrl)}&embedded=true`);
                    setLoading(false);
                }
                return;
            }

            // For Pucho API URLs, fetch text content via local Vite proxy (bypasses CORS)
            const targetUrl = originalUrl || docUrl;
            // Convert https://studio.pucho.ai/api/v1/step-files/... to /pucho-files/api/v1/step-files/...
            const proxyPath = targetUrl.replace('https://studio.pucho.ai', '/pucho-files');

            try {
                const response = await fetch(proxyPath);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const text = await response.text();
                if (text && text.trim().length > 0 && isMounted) {
                    setMode('text');
                    setTextContent(text.trim());
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error("Pucho proxy fetch failed, falling back to iframe:", err);
            }

            // Proxy failed or empty text — fall back to iframe with the original URL
            if (isMounted) {
                setMode('iframe');
                setIframeUrl(targetUrl);
                setLoading(false);
            }
        };

        loadDoc();

        return () => { isMounted = false; };
    }, [docUrl, originalUrl, jdText]);

    // Parse text content into structured sections for beautiful rendering
    const renderFormattedText = (text) => {
        if (!text) return null;
        const lines = text.split('\n');
        const elements = [];

        lines.forEach((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) {
                elements.push(<div key={idx} className="h-3" />);
                return;
            }

            // Detect emoji headings like "🚀 URGENT HIRING..."
            if (/^[🚀✔⚡💡🎯📌🔥⭐✅❌📋👉🏭💼📧📞]/.test(trimmed) || /^#{1,3}\s/.test(trimmed)) {
                const cleanText = trimmed.replace(/^#{1,3}\s/, '');
                elements.push(
                    <h3 key={idx} className="text-lg font-bold text-gray-900 mt-4 mb-2 leading-snug">{cleanText}</h3>
                );
                return;
            }

            // Detect section headers (ALL CAPS or ending with colon)
            if (
                (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && /[A-Z]/.test(trimmed)) ||
                (/^[A-Z][A-Za-z\s&\-–()]+:$/.test(trimmed))
            ) {
                elements.push(
                    <h4 key={idx} className="text-base font-bold text-indigo-700 mt-5 mb-2 uppercase tracking-wide border-b border-indigo-100 pb-1">{trimmed}</h4>
                );
                return;
            }

            // Detect labeled sections like "Department: Engineering Services"
            if (/^[A-Z][A-Za-z\s&\-–]+:\s.+/.test(trimmed) && trimmed.length < 120) {
                const colonIdx = trimmed.indexOf(':');
                const label = trimmed.substring(0, colonIdx).trim();
                const value = trimmed.substring(colonIdx + 1).trim();
                elements.push(
                    <div key={idx} className="flex gap-2 py-1.5">
                        <span className="font-bold text-gray-800 text-[15px] min-w-[140px] shrink-0">{label}:</span>
                        <span className="text-[15px] font-semibold text-gray-800">{value}</span>
                    </div>
                );
                return;
            }

            // Detect bullet points
            if (/^[•●▪▸\-\*]\s/.test(trimmed) || /^\d+[\.\)]\s/.test(trimmed)) {
                const bulletText = trimmed.replace(/^[•●▪▸\-\*]\s*/, '').replace(/^\d+[\.\)]\s*/, '');
                elements.push(
                    <div key={idx} className="flex items-start gap-3 py-1 pl-2">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 shrink-0" />
                        <span className="text-[15px] font-semibold text-gray-800 leading-relaxed">{bulletText}</span>
                    </div>
                );
                return;
            }

            // Detect checkmark items like "✔ Be part of..."
            if (/^[✔✓☑]\s/.test(trimmed)) {
                const checkText = trimmed.replace(/^[✔✓☑]\s*/, '');
                elements.push(
                    <div key={idx} className="flex items-start gap-3 py-1 pl-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-[15px] font-semibold text-gray-800 leading-relaxed">{checkText}</span>
                    </div>
                );
                return;
            }

            // Regular paragraph text
            elements.push(
                <p key={idx} className="text-[15px] font-semibold text-gray-800 leading-relaxed">{trimmed}</p>
            );
        });

        return elements;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full text-indigo-400 p-8 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin" />
                <span className="font-medium animate-pulse">Loading document data...</span>
            </div>
        );
    }

    if (error) {
        const fallbackSrc = originalUrl || docUrl;
        return (
            <iframe
                src={fallbackSrc}
                title="Document Preview"
                className="w-full h-full border-none shadow-inner absolute inset-0 bg-white"
                allow="autoplay"
            ></iframe>
        );
    }

    if (mode === 'text' && textContent) {
        return (
            <div className="absolute inset-0 w-full h-full overflow-y-auto bg-white p-8 md:p-12 pb-24 md:pb-32 custom-scrollbar">
                <div className="max-w-3xl mx-auto pb-8">
                    {renderFormattedText(textContent)}
                </div>
            </div>
        );
    }

    return (
        <iframe
            src={iframeUrl}
            title="Document Preview"
            className="w-full h-full border-none shadow-inner absolute inset-0 bg-white"
            allow="autoplay"
        ></iframe>
    );
};

const JD = () => {
    const { jd: rawJd, log: candidates, requirements, jdApproval, loading: contextLoading, forceRefresh, setActiveRoute } = useData();
    const [data, setData] = useState([]);
    const pendingStatusUpdates = useRef({});

    useEffect(() => { setActiveRoute('jd'); }, [setActiveRoute]);

    useEffect(() => {
        // Sync requirements from context and enrich with JD-specific data (docs/images) from the JD sheet
        // Also fallback to JD Approval sheet for items not yet published to Final JD
        setData(requirements.map(item => {
            const logId = String(item['Log ID'] || item.log_id || "");
            const pending = pendingStatusUpdates.current[logId];

            // Find matching JD entry for docs/posters (Final JD sheet first, then JD Approval)
            const jdEntry = rawJd.find(j => String(j['Log ID']) === logId) || {};
            const approvalEntry = (jdApproval || []).find(j => String(j['Log ID']) === logId) || {};

            // Merge: requirement base → JD Approval (has JD DOC, JD Image, Accept/Reject URLs) → Final JD (has JOB DESCRIPTION, JD Image, Status)
            const finalItem = { ...item, ...approvalEntry, ...jdEntry };

            if (pending && (Date.now() - pending.timestamp < 30000)) {
                return { ...finalItem, Status: pending.status };
            }
            return finalItem;
        }));
    }, [requirements, rawJd, jdApproval]);

    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [selectedJDItem, setSelectedJDItem] = useState(null);

    // We still need local loading state for finer control (e.g. not showing full screen loader during silent poll, but maybe showing it during initial wait)
    // Actually, context 'loading' is false during silent refresh.
    // So we can use contextLoading for initial load.

    const { searchQuery } = useSearch();
    const toast = useToast();
    const { startLoading, stopLoading } = useLoading();
    const { showModal, triggerNotification } = useNotification();
    const datePickerRef1 = useRef(null);
    const datePickerRef2 = useRef(null);
    const [viewMode, setViewMode] = useState('grid');
    const [statusFilter, setStatusFilter] = useState('all');

    // Polling State for New Approvals
    const location = useLocation();
    const [waitingForLogId, setWaitingForLogId] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);


    // Candidate Modal State
    // const [candidates, setCandidates] = useState([]); // Removed local state
    const [showCandidateModal, setShowCandidateModal] = useState(false);
    const [selectedLogId, setSelectedLogId] = useState(null);
    const selectedJDCandidates = React.useMemo(() => {
        if (!selectedLogId) return [];
        const sId = String(selectedLogId).trim();
        return candidates.filter(c => String(c['Log ID'] || c.log_id || "").trim() === sId);
    }, [candidates, selectedLogId]);

    const [selectedJDTitle, setSelectedJDTitle] = useState('');
    const [activeMessage, setActiveMessage] = useState(null); // { candidate: object, type: 'email' | 'whatsapp', content: string }
    const [statusToConfirm, setStatusToConfirm] = useState(null); // { logId, currentStatus, role } - For JD Status
    const [deleteConfirmation, setDeleteConfirmation] = useState(null); // { logId, role } - For JD Deletion
    const [candidateStatusConfirm, setCandidateStatusConfirm] = useState(null); // { candidate, targetStatus } - For Candidate Status
    const [webhookResponse, setWebhookResponse] = useState(null); // Detailed response modal for all actions
    const [shortlistDatetime, setShortlistDatetime] = useState('');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [openJdStatusDropdownId, setOpenJdStatusDropdownId] = useState(null);
    const [openCandidateStatusDropdownId, setOpenCandidateStatusDropdownId] = useState(null); // candidate email or log_id
    const [interviewCalendarOpen, setInterviewCalendarOpen] = useState(false);
    const [shortlistCalendarOpen, setShortlistCalendarOpen] = useState(false);

    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [messageSentStatus, setMessageSentStatus] = useState('none'); // 'waiting' | 'approved' | 'error' | 'comparing'
    const [pollingIntervalId, setPollingIntervalId] = useState(null);
    const [comparisonData, setComparisonData] = useState(null); // Stores messages and action URLs
    const [isActioningSelection, setIsActioningSelection] = useState(false);
    const [selectedChoice, setSelectedChoice] = useState('generated'); // 'user' | 'generated'
    const [messageType, setMessageType] = useState('interview');
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [interviewDatetime, setInterviewDatetime] = useState('');
    const [interviewMethod, setInterviewMethod] = useState('Google Meet');
    const activeMessageRef = useRef(null);
    useEffect(() => { activeMessageRef.current = activeMessage; }, [activeMessage]);



    // Helper for date validation (Sundays disabled)
    const getMinDate = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const handleDateChange = (e, setter) => {
        const date = new Date(e.target.value);
        if (date.getDay() === 0) {
            toast.error("Invalid Date", "Sundays are not available for selection. Please choose another date.");
            return;
        }
        setter(e.target.value);
    };

    const handleStatusToggle = async (logId, currentStatus) => {
        const sLogId = String(logId).trim();
        const normalizedStatus = currentStatus.toLowerCase().trim();
        const newStatus = normalizedStatus === 'open' ? 'closed' : 'open';
        console.log(`[JD Status Toggle]LogId: ${sLogId}, Current: ${normalizedStatus}, New: ${newStatus} `);

        info('Processing...', 'Updating JD Status in background.', 2000);

        // Track pending status update to prevent snapback during sync
        pendingStatusUpdates.current[sLogId] = {
            status: newStatus,
            timestamp: Date.now()
        };

        // Optimistic UI Update for instant feedback
        setData(prev => prev.map(item =>
            String(item['Log ID']) === sLogId ? { ...item, Status: newStatus } : item
        ));

        try {
            const response = await fetch(WEBHOOK_URLS.JD_STATUS_UPDATE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logid: logId, status: newStatus, from: 'JD' })
            });

            if (response.ok) {
                console.log(`[Status Update] ${logId} -> ${newStatus} `);
                // Wait for 1 second to allow Google Sheets sync (reduced from 5s)
                await new Promise(resolve => setTimeout(resolve, 1000));
                setWebhookResponse({
                    success: true,
                    message: "Status Updated",
                    summary: `JD is now ${newStatus}.`,
                    type: 'check'
                });
                await forceRefresh(); // Explicit refresh
            } else {
                const errorData = await response.json().catch(() => ({}));
                setWebhookResponse({
                    success: false,
                    message: "Attention Required",
                    summary: errorData.message || "Could not update JD status.",
                    type: 'alert'
                });
                forceRefresh();
            }
        } catch (error) {
            console.error('[Status Update Error]', error);
            setWebhookResponse({
                success: false,
                message: "Attention Required",
                summary: "Network error while updating status.",
                type: 'alert'
            });
            forceRefresh(); // Rollback on error
        } finally {
            stopLoading();
            setStatusToConfirm(null);
        }
    };

    const handleDeleteJD = async (logId, role) => {
        setDeleteConfirmation(null);
        info('Processing...', 'Deleting Job Description in background.', 2000);

        try {
            console.log(`[Delete JD] Deleting ${role} (${logId})`);

            // Webhook URL provided by user
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

            if (response.ok) {
                // Wait for 1 second to allow Google Sheets sync (reduced from 5s)
                await new Promise(resolve => setTimeout(resolve, 1000));
                setWebhookResponse({
                    success: true,
                    message: "JD Deleted",
                    summary: `Successfully deleted ${role}.`,
                    type: 'check'
                });
                await forceRefresh(); // Explicit refresh
            } else {
                const errorData = await response.json().catch(() => ({}));
                setWebhookResponse({
                    success: false,
                    message: "Attention Required",
                    summary: errorData.message || `Failed to delete ${role}.`,
                    type: 'alert'
                });
            }
        } catch (error) {
            console.error('[Delete JD Error]', error);
            setWebhookResponse({
                success: false,
                message: "Attention Required",
                summary: "Network error while deleting JD.",
                type: 'alert'
            });
            forceRefresh();
        } finally {
            stopLoading();
        }
    };


    const handleUpdateCandidateStatus = async (candidate, targetStatus) => {
        const isShortlisting = targetStatus.toLowerCase().includes('shortlist');

        if (isShortlisting) {
            info('Processing...', 'Generating AI Context in background.', 2000);
            setCandidateStatusConfirm(null);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
            info('Processing...', 'Updating Candidate Status in background.', 2000);
        }

        console.log(`[Update Status]Candidate: ${candidate.Email}, Target: ${targetStatus} `);

        try {
            const webhookUrl = isShortlisting ? WEBHOOK_URLS.SHORTLIST_STATUS : WEBHOOK_URLS.LOG_STATUS_UPDATE;

            const payload = isShortlisting ? {
                log_id: candidate.log_id || candidate['Log ID'] || "",
                email: candidate.email || candidate.Email || "",
                candidateName: candidate.name || candidate.Name || candidate['Name of the Candidate'] || "",
                role: candidate.Role || candidate.role || selectedJDTitle || "Not specified",
                status: targetStatus,
                interview_time: shortlistDatetime ? formatToIST(shortlistDatetime) : null,
                interview_method: interviewMethod,
                action: 'new schedue',
                meetingLink: 'https://calendly.com/shailesh-limbani-solarischemtech/interview-meeting',
                timestamp: new Date().toISOString()
            } : {
                log_id: candidate.log_id || candidate['Log ID'] || "",
                email: candidate.email || candidate.Email || "",
                candidateName: candidate.name || candidate.Name || candidate['Name of the Candidate'] || "",
                role: candidate.Role || candidate.role || selectedJDTitle || "Not specified",
                status: targetStatus,
                interview_time: shortlistDatetime ? formatToIST(shortlistDatetime) : null,
                interview_method: interviewMethod,
                action: 'candidate_status_update',
                timestamp: new Date().toISOString()
            };

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const responseData = await response.json();

            if (responseData.success || responseData.status === 'success') {
                setCandidateStatusConfirm(null);
                setShortlistDatetime('');
                await new Promise(resolve => setTimeout(resolve, 1000));

                setWebhookResponse({
                    success: true,
                    message: responseData.interview_scheduled === 'yes' ? 'Interview Scheduled' : 'Action Successful',
                    summary: responseData.message || `Candidate marked as ${targetStatus}.`,
                    type: responseData.interview_scheduled === 'yes' ? 'calendar' : 'check'
                });
                await forceRefresh();
            } else {
                // Construct specific error
                const errorMsg = responseData.message || responseData.summery || responseData.summary || 'Failed to update status';

                setWebhookResponse({
                    success: false,
                    message: (errorMsg.toLowerCase().includes("slot already booked") || responseData.interview_scheduled === "no") ? "Scheduling Conflict" : "Attention Required",
                    summary: errorMsg,
                    type: (errorMsg.toLowerCase().includes("slot already booked") || responseData.interview_scheduled === "no") ? 'calendar' : 'alert'
                });
            }
        } catch (error) {
            console.error('[Update Status Error]', error);
            setWebhookResponse({
                success: false,
                message: "Attention Required",
                summary: error.message,
                type: 'alert'
            });
        } finally {
            stopLoading();
        }
    };

    const handleSendMessage = async () => {
        info('Processing...', 'Dispatching Communication in background.', 2000);
        try {
            const chatId = `CHAT-${Date.now()}`;
            const payload = {
                candidate: String(activeMessage.candidate?.['Name of the Candidate'] || activeMessage.candidate?.Name || '').trim(),
                candidateName: String(activeMessage.candidate?.['Name of the Candidate'] || activeMessage.candidate?.Name || '').trim(),
                email: String(activeMessage.candidate?.Email || activeMessage.candidate?.email || '').trim(),
                role: selectedJDTitle || activeMessage.candidate?.Role || activeMessage.candidate?.role || 'Not specified',
                log_id: String(activeMessage.candidate?.['Log ID'] || activeMessage.candidate?.log_id || '').trim(),
                type: activeMessage.type || 'email',
                purpose: messageType,
                message: activeMessage.content || '',
                chat_id: chatId,
                channel: activeMessage.type || 'email',
                message_intent: messageType,
                context: activeMessage.content || '',
                interview_time: interviewDatetime ? formatToIST(interviewDatetime) : null,
                interview_method: interviewMethod,
                'meeting type': interviewMethod,
                response: interviewDatetime ? formatToIST(interviewDatetime) : null,
                timestamp: new Date().toISOString()
            };

            const originalContent = activeMessage.content || '';
            let resolved = false; // Shared flag: whichever wins sets this to true

            // --- STEP 1: Fire webhook and check for immediate error ---
            try {
                const res = await fetch(WEBHOOK_URLS.AI_MESSAGE_GEN, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                let data = {};
                try { data = await res.json(); } catch (e) { /* non-JSON response, continue to polling */ }
                console.log('[handleSendMessage] Webhook response:', data);

                // If webhook returns an error, show it immediately and stop
                if (data && (data.success === false || data.interview_scheduled === 'no')) {
                    const errorMsg = data.message || data.summery || data.summary || 'Request failed.';
                    setWebhookResponse({
                        success: false,
                        message: errorMsg.toLowerCase().includes('slot already booked') || data.interview_scheduled === 'no' ? 'Scheduling Conflict' : 'Attention Required',
                        summary: errorMsg,
                        type: errorMsg.toLowerCase().includes('slot already booked') || data.interview_scheduled === 'no' ? 'calendar' : 'alert'
                    });
                    setActiveMessage(null);
                    setMessageSentStatus('none');
                    stopLoading();
                    return; // Done — don't poll
                }
            } catch (e) {
                console.warn('[handleSendMessage] Webhook fetch error (continuing to poll):', e);
                // CORS or network error on webhook — continue to sheet polling
            }

            // --- STEP 2: Poll Google Sheet for generated message ---
            const initialWait = 2000;
            const pollInterval = 2000;
            const maxWait = 90000; // 1:30 min timeout

            await new Promise(resolve => setTimeout(resolve, initialWait));
            let totalWaitTime = initialWait;

            while (true) {
                if (!activeMessageRef.current) {
                    console.log('[handleSendMessage] Stopping poll: Modal closed.');
                    return;
                }

                if (totalWaitTime >= maxWait) {
                    setMessageSentStatus('error');
                    stopLoading();
                    return;
                }

                console.log(`[handleSendMessage] Polling Message Approval sheet... (waited ${totalWaitTime / 1000}s)`);

                try {
                    const sheetData = await fetchSheetData(GOOGLE_SHEETS_CONFIG.HR_WORKFLOW_ID, GOOGLE_SHEETS_CONFIG.GIDS.MESSAGE_APPROVAL, { force: true });

                    // Debug: log column names on first poll
                    if (totalWaitTime === initialWait && sheetData.length > 0) {
                        console.log('[handleSendMessage] Sheet columns:', Object.keys(sheetData[0]));
                        console.log('[handleSendMessage] Looking for chatId:', chatId);
                        // Also log last 2 rows for debugging
                        console.log('[handleSendMessage] Last 2 rows:', sheetData.slice(-2).map(r => Object.entries(r).reduce((a, [k, v]) => { if (v) a[k] = v; return a; }, {})));
                    }

                    // Try column-name matching first, then fallback to searching ALL values
                    let row = [...sheetData].reverse().find(r => {
                        const id = String(r['Chat_id'] || r['Chat ID'] || r['ChatID'] || r['chat_id'] || r['Chat_Id'] || r['chatId'] || r['chat id'] || '').trim();
                        return id === chatId;
                    });

                    // Fallback: search every column value for the chatId
                    if (!row) {
                        row = sheetData.find(r => Object.values(r).some(v => String(v).trim() === chatId));
                    }

                    if (row) {
                        console.log('[handleSendMessage] Found matching row:', row);
                        const genMsg = (row['Generated Message'] || row['Generated Message '] || row['GeneratedMessage'] || row['Generated Mess'] || row['generated_message'] || row['Generated'] || row['AI Message'] || '').trim();
                        const acceptUrl = (row['Approved'] || row['Accepted URL'] || row['Accept'] || row['Approve'] || '').trim();
                        const rejectUrl = (row['Rejected'] || row['Rejected URL'] || row['Reject'] || row['Decline'] || '').trim();
                        const rowStatus = String(row['Status'] || '').trim().toLowerCase();

                        if (genMsg) {
                            setComparisonData({
                                user: (row.Message || row['User Message'] || originalContent || 'Standard system template').trim(),
                                generated: genMsg,
                                acceptUrl: acceptUrl,
                                rejectUrl: rejectUrl
                            });
                            setMessageSentStatus('comparison');
                            setSelectedChoice('generated');
                            stopLoading();
                            return;
                        }

                        else if (rowStatus.includes('accepted') || rowStatus.includes('sent') || rowStatus.includes('complete')) {
                            // Status indicates completion but no generated message yet
                            setMessageSentStatus('success');
                            stopLoading();
                            return;
                        }
                    }
                } catch (err) {
                    console.error('[handleSendMessage] Polling error:', err);
                }

                await new Promise(resolve => setTimeout(resolve, pollInterval));
                totalWaitTime += pollInterval;
            }

        } catch (err) {
            console.error('[handleSendMessage] Error:', err);
            setMessageSentStatus('error');
        } finally {
            stopLoading();
        }
    };

    const handleActionChoice = async (url) => {
        if (!url) return;
        info('Processing...', 'Applying Choice in background.', 2000);
        try {
            const response = await fetch(url);
            const responseData = await response.json().catch(() => ({}));

            if (response.ok && (responseData.success !== false && responseData.status !== 'error')) {
                setMessageSentStatus('success');
                setTimeout(() => {
                    setActiveMessage(null);
                    setMessageSentStatus('none');
                }, 2000);
            } else {
                const errorMsg = responseData.message || responseData.summery || responseData.summary || "Could not dispatch the selected message.";
                setWebhookResponse({
                    success: false,
                    message: (errorMsg.toLowerCase().includes("slot already booked") || responseData.interview_scheduled === "no") ? "Scheduling Conflict" : "Attention Required",
                    summary: errorMsg,
                    type: (errorMsg.toLowerCase().includes("slot already booked") || responseData.interview_scheduled === "no") ? 'calendar' : 'alert'
                });
            }
        } catch (err) {
            console.error('[handleActionChoice] Error:', err);
            setWebhookResponse({
                success: false,
                message: "Attention Required",
                summary: "A network error occurred while dispatching the message.",
                type: 'alert'
            });
        } finally {
            stopLoading();
        }
    };

    const handleLinkedinShare = async (item) => {
        const logId = item['Log ID'] || item.log_id;
        const role = item.Role || item.ROLE || item['Role Name'] || 'Untitled Role';
        const url = WEBHOOK_URLS.REQUIREMENT_INTAKE;

        // Extract Image URL
        const imageKey = Object.keys(item).find(k =>
            k.trim().toLowerCase().includes('image') ||
            k.trim().toLowerCase().includes('poster') ||
            k.trim().toLowerCase().includes('preview')
        ) || 'JOB DESCRIPTION IMAGE';
        const imageUrl = item[imageKey] || item['JD Image'] || '';

        // Extract Doc URL
        const rawDocUrl = item['JD DOC'] || item['JOB DESCRIPTION'] || item['JD Doc'] || item['JD Accepted'] || item['Accepted'] || item['JD Rejected'] || item['Rejected'] || '';
        const docUrl = rawDocUrl && rawDocUrl !== '#' ? getDocUrls(rawDocUrl).download : ''; // Use download link if available

        const payload = {
            log_id: logId,
            role: role,
            category: 'linked in',
            image_url: imageUrl,
            doc_url: docUrl,
            timestamp: new Date().toISOString()
        };

        console.log('[LinkedIn Share] Triggering webhook:', payload);
        info('Processing...', 'Connecting to LinkedIn API...', 2000);

        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            toast.success("Shared Successfully", `LinkedIn request sent for ${role}`);
        } catch (error) {
            console.error('[LinkedIn Share Error]', error);
            toast.error("Share Failed", "Failed to send LinkedIn share request.");
        } finally {
            stopLoading();
        }
    };

    // Check for incoming "Waiting" state from NotificationModal
    useEffect(() => {
        if (location.state?.waitingForLogId) {
            const logId = location.state.waitingForLogId;
            console.log(`[JD] Waiting for Log ID: ${logId}`);
            setWaitingForLogId(logId);
            setIsPolling(true);

            if (location.state.isRegenerating) {
                setIsRegenerating(true);
                info('Processing...', 'Regenerating JD in background.', 2000);
            }

            // Clear navigation state to avoid re-triggering on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // stop loading when modal pops up
    useEffect(() => {
        if (showModal && isRegenerating) {
            stopLoading();
            setIsRegenerating(false);
            setIsPolling(false);
            setWaitingForLogId(null);
        }
    }, [showModal, isRegenerating]);

    useEffect(() => {
        let isMounted = true;
        let pollInterval;
        let attempts = 0;
        const maxAttempts = 18; // 1:30 minutes total (18 * 5000ms)

        const pollLogic = async () => {
            // Check if data contains waitingForLogId
            if (data && waitingForLogId) {
                const found = data.some(row => String(row['Log ID']) === String(waitingForLogId));
                if (found) {
                    console.log(`[JD] Found waiting Log ID: ${waitingForLogId}! Stopping poll.`);

                    // Automatically filter to this item so user sees it immediately
                    setStatusFilter('all');
                    // We don't have a direct way to update SearchContext from here easily 
                    // if it's external, but we can override matching criteria.

                    setWaitingForLogId(null);
                    setIsPolling(false);
                    setIsRegenerating(false);
                    stopLoading();

                    if (isRegenerating) {
                        toast.success("JD Regenerated", "The new Job Description version is now live.");
                    } else {
                        toast.success("JD Published", "The approved Job Description is now live.");
                    }
                } else {
                    attempts++;
                    console.log(`[JD] Waiting for ${waitingForLogId}... Not found yet.Attempt ${attempts}/${maxAttempts}`);
                    if (attempts >= maxAttempts) {
                        console.warn('[JD] Polling timed out.');
                        setWaitingForLogId(null);
                        setIsPolling(false);
                        setIsRegenerating(false);
                        stopLoading();
                        toast.error("Timeout", "The new JD is taking longer than expected to appear. Please refresh the page in a few moments.", 6000);
                    } else {
                        // Refresh data silently
                        await forceRefresh();
                    }
                }
            }
        }

        if (isPolling) {
            pollInterval = setInterval(pollLogic, 5000);
        }

        return () => {
            isMounted = false;
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [isPolling, waitingForLogId, data]);


    if (contextLoading && !isPolling) return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="glass-card p-4 md:p-6 rounded-2xl border border-[var(--border-color)] animate-pulse bg-white/50">
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-12 h-12 bg-purple-100/50 rounded-xl"></div>
                            <div className="flex space-x-2">
                                <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                                <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                            </div>
                        </div>
                        <div className="h-6 bg-gray-200/50 rounded-lg w-3/4 mb-3"></div>
                        <div className="h-4 bg-gray-100/50 rounded-lg w-1/2 mb-8"></div>
                        <div className="flex gap-3 mt-auto">
                            <div className="flex-1 h-11 bg-gray-100 rounded-xl"></div>
                            <div className="flex-1 h-11 bg-purple-100/30 rounded-xl"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );


    const filteredData = data.filter(item => {
        // Skip rows with no role AND no log ID (empty/junk sheet rows)
        const roleRaw = (item['Role Name'] || item.ROLE || item.Role || item['ROLE NAME'] || '').toString().trim();
        const logIdRaw = (item['Log ID'] || '').toString().trim();
        if (!roleRaw && !logIdRaw) return false;

        // Robustly find role and content for search
        const role = (item['Role Name'] || item.ROLE || item.Role || item['ROLE NAME'] || '').toString();
        const content = (item['JD DOC'] || item['JOB DESCRIPTION'] || item['JD Accepted'] || item['Accepted'] || item['JD Rejected'] || item['Rejected'] || '').toString();

        const matchesSearch = !searchQuery ||
            role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            content.toLowerCase().includes(searchQuery.toLowerCase());

        // Robustly find status from JD or matching requirement
        const jdStatus = (item.Status || item.status || '').toString().trim().toLowerCase();
        let rawStatus = jdStatus;

        if (!rawStatus) {
            const matchingReq = requirements.find(r => String(r['Log ID'] || r['log_id']) === String(item['Log ID']));
            rawStatus = (matchingReq?.['Current Status of Requirement'] || matchingReq?.Status || matchingReq?.status || 'open').toString().trim().toLowerCase();
        }

        const itemStatus = rawStatus.includes('close') ? 'closed' : 'open';

        const matchesStatus = statusFilter === 'all' || itemStatus === statusFilter;

        // Force match if this is the item we just approved
        const isTargeted = location.state?.waitingForLogId && String(item['Log ID']) === String(location.state.waitingForLogId);
        if (isTargeted) return true;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Unified Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-end gap-6 mb-8 relative z-30">

                <div className="flex items-center space-x-4 w-full md:w-auto">
                    <div className="flex items-center bg-white/80 backdrop-blur-md p-2.5 px-6 rounded-2xl border border-[var(--border-color)]/60 shadow-sm">
                        {/* Status Toggle */}
                        <div className="flex items-center bg-slate-100/50 p-1 rounded-2xl border border-slate-200/60 mr-4">
                            {['all', 'open', 'closed'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-5 py-2 rounded-xl text-[10px] uppercase tracking-[0.15em] transition-all duration-300 ${statusFilter === status
                                        ? 'bg-black text-white shadow-xl shadow-black/10 scale-[1.02] font-bold'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 font-semibold'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                        {/* View Toggle */}
                        <div className="flex items-center bg-slate-100/50 p-1 rounded-2xl border border-slate-200/60">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-black text-white shadow-xl shadow-black/10 scale-[1.02] font-bold' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 font-semibold'}`}
                                title="Grid View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-black text-white shadow-xl shadow-black/10 scale-[1.02] font-bold' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 font-semibold'}`}
                                title="List View"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                    {filteredData.length > 0 ? [...filteredData].reverse().map((item, index) => {
                        // DEBUG: Log item keys to find Department/Location
                        if (index === 0) console.log('JD Item Keys:', Object.keys(item));
                        if (index === 0) console.log('JD Item Data:', item);
                        // DEBUG: Log doc-related columns for ALL items to find missing doc
                        const docRelatedKeys = Object.keys(item).filter(k => /jd|doc|desc|text|accept|reject/i.test(k));
                        console.log(`[JD Card ${index}] Role: ${item['Role Name'] || item.Role || 'N/A'}, Doc keys:`, docRelatedKeys.map(k => `${k}="${item[k]}"`));

                        const jdLink = (item['JD DOC'] || item['JD Doc'] || item['JD text'] || item['JD description link'] || item['JOB DESCRIPTION'] || item['JD Accepted'] || item['Accepted'] || item['JD Rejected'] || item['Rejected'] || item.Text || '#').toString().trim();

                        const jdRole = item['Role Name'] || item.Role || item.ROLE || item['ROLE NAME'] || 'Untitled Role';
                        // Robust image key finding
                        const imageKey = Object.keys(item).find(k =>
                            k.trim().toLowerCase().includes('image') ||
                            k.trim().toLowerCase().includes('poster') ||
                            k.trim().toLowerCase().includes('preview')
                        ) || 'JOB DESCRIPTION IMAGE';

                        const jdImage = item[imageKey] || item['JD Image'] || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=2072&auto=format&fit=crop';
                        const logId = item['Log ID'];

                        // Find matching requirement for Dept/Location
                        const matchingReq = requirements.find(r => String(r['Log ID'] || r['log_id']) === String(logId));
                        const department = matchingReq?.Department || matchingReq?.department || item.Department || item.department;
                        const location = matchingReq?.Location || matchingReq?.location || item.Location || item.location;

                        const rawStatusValue = (matchingReq?.['Current Status of Requirement'] || item.Status || item.status || 'open').toString().trim().toLowerCase();
                        const itemStatus = rawStatusValue.includes('close') ? 'closed' : 'open';

                        const { preview, download } = getDocUrls(jdLink);

                        const experience = matchingReq?.Experience || matchingReq?.experience || '';
                        const candidateCount = candidates.filter(c => c['Log ID'] === logId).length;

                        return (
                            <div key={index} onClick={() => setSelectedJDItem({ ...item, Department: department || 'Not Specified' })} className="glass-card p-5 md:p-6 rounded-2xl hover:shadow-xl hover:shadow-indigo-500/8 transition-all duration-500 group flex flex-col border border-[var(--border-color)] bg-[var(--card-bg)] relative overflow-hidden cursor-pointer">
                                {/* Decorative Gradient */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>

                                <div className="flex items-start justify-between mb-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 transition-colors group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20">
                                            <FileText className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        {/* Status Toggle */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setStatusToConfirm({ logId, currentStatus: itemStatus, role: jdRole });
                                            }}
                                            disabled={isUpdatingStatus}
                                            className={`relative h-8 w-[110px] rounded-full transition-all duration-300 p-1 border shadow-inner ${itemStatus === 'open'
                                                ? 'bg-emerald-50 border-emerald-100'
                                                : 'bg-rose-50 border-rose-100'
                                                } ${isUpdatingStatus ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                                        >
                                            <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                                                <span className={`text-[8px] font-bold tracking-widest ${itemStatus === 'open' ? 'opacity-0' : 'text-slate-400 uppercase'}`}>OPEN</span>
                                                <span className={`text-[8px] font-bold tracking-widest ${itemStatus === 'closed' ? 'opacity-0' : 'text-slate-400 uppercase'}`}>CLOSED</span>
                                            </div>
                                            <div className={`absolute top-1 left-1 bottom-1 w-[52px] rounded-full transition-all duration-300 flex items-center justify-center shadow-md transform z-10 ${itemStatus === 'open'
                                                ? 'translate-x-0 bg-emerald-500'
                                                : 'translate-x-[52px] bg-rose-500'
                                                }`}>
                                                <span className="text-[9px] font-bold text-white uppercase tracking-tight">{itemStatus === 'open' ? 'OPEN' : 'CLOSED'}</span>
                                            </div>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmation({ logId, role: jdRole }) }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleLinkedinShare(item) }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Share on LinkedIn">
                                            <Linkedin className="w-4 h-4" />
                                        </button>
                                        {jdLink !== '#' && (
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); shareDoc(jdRole, download) }} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all" title="Share">
                                                    <Share2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors tracking-tight relative z-10">
                                    {jdRole}
                                </h3>

                                {/* Info Tags */}
                                <div className="flex flex-wrap items-center gap-2 mb-3 relative z-10">
                                    {location && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold border border-indigo-100">
                                            <MapPin className="w-3 h-3" />{location}
                                        </span>
                                    )}
                                    {experience && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-[10px] font-bold border border-purple-100">
                                            <Clock className="w-3 h-3" />{experience}
                                        </span>
                                    )}
                                </div>

                                <p className="text-[var(--text-secondary)] text-xs mb-5 flex-1 opacity-50 font-medium relative z-10">
                                    ID: <span className="font-mono">{logId || (index + 1001)}</span>
                                </p>

                                {/* Action Buttons */}
                                <div className="space-y-2.5 mt-auto relative z-10">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedLogId(logId);
                                            setSelectedJDTitle(jdRole);
                                            setShowCandidateModal(true);
                                        }}
                                        className="w-full bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 border border-indigo-100 hover:border-indigo-600 transition-all duration-300 rounded-xl flex items-center justify-center text-xs py-3 font-bold uppercase tracking-widest shadow-sm hover:shadow-indigo-600/20 active:scale-[0.98]"
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        Candidates ({candidateCount})
                                    </button>

                                    <div className="flex gap-2">
                                        {jdLink !== '#' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); const jdUrl = getJdDocUrl(item) || preview; setSelectedDoc({ url: jdUrl, originalUrl: jdUrl, title: jdRole }) }}
                                                className="flex-1 bg-[var(--bg-secondary)] hover:bg-indigo-50 text-[var(--text-primary)] hover:text-indigo-600 border border-[var(--border-color)] hover:border-indigo-200 transition-all duration-300 rounded-xl flex items-center justify-center text-[11px] py-2.5 font-bold"
                                            >
                                                <FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                                                Doc
                                            </button>
                                        )}
                                        {jdImage ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedImage(jdImage) }}
                                                className="flex-1 bg-[var(--bg-secondary)] hover:bg-amber-50 text-[var(--text-primary)] hover:text-amber-600 border border-[var(--border-color)] hover:border-amber-200 transition-all duration-300 rounded-xl flex items-center justify-center text-[11px] py-2.5 font-bold"
                                            >
                                                <ImageIcon className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                                                Poster
                                            </button>
                                        ) : (
                                            <div className="flex-1 bg-slate-50 text-slate-400 border border-slate-200 rounded-xl flex items-center justify-center text-[11px] py-2.5 font-bold cursor-not-allowed italic">
                                                No Poster
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-[var(--text-secondary)]">
                            <FileText className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-lg font-medium">No job descriptions found matching "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            ) : (
                /* List View Implementation */
                <div className="glass-card rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm bg-white/50 backdrop-blur-md">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/30">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Position / Role</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] w-32">ID</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] w-32 text-center">Candidates</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] w-24 text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] w-48 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]/50">
                                {filteredData.length > 0 ? [...filteredData].reverse().map((item, index) => {
                                    const jdLink = item['JD DOC'] || item['JOB DESCRIPTION'] || item['JD Doc'] || item['JD Accepted'] || item['Accepted'] || item['JD Rejected'] || item['Rejected'] || '#';
                                    const jdRole = item['Role Name'] || item.Role || item.ROLE || item['ROLE NAME'] || 'Untitled Role';
                                    const logId = item['Log ID'];
                                    const matchingReq = requirements.find(r => String(r['Log ID'] || r['log_id']) === String(logId));
                                    const rawStatusValue = (matchingReq?.['Current Status of Requirement'] || item.Status || item.status || 'open').toString().trim().toLowerCase();
                                    const itemStatus = rawStatusValue.includes('close') ? 'closed' : 'open';
                                    const matchingCandidates = candidates.filter(c => c['Log ID'] === logId);

                                    // Image detect
                                    const imageKey = Object.keys(item).find(k =>
                                        k.trim().toLowerCase().includes('image') ||
                                        k.trim().toLowerCase().includes('poster') ||
                                        k.trim().toLowerCase().includes('preview')
                                    ) || 'JOB DESCRIPTION IMAGE';
                                    const jdImage = item[imageKey] || item['JD Image'];
                                    const { preview, download } = getDocUrls(jdLink);

                                    const department = matchingReq?.Department || matchingReq?.department || item.Department || item.department;

                                    return (
                                        <tr key={index} onClick={() => setSelectedJDItem({ ...item, Department: department || 'Not Specified' })} className="group hover:bg-slate-500/5 transition-all duration-300 relative border-b border-[var(--border-color)]/30 cursor-pointer">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-sm text-[var(--text-primary)] group-hover:text-indigo-600 transition-colors truncate max-w-[300px] tracking-tight" title={jdRole}>
                                                    {jdRole}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-[10px] text-[var(--text-secondary)] whitespace-nowrap">
                                                {logId || (index + 1001)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedLogId(logId);
                                                        setSelectedJDTitle(jdRole);
                                                        setShowCandidateModal(true);
                                                    }}
                                                    className="inline-flex items-center px-4 py-1.5 bg-indigo-500/5 text-indigo-600 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-500/10 transition-all border border-indigo-500/20"
                                                >
                                                    <Users className="w-3.5 h-3.5 mr-2" />
                                                    {matchingCandidates.length}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 justify-center">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setStatusToConfirm({ logId, currentStatus: itemStatus, role: jdRole }) }}
                                                        className={`relative h-8 w-[110px] rounded-full transition-all duration-300 p-1 border shadow-inner ${itemStatus === 'open'
                                                            ? 'bg-emerald-50 border-emerald-100'
                                                            : 'bg-rose-50 border-rose-100'
                                                            }`}
                                                    >
                                                        <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                                                            <span className={`text-[8px] font-bold tracking-widest ${itemStatus === 'open' ? 'opacity-0' : 'text-rose-500 opacity-30 uppercase'}`}>OPEN</span>
                                                            <span className={`text-[8px] font-bold tracking-widest ${itemStatus === 'closed' ? 'opacity-0' : 'text-emerald-500 opacity-30 uppercase'}`}>CLOSED</span>
                                                        </div>
                                                        <div className={`absolute top-1 left-1 bottom-1 w-[52px] rounded-full transition-all duration-300 flex items-center justify-center shadow-md transform z-10 ${itemStatus === 'open'
                                                            ? 'translate-x-0 bg-emerald-500'
                                                            : 'translate-x-[52px] bg-rose-500'
                                                            }`}>
                                                            <span className="text-[9px] font-bold text-white uppercase tracking-tight">{itemStatus === 'open' ? 'OPEN' : 'CLOSED'}</span>
                                                        </div>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end space-x-1.5">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmation({ logId, role: jdRole }) }}
                                                        className="p-2.5 text-rose-500/70 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm border border-transparent hover:border-rose-500/20"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    {jdLink !== '#' && (
                                                        <>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); const jdUrl = getJdDocUrl(item) || preview; setSelectedDoc({ url: jdUrl, originalUrl: jdUrl, title: jdRole }) }}
                                                                className="p-2.5 text-indigo-500/70 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm border border-transparent hover:border-indigo-500/20"
                                                                title="View Doc"
                                                            >
                                                                <FileText className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleLinkedinShare(item) }}
                                                                className="p-2.5 text-blue-600/70 hover:text-blue-700 hover:bg-blue-500/10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm border border-transparent hover:border-blue-500/20"
                                                                title="Share on LinkedIn"
                                                            >
                                                                <Linkedin className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {jdImage && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedImage(jdImage) }}
                                                            className="p-2.5 text-amber-500/70 hover:text-amber-600 hover:bg-amber-500/10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm border border-transparent hover:border-amber-500/20"
                                                            title="View Poster"
                                                        >
                                                            <ImageIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-[var(--text-secondary)]">
                                            <div className="flex flex-col items-center">
                                                <Search className="w-12 h-12 mb-4 opacity-10" />
                                                <p className="font-bold text-lg">No Results Found</p>
                                                <p className="text-sm opacity-60">Adjust your search or filter to see more.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
            }


            {/* Image Preview Modal */}
            {
                selectedImage && createPortal(
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setSelectedImage(null)}>
                        {/* Modal Container: Auto width to fit image, constrained by viewport */}
                        <div className="relative w-auto max-w-[95vw] max-h-[95vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>

                            {/* Image Container: Flex to center, no fixed height to allow hugging */}
                            <div className="flex-1 overflow-auto scrollbar-thin flex justify-center bg-gray-50 p-2">
                                <img
                                    src={selectedImage}
                                    alt="JD Preview"
                                    className="max-h-[80vh] w-auto object-contain shadow-sm rounded"
                                />
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 border-t border-gray-100 flex justify-end items-center space-x-3 bg-white shrink-0">
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="px-6 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-all duration-200"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            toast.success("Downloading...", "Starting download.");

                                            // Attempt to fetch the image blob
                                            const response = await fetch(selectedImage, {
                                                method: 'GET',
                                                mode: 'cors', // Try to request with CORS
                                                cache: 'no-cache', // Bypass cache
                                            });

                                            if (!response.ok) {
                                                throw new Error(`HTTP error! status: ${response.status}`);
                                            }

                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            // Extract filename from URL or default
                                            const filename = selectedImage.split('/').pop().split('?')[0] || `job-poster-${Date.now()}.jpg`;
                                            link.download = filename;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            window.URL.revokeObjectURL(url);
                                            toast.success("Downloaded", "Image saved to your device.");

                                        } catch (error) {
                                            console.error('Download failed:', error);

                                            // Fallback: If direct fetch fails (likely CORS), try opening in new tab but inform user
                                            toast.error("Download Restricted", "Image server blocked download. Opening original image.");
                                            window.open(selectedImage, '_blank');
                                        }
                                    }}
                                    className="flex items-center space-x-2 px-6 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 shadow-lg shadow-gray-200"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Download Poster</span>
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Document Preview Modal */}
            {
                selectedJDItem && createPortal(
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setSelectedJDItem(null)}>
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in border border-gray-200" style={{ maxWidth: 'calc(80rem - 120px)' }} onClick={e => e.stopPropagation()}>
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{selectedJDItem['Role Name'] || selectedJDItem.Role || selectedJDItem.ROLE || 'Requirement Details'}</h2>
                                </div>
                                <button onClick={() => setSelectedJDItem(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
                                {(() => {
                                    // Only show Final JD relevant fields — hide duplicates, system, and approval-only fields
                                    const hiddenFields = [
                                        'log id', 'log_id', 'jd accepted', 'jd rejected', 'accepted', 'rejected',
                                        'timestamp', 'email address', 'email_address',
                                        // Approval-specific fields that duplicate Final JD data
                                        'jd doc', 'jd_doc', 'accept', 'reject', 'accept url', 'reject url',
                                        'acceptance url', 'rejection url', 'approved', 'approval status',
                                    ];
                                    // Track seen normalized values to eliminate duplicates
                                    const seenValues = new Set();
                                    // These fields are allowed to have duplicate text without being hidden
                                    const exemptDedupeKeys = new Set(['department', 'eduction', 'education', 'jd info', 'jd_info', 'job description']);

                                    const entries = Object.entries(selectedJDItem).filter(([k, v]) => {
                                        if (!v || typeof v === 'object' || k === 'candidates') return false;
                                        const lowerK = k.toLowerCase().trim();
                                        // Hide system/approval fields
                                        if (hiddenFields.some(field => lowerK === field)) return false;
                                        if (lowerK.includes('accepted') || lowerK.includes('rejected')) return false;

                                        // Deduplicate by normalized value (hides repeated fields like Role / Role Name)
                                        const strValue = String(v).trim();
                                        const normalizedVal = strValue.toLowerCase();
                                        if (normalizedVal.length > 0 && normalizedVal.length < 200 && !exemptDedupeKeys.has(lowerK)) {
                                            if (seenValues.has(normalizedVal)) return false;
                                            seenValues.add(normalizedVal);
                                        }

                                        return true;
                                    });

                                    // Only show JD Image from Final JD sheet (not JOB IMAGE from Requirement Intake)
                                    const imageEntries = [];
                                    const dataEntries = [];
                                    
                                    // Fields to exclude (from Requirement Intake)
                                    const excludedFields = ['job image', 'job_image', 'jd poster url'];

                                    // First, check for JD Image from Final JD sheet specifically
                                    const jdImageKey = Object.keys(selectedJDItem).find(k => {
                                        const lowerK = k.toLowerCase().trim();
                                        return lowerK === 'jd image' || lowerK === 'jd_image';
                                    });
                                    
                                    if (jdImageKey && selectedJDItem[jdImageKey]) {
                                        const imgUrl = String(selectedJDItem[jdImageKey]);
                                        if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
                                            imageEntries.push({ key: 'JD Image', strValue: imgUrl });
                                        }
                                    }

                                    entries.forEach(([key, value]) => {
                                        const strValue = String(value);
                                        const lowerKey = key.toLowerCase().trim();
                                        
                                        // Skip excluded fields completely
                                        if (excludedFields.includes(lowerKey)) return;
                                        
                                        const isUrl = strValue.startsWith('http://') || strValue.startsWith('https://');
                                        // Only include as image if it's from Final JD sheet (JD Image field)
                                        const isImage = isUrl && lowerKey === 'jd image';

                                        if (isImage && !imageEntries.some(e => e.strValue === strValue)) {
                                            imageEntries.push({ key, strValue });
                                        } else if (!isImage) {
                                            const isDocUrl = isUrl && (strValue.includes('docs.google.com') || strValue.includes('drive.google.com') || strValue.includes('studio.pucho.ai') || strValue.includes('.pdf') || lowerKey.includes('doc') || lowerKey.includes('job description'));
                                            dataEntries.push({ key, strValue, isUrl, isDocUrl });
                                        }
                                    });

                                    return (
                                        <div className={`grid grid-cols-1 ${imageEntries.length > 0 ? 'lg:grid-cols-2' : ''} gap-8 h-full`}>
                                            <div className="h-full">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                    {dataEntries.map(({ key, strValue, isUrl, isDocUrl }) => (
                                                        <div key={key} className={`space-y-1 ${strValue.length > 250 && !isUrl && !isDocUrl ? 'md:col-span-2' : ''}`}>
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{key}</label>
                                                            {isDocUrl ? (
                                                                <div className="mt-1">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); const jdUrl = getJdDocUrl(selectedJDItem) || strValue; setSelectedDoc({ url: jdUrl, originalUrl: jdUrl, title: selectedJDItem['Role Name'] || selectedJDItem.Role || 'Document' }) }}
                                                                        className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm rounded-lg transition-colors border border-indigo-200"
                                                                    >
                                                                        <FileText className="w-4 h-4" />
                                                                        <span>View Document</span>
                                                                    </button>
                                                                </div>
                                                            ) : isUrl ? (
                                                                <div>
                                                                    <a href={strValue} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 break-all flex items-center gap-1 mt-1">
                                                                        <ExternalLink className="w-4 h-4 shrink-0" />
                                                                        Open Link
                                                                    </a>
                                                                </div>
                                                            ) : (
                                                                <div className="text-sm font-semibold text-gray-900 break-words whitespace-pre-wrap">{strValue}</div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Image Column */}
                                            {imageEntries.length > 0 && (
                                                <div className="flex flex-col gap-4">
                                                    {imageEntries.map(({ key, strValue }, idx) => (
                                                        <div key={idx} className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                                                            <div className="p-3 bg-gray-100 border-b border-gray-200">
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{key}</label>
                                                            </div>
                                                            <img
                                                                src={strValue}
                                                                alt={key}
                                                                className="w-full h-auto object-contain max-h-[400px]"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Document Preview Modal */}
            {
                selectedDoc && createPortal(
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedDoc(null)}>
                        <div className="relative w-full max-w-5xl h-[90vh] flex flex-col animate-scale-in shadow-2xl overflow-hidden rounded-2xl border border-white/10" onClick={e => e.stopPropagation()}>
                            <div className="bg-white border-b border-gray-100 p-4 flex justify-between items-center">
                                <div className="flex items-center space-x-3 overflow-hidden px-2">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 truncate">{selectedDoc.title}</h3>
                                </div>
                                <div className="flex items-center space-x-2 shrink-0 px-2">
                                    <a href={selectedDoc.originalUrl} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm rounded-lg transition-colors border border-indigo-200" title="Download Document">
                                        <Download className="w-4 h-4" />
                                        <span>Download</span>
                                    </a>
                                    <div className="w-4" />
                                    <button
                                        onClick={() => setSelectedDoc(null)}
                                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all"
                                        title="Close Preview"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                            <div className="bg-gray-50 flex-1 relative flex flex-col items-center justify-center">
                                <DocIframeViewer docUrl={selectedDoc.url} originalUrl={selectedDoc.originalUrl} jdText={selectedDoc.jdText} />
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Candidate List Modal */}
            {
                showCandidateModal && createPortal(
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => {
                        setShowCandidateModal(false);
                        setSelectedLogId(null);
                        setActiveMessage(null);
                    }}>
                        <div className="bg-[#FAFAFB] rounded-[2.5rem] w-full max-w-6xl overflow-hidden shadow-2xl animate-scale-in border border-gray-200" onClick={e => e.stopPropagation()}>
                            <div className="p-10 pb-6 border-b border-gray-100 flex justify-between items-center bg-white">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-indigo-50 rounded-[1.25rem] text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-100/50">
                                        <Users className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                                            {selectedJDTitle}
                                        </h3>
                                    </div>
                                </div>
                                <button onClick={() => {
                                    setShowCandidateModal(false);
                                    setSelectedLogId(null);
                                    setActiveMessage(null);
                                }} className="p-3 text-gray-400 hover:text-rose-500 transition-all hover:bg-rose-50 rounded-2xl border border-gray-100 group">
                                    <X className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>

                            <div className="p-10 pb-40 max-h-[60vh] overflow-y-auto custom-scrollbar hide-scrollbar bg-[#FAFAFB]">
                                {selectedJDCandidates.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-12 px-10 py-2 text-[10px] font-bold text-[#5D7285] uppercase tracking-[0.25em] mb-4 hidden md:grid">
                                            <div className="col-span-4">Candidate Name</div>
                                            <div className="col-span-2 text-center">Match Score</div>
                                            <div className="col-span-3 text-center">STATUS</div>
                                            <div className="col-span-3 text-right">Actions</div>
                                        </div>
                                        {[...selectedJDCandidates].reverse().map((candidate, idx) => {
                                            const scoreStr = candidate.Score || candidate.score || '0';
                                            const scoreNum = parseInt(String(scoreStr).replace('%', '')) || 0;
                                            const displayScore = scoreNum;
                                            const maxScore = scoreNum <= 10 ? 10 : 100;

                                            const rawStatus = candidate.Status || candidate.status || 'PENDING';
                                            const normalizedStatus = rawStatus.toUpperCase();
                                            const isShortlisted = normalizedStatus.includes('SHORTLIST');

                                            return (
                                                <div key={idx} className={`grid grid-cols-1 md:grid-cols-12 items-center px-6 py-4 bg-white border border-[#F1F3F5] rounded-[2rem] shadow-sm hover:shadow-md transition-all group animate-fade-in my-3 mx-2 ${openCandidateStatusDropdownId === (candidate.Email || idx) ? 'relative z-50' : 'relative z-10'}`}>
                                                    {/* Candidate Info */}
                                                    <div className="col-span-1 md:col-span-4 flex items-center gap-5">
                                                        <div className="w-14 h-14 rounded-full bg-[#8E54E9] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200 shrink-0">
                                                            {(candidate['Name of the Candidate'] || candidate.Name || 'U')[0]}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-lg font-bold text-[#111834] truncate">{candidate['Name of the Candidate'] || candidate.Name || 'Unknown Name'}</div>
                                                            <div className="text-xs font-medium text-[#5D7285] truncate opacity-70 mb-0.5">{candidate.Email || 'No Email Address'}</div>
                                                            {(candidate['Contact Number'] || candidate['Contact Number ']) && (
                                                                <div className="flex items-center text-[10px] font-bold text-indigo-500/80 bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-100 w-fit">
                                                                    <Phone className="w-2.5 h-2.5 mr-1 shrink-0" />
                                                                    {candidate['Contact Number'] || candidate['Contact Number ']}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Score */}
                                                    <div className="col-span-1 md:col-span-2 flex justify-center py-4 md:py-0">
                                                        <div className="inline-flex items-center px-4 py-1.5 bg-[#FFF9E6] rounded-full border border-[#FFE7A3]">
                                                            <Star className="w-3.5 h-3.5 text-[#F5B800] fill-[#F5B800] mr-2" />
                                                            <span className="text-xs font-bold text-[#B38600]">{displayScore}/{maxScore}</span>
                                                        </div>
                                                    </div>

                                                    {/* Status Dropdown */}
                                                    <div className="col-span-1 md:col-span-3 flex flex-col justify-center items-center md:py-0 relative">
                                                        <button
                                                            onClick={(e) => {
                                                                if (!isShortlisted) {
                                                                    e.stopPropagation();
                                                                    setOpenCandidateStatusDropdownId(prev => prev === (candidate.Email || idx) ? null : (candidate.Email || idx));
                                                                }
                                                            }}
                                                            className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-3 transition-all ${isShortlisted ? 'bg-[#E7FAF0] text-[#00C853] border border-[#BFF7D9] cursor-default' :
                                                                normalizedStatus.includes('REJECTED') ? 'bg-[#FFF0F0] text-[#FF4D4D] border border-[#FFD9D9]' :
                                                                    'bg-[#F8F9FA] text-[#5D7285] border border-[#F1F3F5] hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            <div className={`w-2 h-2 rounded-full ${isShortlisted ? 'bg-[#00C853]' :
                                                                normalizedStatus.includes('REJECTED') ? 'bg-[#FF4D4D]' : 'bg-[#A8B2BD]'
                                                                }`}></div>
                                                            <span className="truncate max-w-[120px]">{rawStatus}</span>
                                                            {!isShortlisted && <ChevronDown className="w-3 h-3 opacity-50 flex-shrink-0" />}
                                                        </button>
                                                        {(candidate['Interview type'] || candidate['Interview Type']) && (
                                                            <div className="mt-1.5 w-full flex justify-center">
                                                                <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 w-fit">
                                                                    <Video className="w-2.5 h-2.5 mr-1 shrink-0" />
                                                                    {candidate['Interview type'] || candidate['Interview Type']}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {!isShortlisted && openCandidateStatusDropdownId === (candidate.Email || idx) && (
                                                            <div className="absolute top-full mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2 overflow-hidden animate-fade-in left-1/2 -translate-x-1/2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setCandidateStatusConfirm({ candidate, targetStatus: 'Shortlisted for Round 1' }); setOpenCandidateStatusDropdownId(null); }}
                                                                    className="w-full text-left px-5 py-3 hover:bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-3 transition-colors border-b border-gray-50"
                                                                >
                                                                    <CheckCircle className="w-4 h-4" /> Shortlist Round 1
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setCandidateStatusConfirm({ candidate, targetStatus: 'Rejected' }); setOpenCandidateStatusDropdownId(null); }}
                                                                    className="w-full text-left px-5 py-3 hover:bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-3 transition-colors"
                                                                >
                                                                    <XCircle className="w-4 h-4" /> Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions / Integrations */}
                                                    <div className="col-span-1 md:col-span-3 flex justify-end items-center gap-3 mt-4 md:mt-0">
                                                        <div className="flex items-center gap-2 pr-2">
                                                            {candidate.CV && (
                                                                <button
                                                                    onClick={() => {
                                                                        const url = candidate.CV;
                                                                        const previewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
                                                                        setSelectedDoc({ url: previewUrl, originalUrl: url, title: `${candidate['Name of the Candidate']} - Resume` });
                                                                    }}
                                                                    className="p-2.5 bg-white border border-[#F1F3F5] rounded-xl text-slate-300 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                                                                    title="Preview CV"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setActiveMessage({ candidate, type: 'whatsapp', content: '' })}
                                                                className="p-2.5 bg-[#E7FAF0] text-[#00C853] border border-[#BFF7D9] rounded-xl hover:bg-[#D5F7E4] transition-all"
                                                                title="Send WhatsApp"
                                                            >
                                                                <MessageCircle className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setActiveMessage({ candidate, type: 'email', content: '' })}
                                                                className="p-2.5 bg-[#FFF0F0] text-[#FF4D4D] border border-[#FFD9D9] rounded-xl hover:bg-[#FFE6E6] transition-all"
                                                                title="Send Email"
                                                            >
                                                                <Mail className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-white rounded-[2.5rem] mt-8 border border-dashed border-gray-200">
                                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Users className="w-10 h-10 opacity-20" />
                                        </div>
                                        <p className="text-2xl font-black text-gray-900 tracking-tight">No matches found yet.</p>
                                        <p className="text-sm font-bold text-gray-400 mt-2">Check back after our AI completes the scan.</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-10 bg-white border-t border-gray-100 flex justify-end items-center gap-6">
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Candidate Communication Modal */}
            {
                activeMessage && createPortal(
                    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => !isSendingMessage && setActiveMessage(null)}>
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl animate-scale-in flex flex-col max-h-[90vh] border border-gray-100 relative" onClick={e => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="p-10 pb-2 flex justify-between items-start rounded-t-[2.5rem] bg-white z-10">
                                <div className="flex items-center space-x-6">
                                    <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center shadow-lg transition-transform duration-500 hover:rotate-6 ${activeMessage.type === 'email'
                                        ? 'bg-orange-50 text-orange-500 shadow-orange-500/10'
                                        : 'bg-emerald-50 text-emerald-500 shadow-emerald-500/10'
                                        }`}>
                                        {activeMessage.type === 'email' ? <Mail className="w-8 h-8" /> : <MessageCircle className="w-8 h-8" />}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
                                            {activeMessage.type === 'email' ? 'Send Email' : 'Send WhatsApp'}
                                        </h3>
                                        <p className="text-[10px] uppercase font-black tracking-[0.25em] text-gray-400 flex items-center">
                                            TO: <span className="text-gray-900 ml-2">{activeMessage.candidate['Name of the Candidate'] || activeMessage.candidate.Name}</span>
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setActiveMessage(null)} className="p-3 hover:bg-rose-50 rounded-2xl transition-all text-gray-300 hover:text-rose-500 border border-transparent hover:border-rose-100">
                                    <X className="w-7 h-7" />
                                </button>
                            </div>
                            <div className="p-10 overflow-y-auto custom-scrollbar flex-1 bg-white rounded-b-[2.5rem]">
                                {messageSentStatus === 'none' || !messageSentStatus ? (
                                    <div className="space-y-10 relative">
                                        <div className="grid grid-cols-2 gap-6 items-start animate-fade-in relative z-30">
                                            <div className="space-y-2 text-left">
                                                <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 ml-2 block uppercase">SCHEDULE (OPTIONAL)</label>
                                                <div className="relative group custom-datepicker-container w-full">
                                                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 pointer-events-none z-10" />
                                                    <DatePicker
                                                        ref={datePickerRef1}
                                                        selected={interviewDatetime ? new Date(interviewDatetime) : null}
                                                        onChange={(date) => setInterviewDatetime(date ? date.toISOString() : '')}
                                                        showTimeSelect
                                                        dateFormat="Pp"
                                                        minDate={new Date()}
                                                        filterTime={(time) => {
                                                            const now = new Date();
                                                            const selected = interviewDatetime ? new Date(interviewDatetime) : null;
                                                            if (!selected) return true;
                                                            const isToday = selected.toDateString() === now.toDateString();
                                                            if (!isToday) return true;
                                                            return time.getTime() >= now.getTime();
                                                        }}
                                                        calendarClassName="glass-datepicker"
                                                        portalId="datepicker-portal"
                                                        popperProps={{ strategy: 'fixed' }}
                                                        placeholderText="Select Date & Time"
                                                        onChangeRaw={(e) => e.preventDefault()}
                                                        className="premium-datepicker-input w-full"
                                                    >
                                                        <div className="p-3 bg-white rounded-b-2xl border-t border-slate-100 mt-2 flex justify-center">
                                                            <button
                                                                onClick={(e) => { e.preventDefault(); datePickerRef1.current?.setOpen(false); }}
                                                                className="w-full bg-black text-white font-bold py-3.5 px-12 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-black/20 transition-all active:scale-95 hover:bg-slate-800"
                                                            >
                                                                Done
                                                            </button>
                                                        </div>
                                                    </DatePicker>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-left">
                                                <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 ml-2 block uppercase">INTERVIEW METHOD</label>
                                                <CustomDropdown
                                                    name="interview_method"
                                                    value={interviewMethod}
                                                    onChange={(e) => setInterviewMethod(e.target.value)}
                                                    options={[
                                                        { value: 'Google Meet', label: 'Google Meet', icon: Video },
                                                        { value: 'AI Call Agent', label: 'AI Call Agent', icon: Sparkles }
                                                    ]}
                                                    icon={interviewMethod === 'Google Meet' ? Video : Sparkles}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2 relative z-20">
                                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 ml-2 block">MESSAGE CONTEXT (OPTIONAL)</label>
                                            <div className="relative group">
                                                <textarea value={activeMessage.content} onChange={(e) => setActiveMessage(prev => ({ ...prev, content: e.target.value }))} placeholder="Add any specifics our AI should mention..." className="w-full h-32 p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-normal focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-300 resize-none shadow-inner outline-none"></textarea>
                                                <div className="absolute bottom-6 right-6 p-2 bg-white rounded-xl shadow-md border border-gray-100 flex items-center gap-2">
                                                    <Sparkles className="w-3 h-3 text-indigo-400" />
                                                    <span className="text-[8px] font-black tracking-[0.1em] text-gray-300 uppercase">AI POWERED DRAFTING</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={handleSendMessage} disabled={isSendingMessage} className="w-full py-5 bg-[#6366F1] hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl shadow-indigo-600/30 flex items-center justify-center disabled:opacity-50 hover:scale-[1.02] active:scale-95">
                                            {isSendingMessage ? <><Loader2 className="w-5 h-5 mr-3 animate-spin shadow-indigo-500/20" />GENERATING WITH AI...</> : <><Sparkles className="w-5 h-5 mr-3" />GENERATE MESSAGE PROPOSALS</>}
                                        </button>
                                    </div>
                                ) : messageSentStatus === 'comparison' && comparisonData ? (
                                    <div className="space-y-8 animate-fade-in relative z-10">
                                        <div className="flex items-center gap-4 bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100/50">
                                            <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-500/10"><Loader2 className="w-5 h-5 animate-spin" /></div>
                                            <div><h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Select Preferred Version</h4><p className="text-[11px] font-bold text-indigo-400">OUR AI HAS CRAFTED A POLISHED VERSION FOR YOUR APPROVAL</p></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className={`group flex flex-col h-full bg-white rounded-[2.5rem] border transition-all duration-300 overflow-hidden cursor-pointer ${selectedChoice === 'user' ? 'border-gray-900 shadow-2xl' : 'border-gray-100 hover:border-gray-300'}`} onClick={() => setSelectedChoice('user')}>
                                                <div className={`p-6 border-b flex items-center justify-between ${selectedChoice === 'user' ? 'bg-black text-white' : 'bg-gray-50/50 text-gray-400'}`}><span className="text-[10px] uppercase font-black tracking-widest">Original Intent</span><Users className="w-4 h-4" /></div>
                                                <div className="p-8 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar bg-white"><p className="text-sm text-gray-600 leading-relaxed italic font-semibold">"{comparisonData.user || 'Standard system template'}"</p></div>
                                            </div>
                                            <div className={`group flex flex-col h-full bg-indigo-50/30 rounded-[2.5rem] border transition-all duration-300 overflow-hidden cursor-pointer ${selectedChoice === 'generated' ? 'border-indigo-600 shadow-2xl ring-4 ring-indigo-500/5' : 'border-indigo-100 hover:border-indigo-400'}`} onClick={() => setSelectedChoice('generated')}>
                                                <div className={`p-6 border-b flex items-center justify-between ${selectedChoice === 'generated' ? 'bg-indigo-600 text-white' : 'bg-indigo-500/10 text-indigo-600'}`}><span className="text-[10px] uppercase font-black tracking-widest">AI Polished Version</span><CheckCircle className="w-4 h-4" /></div>
                                                <div className="p-8 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar bg-white/50"><div className="text-sm text-gray-900 leading-relaxed font-bold whitespace-pre-wrap">{comparisonData.generated}</div></div>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 pt-6 border-t border-gray-50 mt-4">
                                            <button onClick={() => handleActionChoice(comparisonData.rejectUrl)} disabled={isActioningSelection} className="px-10 py-5 bg-white text-gray-400 border border-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all font-bold">Discard Draft</button>
                                            <button onClick={() => handleActionChoice(selectedChoice === 'generated' ? comparisonData.acceptUrl : comparisonData.rejectUrl)} disabled={isActioningSelection} className="flex-1 py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-black/20 flex items-center justify-center gap-3 hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-95">{isActioningSelection ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5 text-indigo-400" />Approve & Dispatch</>}</button>
                                        </div>
                                    </div>
                                ) : messageSentStatus === 'success' ? (
                                    <div className="py-24 text-center animate-scale-up flex flex-col items-center">
                                        <div className="success-icon-container mb-12">
                                            <div className="success-glow"></div>
                                            <div className="success-ring"></div>
                                            <div className="w-32 h-32 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 relative z-10 animate-float translate-y-0">
                                                <CheckCircle className="w-16 h-16" strokeWidth={3} />
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-16">
                                            <h3 className="text-4xl font-black text-slate-900 tracking-tight">Message Dispatched!</h3>
                                            <p className="text-slate-400 max-w-[360px] mx-auto text-sm leading-relaxed font-bold tracking-wide">
                                                THE CANDIDATE WILL RECEIVE OUTREACH VIA <span className="text-emerald-500 font-black">{activeMessage.type.toUpperCase()}</span> SHORTLY.
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => setActiveMessage(null)}
                                            className="premium-success-button shadow-2xl"
                                        >
                                            Dismiss Modal
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-20">
                                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><XCircle className="w-10 h-10" /></div>
                                        <p className="text-rose-500 font-black text-sm uppercase tracking-widest leading-relaxed">Error syncing with AI engine.<br />Please verify connectivity and try again.</p>
                                        <button onClick={() => setMessageSentStatus('none')} className="mt-8 px-12 py-4 bg-black text-white rounded-[1.25rem] text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-gray-800 transition-all active:scale-95">Retry Sync</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Status Change Confirmation Modal */}
            {
                statusToConfirm && createPortal(
                    <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setStatusToConfirm(null)}>
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in border border-slate-100" onClick={e => e.stopPropagation()}>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto ${statusToConfirm.currentStatus === 'open' ? 'bg-rose-50 text-rose-500' : 'bg-[#E7FAF0] text-[#00C853]'}`}>
                                {statusToConfirm.currentStatus === 'open' ? <XCircle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 text-center mb-2 tracking-tight">Are you sure?</h3>
                            <p className="text-sm font-medium text-slate-500 text-center mb-8">
                                You are about to move <span className="text-slate-900 font-bold uppercase">{statusToConfirm.role}</span> to <span className={`font-black uppercase tracking-widest ${statusToConfirm.currentStatus === 'open' ? 'text-rose-500' : 'text-[#00C853]'}`}>{statusToConfirm.currentStatus === 'open' ? 'CLOSED' : 'OPEN'}</span>.
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStatusToConfirm(null)}
                                    disabled={isUpdatingStatus}
                                    className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleStatusToggle(statusToConfirm.logId, statusToConfirm.currentStatus)}
                                    disabled={isUpdatingStatus}
                                    className={`flex-[2] py-4 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${statusToConfirm.currentStatus === 'open' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-[#00C853] hover:bg-[#00B148] shadow-[#00C853]/20'}`}
                                >
                                    {isUpdatingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Candidate Status Confirmation Modal */}
            {
                candidateStatusConfirm && createPortal(
                    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setCandidateStatusConfirm(null)}>
                        <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl animate-scale-in border border-slate-200 relative" onClick={e => e.stopPropagation()}>
                            <div className="p-8 text-center space-y-6">
                                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-inner transition-transform duration-500 hover:scale-110 ${candidateStatusConfirm.targetStatus.toLowerCase().includes('shortlist') ? 'bg-[#e7faf0] text-[#00C853] shadow-emerald-100' : 'bg-rose-50 text-rose-500 shadow-rose-100'}`}>
                                    {candidateStatusConfirm.targetStatus.toLowerCase().includes('shortlist') ? <CheckCircle className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-[#111834] mt-4 mb-1 tracking-tight">
                                        {candidateStatusConfirm.targetStatus.toLowerCase().includes('shortlist') ? 'Confirm Shortlist' : 'Confirm Rejection'}
                                    </h3>
                                    <p className="text-[#5D7285] text-base font-medium max-w-[350px] mx-auto leading-relaxed mb-4 opacity-80">
                                        Are you sure you want to mark <span className="text-[#111834] font-black">{(candidateStatusConfirm.candidate.Name || candidateStatusConfirm.candidate['Name of the Candidate'] || '').toUpperCase()}</span> as <span className={`font-black ${candidateStatusConfirm.targetStatus.toLowerCase().includes('shortlist') ? 'text-[#00C853] font-bold' : 'text-rose-500 font-bold'}`}>{candidateStatusConfirm.targetStatus.toLowerCase().includes('shortlist') ? 'Shortlisted for Round 1' : 'Rejected'}</span>?
                                    </p>
                                </div>

                                {candidateStatusConfirm.targetStatus.toLowerCase().includes('shortlist') && (
                                    <div className="grid grid-cols-2 gap-6 items-start animate-slide-up w-full">
                                        <div className="text-left space-y-2 min-w-0">
                                            <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 ml-2 block uppercase">INTERVIEW DATE & TIME</label>
                                            <div className="relative group custom-datepicker-container">
                                                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00C853] pointer-events-none z-10 transition-transform group-hover:scale-110" />
                                                <DatePicker
                                                    ref={datePickerRef2}
                                                    selected={shortlistDatetime ? new Date(shortlistDatetime) : null}
                                                    onChange={(date) => setShortlistDatetime(date ? date.toISOString() : '')}
                                                    showTimeSelect
                                                    dateFormat="Pp"
                                                    minDate={new Date()}
                                                    filterTime={(time) => {
                                                        const now = new Date();
                                                        const selected = shortlistDatetime ? new Date(shortlistDatetime) : null;
                                                        if (!selected) return true;
                                                        const isToday = selected.toDateString() === now.toDateString();
                                                        if (!isToday) return true;
                                                        return time.getTime() >= now.getTime();
                                                    }}
                                                    popperProps={{ strategy: 'fixed' }}
                                                    calendarClassName="glass-datepicker"
                                                    placeholderText="Select Date & Time"
                                                    onChangeRaw={(e) => e.preventDefault()}
                                                    className="premium-datepicker-input emerald w-full"
                                                >
                                                    <div className="p-4 bg-white rounded-b-2xl border-t border-slate-100 flex justify-end">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); datePickerRef2.current?.setOpen(false); }}
                                                            className="px-8 py-2 bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-black/20"
                                                        >
                                                            Done
                                                        </button>
                                                    </div>
                                                </DatePicker>
                                            </div>
                                        </div>
                                        <div className="text-left space-y-2 min-w-0">
                                            <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 ml-2 block uppercase">INTERVIEW METHOD</label>
                                            <CustomDropdown
                                                name="interview_method"
                                                value={interviewMethod}
                                                onChange={(e) => setInterviewMethod(e.target.value)}
                                                options={[
                                                    { value: 'Google Meet', label: 'Google Meet', icon: Video },
                                                    { value: 'AI Call Agent', label: 'AI Call Agent', icon: Sparkles }
                                                ]}
                                                icon={interviewMethod === 'Google Meet' ? Video : Sparkles}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-4 pt-6">
                                    <button
                                        onClick={() => { setCandidateStatusConfirm(null); setShortlistDatetime(''); }}
                                        disabled={isUpdatingStatus}
                                        className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        onClick={() => handleUpdateCandidateStatus(candidateStatusConfirm.candidate, candidateStatusConfirm.targetStatus)}
                                        disabled={isUpdatingStatus || (candidateStatusConfirm.targetStatus.toLowerCase().includes('shortlist') && !shortlistDatetime)}
                                        className={`flex-[2] py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${candidateStatusConfirm.targetStatus.toLowerCase().includes('shortlist') ? 'bg-[#00C853] hover:bg-[#00b049] shadow-emerald-500/30' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'} text-white`}
                                    >
                                        {isUpdatingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : 'CONFIRM'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Delete Confirmation Modal */}
            {
                deleteConfirmation && createPortal(
                    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setDeleteConfirmation(null)}>
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in flex flex-col border border-slate-200" onClick={e => e.stopPropagation()}>
                            <div className="p-8 text-center space-y-6">
                                <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-inner bg-rose-50 text-rose-500">
                                    <Trash2 className="w-10 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Delete JD?</h3>
                                    <p className="text-sm font-medium text-slate-500">
                                        Are you sure you want to delete <span className="font-bold text-slate-800">"{deleteConfirmation.role}"</span>? This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                            <div className="flex bg-slate-50 p-3 gap-3 border-t border-slate-100">
                                <button
                                    onClick={() => setDeleteConfirmation(null)}
                                    className="flex-1 py-4 text-slate-500 hover:bg-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        handleDeleteJD(deleteConfirmation.logId, deleteConfirmation.role);
                                        setDeleteConfirmation(null);
                                    }}
                                    className="flex-[2] py-4 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                                >
                                    Delete Job Description
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {
                webhookResponse && createPortal(
                    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-center" onClick={() => setWebhookResponse(null)}>
                        <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in border border-slate-200 relative" onClick={e => e.stopPropagation()}>
                            <div className="p-10 space-y-6">
                                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-inner mb-6 ${webhookResponse.success ? 'bg-emerald-50 text-emerald-500 shadow-emerald-100' : 'bg-rose-50 text-rose-500 shadow-rose-100'}`}>
                                    {webhookResponse.success ? (
                                        webhookResponse.type === 'calendar' ? <Calendar className="w-10 h-10" /> : <CheckCircle className="w-10 h-10" />
                                    ) : (
                                        <XCircle className="w-10 h-10" />
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                        {webhookResponse.message}
                                    </h3>
                                    <p className={`text-sm font-bold leading-relaxed px-4 ${webhookResponse.success ? 'text-slate-600' : 'text-slate-700'}`}>
                                        {webhookResponse.summary}
                                    </p>
                                </div>
                                <div className="pt-6">
                                    <button
                                        onClick={() => setWebhookResponse(null)}
                                        className={`w-full py-4 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${webhookResponse.success ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-black hover:bg-slate-800 shadow-black/20'}`}
                                    >
                                        {webhookResponse.success ? 'Got it, Thanks' : 'Understood'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            <style>{datePickerStyles}</style>
        </div >
    );
};

export default JD;
