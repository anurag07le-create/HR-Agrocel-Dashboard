import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Plus, Search, Briefcase, Users, CheckCircle, Clock, AlertCircle, ChevronRight, X, Loader2, Sparkles, TrendingUp, Star, Mail, Eye, IndianRupee, Upload, LayoutGrid, List, MapPin, Flag, MessageCircle, Download, ChevronLeft, ChevronDown, XCircle, ExternalLink, Share2, Calendar, FileText, Trash2, Send, Video } from 'lucide-react';
import { WEBHOOK_URLS, GOOGLE_SHEETS_CONFIG } from '../config';
import { fetchSheetData } from '../utils/googleSheets';
import { getDocUrls } from '../utils/docHelper';
import { useNotification, mapJDApprovalData } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import { useSearch } from '../context/SearchContext';
import { generateLogID } from '../utils/idGenerator';
import { useLoading } from '../context/LoadingContext';
import { useData } from '../context/DataContext';

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
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        padding: 0 !important;
        z-index: 99999 !important;
    }
    .react-datepicker-popper {
        z-index: 99999 !important;
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
    .react-datepicker-popper .react-datepicker__triangle {
        display: none !important;
    }
`;



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

const RequirementIntake = () => {
    const location = useLocation();
    const { requirements: rawRequirements, log: logData, loading: contextLoading, forceRefresh, setActiveRoute } = useData();
    const { startLoading, stopLoading } = useLoading();
    const [requirements, setRequirements] = useState([]);

    useEffect(() => { setActiveRoute('requirements'); }, [setActiveRoute]);
    const [showForm, setShowForm] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedRequirement, setSelectedRequirement] = useState(null);
    const [filter, setFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const { searchQuery: searchTerm, setSearchQuery: setSearchTerm } = useSearch();
    const { triggerNotification } = useNotification();
    const { success, error: showError, info } = useToast();
    const fileInputRef = useRef(null);
    const datePickerRef1 = useRef(null);
    const datePickerRef2 = useRef(null);

    // States that were previously missing or corrupted
    const [formData, setFormData] = useState({
        role: '',
        experience: '',
        salary: '',
        location: '',
        priority: 'Normal',
        total: 1,
        jobDescription: '',
        keyResponsibilities: '',
        education: '',
        department: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [shortlistInterviewDate, setShortlistInterviewDate] = useState('');
    const [polling, setPolling] = useState(false);
    const [regenerationContext, setRegenerationContext] = useState(null);
    const [webhookResponse, setWebhookResponse] = useState(null); // Detailed response modal for all actions
    const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
    const [shortlistDatetime, setShortlistDatetime] = useState('');
    const [shortlistCalendarOpen, setShortlistCalendarOpen] = useState(false);
    const [statusConfirm, setStatusConfirm] = useState(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [activeMessage, setActiveMessage] = useState(null);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [messageSentStatus, setMessageSentStatus] = useState('none');
    const [comparisonData, setComparisonData] = useState(null);
    const [selectedChoice, setSelectedChoice] = useState('generated');
    const [isActioningSelection, setIsActioningSelection] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [interviewDatetime, setInterviewDatetime] = useState('');
    const [interviewCalendarOpen, setInterviewCalendarOpen] = useState(false);
    const [messageType, setMessageType] = useState('interview');
    const [openStatusDropdownId, setOpenStatusDropdownId] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);
    const [interviewMethod, setInterviewMethod] = useState('Google Meet');
    const activeMessageRef = useRef(activeMessage);
    const pendingStatusUpdates = useRef({});

    // Keep ref in sync for async loops
    useEffect(() => {
        activeMessageRef.current = activeMessage;
    }, [activeMessage]);

    // Click outside listener for priority dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isPriorityDropdownOpen && !event.target.closest('.priority-dropdown-container')) {
                setIsPriorityDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isPriorityDropdownOpen]);

    // Body scroll lock on modal open
    useEffect(() => {
        if (showForm || showUploadModal || statusConfirm || activeMessage || selectedDoc) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
    }, [showForm, showUploadModal, statusConfirm, activeMessage, selectedDoc]);

    // Handle Regeneration from location state (Revise Criteria flow)
    useEffect(() => {
        if (location.state?.regenerationData) {
            const data = location.state.regenerationData;
            console.log('[RequirementIntake] Received Regeneration Data:', data);

            setFormData({
                role: data.role || '',
                experience: data.experience || '',
                salary: data.salary || '',
                location: data.location || '',
                priority: data.priority || 'Normal',
                total: data.total || 1,
                jobDescription: data.jobDescription || '',
                keyResponsibilities: data.keyResponsibilities || '',
                education: data.education || '',
                department: data.department || ''
            });

            setRegenerationContext({ logId: data.log_id });
            setShowForm(true);

            // Clear state so it doesn't reopen on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    // Sync Data from Context
    useEffect(() => {
        if (contextLoading) return;

        const processedRequirements = rawRequirements.map((req, index) => {
            const logId = String(req['Log ID'] || req.log_id);
            const roleCandidates = logData.filter(candidate =>
                String(candidate['Log ID'] || candidate.log_id || '').trim() === logId
            ).map(c => ({
                log_id: c['Log ID'],
                name: c['Name of the Candidate'] || c.Name,
                email: c.Email,
                score: c.Score,
                status: c.Status || 'Pending',
                cv: c.CV,
                role: c.Role || req.Role, // Map role for status updates
                original_role: c.Role // Preserve original role for accurate updates
            }));

            // Use backend status but respect optimistic update if it's fresh (< 30s old)
            const backendStatus = (() => {
                const s = (req['Current Status of Requirement'] || req.Status || '').toLowerCase();
                if (s.includes('close')) return 'Closed';
                if (s.includes('open') || s.includes('intake') || s.includes('induction')) return 'Open';
                return 'Open';
            })();

            const pending = pendingStatusUpdates.current[logId];
            const finalStatus = (pending && (Date.now() - pending.timestamp < 30000))
                ? pending.status
                : backendStatus;

            return {
                id: index,
                log_id: logId,
                role: req.Role,
                experience: req.Experience,
                salary: req['Salary(Rs)'] || req.Salary,
                priority: req.Urgency || 'Normal',
                location: req.Location,
                status: finalStatus,
                total: parseInt(req['Total Requirement'] || req['Total No of Requirment'] || "5") || 5,
                hired: parseInt(req['Currently Selected'] || "0") || 0,
                candidates: roleCandidates
            };
        });

        // Show newest first
        setRequirements(processedRequirements.reverse());
    }, [rawRequirements, logData, contextLoading]);

    // Update selectedRequirement if the requirements array changes
    // This ensures that modal views (like candidate lists) update reactively
    useEffect(() => {
        if (selectedRequirement) {
            const updated = requirements.find(r => r.log_id === selectedRequirement.log_id);
            if (updated) {
                // Only update if something actually changed to avoid infinite loops or unnecessary re-renders
                if (JSON.stringify(updated.candidates) !== JSON.stringify(selectedRequirement.candidates)) {
                    setSelectedRequirement(updated);
                }
            }
        }
    }, [requirements, selectedRequirement]);

    const loading = contextLoading && requirements.length === 0;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = async (event) => {
        let file;
        if (event.dataTransfer) {
            file = event.dataTransfer.files[0];
        } else {
            file = event.target.files[0];
        }

        if (!file) return;

        // Reset input value
        if (fileInputRef.current) fileInputRef.current.value = '';

        setShowUploadModal(false);
        startLoading('Analyzing JD Document', 'Please wait while we process your file...');

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('category', 'DOC JD');

        const logId = generateLogID();
        const fileType = file.name.split('.').pop().toLowerCase();
        uploadFormData.append('log_id', logId);
        uploadFormData.append('file_type', fileType);
        uploadFormData.append('timestamp', new Date().toISOString());

        try {
            console.log(`[RequirementIntake] Uploading file for Log ID: ${logId} `);
            const response = await fetch(WEBHOOK_URLS.JD_UPLOAD, {
                method: 'POST',
                body: uploadFormData,
            });

            if (response.ok) {
                console.log('[RequirementIntake] Upload successful. Starting poll...');
                startPolling(logId, { log_id: logId, category: 'DOC JD', file_type: fileType, timestamp: new Date().toISOString() }, true);
            } else {
                throw new Error('Upload failed');
            }
        } catch (err) {
            console.error('[RequirementIntake] Upload error:', err);
            stopLoading();
            showError("Upload Failed", "Could not upload the job description. Please try again.");
        }
    };

    const startPolling = async (logId, payload, isUpload = false) => {
        setPolling(true);
        let attempts = 0;
        const maxAttempts = 60; // 5-10 minutes
        const intervalTime = 10000;

        const poll = async () => {
            attempts++;
            console.log(`Polling effort ${attempts}/${maxAttempts} for Log ID: ${logId}`);

            if (attempts > maxAttempts) {
                setPolling(false);
                stopLoading();
                showError("Processing Timeout", "The JD is taking longer than expected. We'll notify you when it's ready.");
                return;
            }

            try {
                // Refresh data using DataContext overlay
                await forceRefresh(true);

                // Check if match exists in the newly fetched rawRequirements (or wait for rawRequirements to update via DataContext)
                // Actually, DataProvider updates context data. We need to check if context has it.
                // But startPolling is inside the component, so it has access to the *stale* context data unless we ref etch inside.
                // Better: the forceRefresh(true) in DataContext will update the 'requirements' and 'log' states via useEffect.

                // Let's use fetchSheetData directly for polling to be extra safe and immediate, 
                // but forceRefresh is also fine if it's async-awaited.

                const sheetData = await fetchSheetData(
                    GOOGLE_SHEETS_CONFIG.HR_WORKFLOW_ID,
                    GOOGLE_SHEETS_CONFIG.GIDS.JD_APPROVAL
                );

                const match = sheetData.find(row => String(row['Log ID']) === String(logId));

                if (match) {
                    console.log('[RequirementIntake] Match found in JD_Approval!', match);
                    setPolling(false);
                    stopLoading();

                    const enrichedData = mapJDApprovalData(match, logId, null, payload);
                    triggerNotification(enrichedData);

                    success("Draft Ready", "Your JD has been analyzed. Check notifications to approve.");
                } else {
                    setTimeout(poll, intervalTime);
                }
            } catch (err) {
                console.error("Polling error:", err);
                setTimeout(poll, intervalTime);
            }
        };

        poll();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting || polling) return;
        setSubmitting(true);
        info('Processing...', 'Generating JD Form in background.', 2000);

        let experience = formData.experience;
        if (experience && !experience.toLowerCase().includes('year')) {
            experience = `${experience} Years`;
        }

        const logId = generateLogID();
        const category = regenerationContext ? 'Regenerate JD' : 'New JD';

        const payload = {
            ...formData,
            experience,
            log_id: logId,
            category: category,
            timestamp: new Date().toISOString(),
            status: 'Open',
            hired: 0
        };

        try {
            const response = await fetch(WEBHOOK_URLS.REQUIREMENT_INTAKE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setShowForm(false);
                setRegenerationContext(null);
                startPolling(logId, payload);
                success("Requirement Created", "We're generating the JD draft. We'll notify you when it's ready.");
            } else {
                throw new Error("Webhook rejected request");
            }
        } catch (err) {
            console.error("Submit error:", err);
            stopLoading();
            showError("Submission Failed", "Could not create requirement. Please check your connection.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (candidate, targetStatus) => {
        const isShortlisting = targetStatus.toLowerCase().includes('shortlist');
        const logId = String(candidate.log_id || candidate['Log ID'] || '').trim();

        if (isShortlisting) {
            info('Processing...', 'Generating AI Context in background.', 2000);
            setStatusConfirm(null);
            // 1-second delay for aesthetic AI generation loading before webhook
            await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
            info('Processing...', 'Updating Status in background.', 2000);
        }

        try {
            const webhookUrl = isShortlisting ? WEBHOOK_URLS.SHORTLIST_STATUS : WEBHOOK_URLS.LOG_STATUS_UPDATE;

            const payload = isShortlisting ? {
                log_id: logId,
                email: candidate.email || candidate.Email || '',
                candidateName: candidate.name || candidate.Name || candidate['Name of the Candidate'] || '',
                role: candidate.role || candidate.original_role || candidate.Role || 'Not specified',
                status: targetStatus,
                interview_time: shortlistDatetime ? formatToIST(shortlistDatetime) : null,
                interview_method: interviewMethod,
                action: 'new schedue',
                meetingLink: 'https://calendly.com/shailesh-limbani-solarischemtech/interview-meeting',
                timestamp: new Date().toISOString()
            } : {
                log_id: logId,
                email: candidate.email || candidate.Email || '',
                candidateName: candidate.name || candidate.Name || candidate['Name of the Candidate'] || '',
                role: candidate.role || candidate.original_role || candidate.Role || 'Not specified',
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
                setStatusConfirm(null);
                setShortlistDatetime('');
                // Wait for 1 second to allow Google Sheets sync
                await new Promise(resolve => setTimeout(resolve, 1000));

                setWebhookResponse({
                    success: responseData.success || responseData.status === 'success',
                    message: responseData.message || (responseData.success ? "Action Successful" : "Attention Required"),
                    summary: responseData.summery || responseData.summary || (responseData.success ? `Candidate marked as ${targetStatus}.` : "Could not update candidate status."),
                    type: responseData.interview_scheduled === 'yes' ? 'calendar' : (responseData.success ? 'check' : 'alert')
                });

                // Crucial: Refresh data to get the latest status from backend
                await forceRefresh(true);

                // Override title for specific conflict
                const errorMsg = responseData.message || responseData.summery || responseData.summary || "";
                if (!responseData.success && (errorMsg.toLowerCase().includes("slot already booked") || responseData.interview_scheduled === "no")) {
                    setWebhookResponse(prev => ({ ...prev, message: "Scheduling Conflict" }));
                }
            } else {
                console.error("Webhook returned error:", responseData);
                const errorMsg = responseData.message || responseData.summery || responseData.summary || 'Could not update candidate status.';

                // Specific error override for booking conflicts
                if (errorMsg.toLowerCase().includes("slot already booked") || responseData.interview_scheduled === "no") {
                    setBookingError({
                        message: errorMsg,
                        summary: responseData.summery || responseData.summary || "Please select another time for the interview."
                    });
                } else {
                    showError('Scheduling Failed', errorMsg);
                    throw new Error(errorMsg);
                }
            }
        } catch (err) {
            setWebhookResponse({
                success: false,
                message: "Attention Required",
                summary: err.message === "Failed to fetch" ? "Network error. Please check your connection." : err.message,
                type: 'alert'
            });
        } finally {
            stopLoading();
        }
    };

    const handleRequirementStatusToggle = async (req, targetStatus) => {
        const logId = String(req.log_id || req['log_id'] || req['Log ID']).trim();
        console.log(`[Req Status Toggle] LogId: ${logId}, Target: ${targetStatus}`);
        info('Processing...', `Setting requirement status to ${targetStatus}...`, 2000);

        // Track pending status update to prevent snapback during sync
        pendingStatusUpdates.current[logId] = {
            status: targetStatus,
            timestamp: Date.now()
        };

        // Optimistic UI Update for instant feedback
        setRequirements(prev => prev.map(r =>
            String(r.log_id) === logId ? { ...r, status: targetStatus } : r
        ));

        try {
            const response = await fetch(WEBHOOK_URLS.JD_STATUS_UPDATE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    logid: logId,
                    status: targetStatus,
                    from: 'requirement'
                })
            });

            if (response.ok) {
                // Wait for 1 second to allow Google Sheets sync
                await new Promise(resolve => setTimeout(resolve, 1000));
                setWebhookResponse({
                    success: true,
                    message: "Requirement Updated",
                    summary: `Status changed to ${targetStatus}`,
                    type: 'check'
                });
                await forceRefresh(true);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setWebhookResponse({
                    success: false,
                    message: "Attention Required",
                    summary: errorData.message || errorData.summary || "Could not update requirement status.",
                    type: 'alert'
                });
            }
        } catch (err) {
            console.error('Status Error:', err);
            setWebhookResponse({
                success: false,
                message: "Attention Required",
                summary: "A network error occurred while updating the status.",
                type: 'alert'
            });
            forceRefresh(true); // Rollback to actual backend state
        } finally {
            stopLoading();
            setStatusConfirm(null);
        }
    };

    const handleSendMessage = async () => {
        info('Processing...', 'Dispatching communication in background.', 2000);
        try {
            const chatId = `CHAT-${Date.now()}`;
            const payload = {
                candidate: String(activeMessage.candidate?.name || '').trim(),
                candidateName: String(activeMessage.candidate?.name || '').trim(),
                email: String(activeMessage.candidate?.email || '').trim(),
                role: activeMessage.role || (activeMessage.candidate && activeMessage.candidate.role) || 'Not specified',
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

            // --- STEP 1: Fire webhook and check for immediate error ---
            try {
                const res = await fetch(WEBHOOK_URLS.AI_MESSAGE_GEN, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                let data = {};
                try { data = await res.json(); } catch (e) { /* non-JSON response */ }
                console.log('[handleSendMessage] Webhook response:', data);

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
                    return;
                }
            } catch (e) {
                console.warn('[handleSendMessage] Webhook fetch error (continuing to poll):', e);
            }


            // --- STEP 2: Poll Google Sheet for generated message ---
            const initialWait = 2000;
            const pollInterval = 2000;
            const maxWait = 90000;

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

                    if (totalWaitTime === initialWait && sheetData.length > 0) {
                        console.log('[handleSendMessage] Sheet columns:', Object.keys(sheetData[0]));
                        console.log('[handleSendMessage] Looking for chatId:', chatId);
                        console.log('[handleSendMessage] Last 2 rows:', sheetData.slice(-2).map(r => Object.entries(r).reduce((a, [k, v]) => { if (v) a[k] = v; return a; }, {})));
                    }

                    let row = [...sheetData].reverse().find(r => {
                        const id = String(r['Chat_id'] || r['Chat ID'] || r['ChatID'] || r['chat_id'] || r['Chat_Id'] || r['chatId'] || r['chat id'] || '').trim();
                        return id === chatId;
                    });

                    if (!row) {
                        row = sheetData.find(r => Object.values(r).some(v => String(v).trim() === chatId));
                    }

                    if (row) {
                        console.log('[handleSendMessage] Found matching row:', row);
                        const getValidVal = (val) => {
                            const s = String(val || '').trim();
                            return (s && s !== 'undefined' && s !== 'null') ? s : null;
                        };

                        const genMsg = (row['Generated Message'] || row['Generated Message '] || row['generated_message'] || row['Generated_Message'] || row['AI Message'] || '').trim();
                        const userMsg = getValidVal(row['Message'] || row['User Message'] || row['user_message'] || row['Original Message']) || originalContent;
                        const acceptUrl = getValidVal(row['Approved'] || row['Accepted URL'] || row['Accepted_URL'] || row['Accept_URL'] || row['Approve URL'] || row['Accept']);
                        const rejectUrl = getValidVal(row['Rejected'] || row['Rejected URL'] || row['Rejected_URL'] || row['Reject_URL'] || row['Decline URL'] || row['Reject']);

                        if (genMsg) {
                            setComparisonData({
                                user: userMsg || 'Standard system template',
                                generated: genMsg,
                                acceptUrl: acceptUrl,
                                rejectUrl: rejectUrl
                            });
                            setMessageSentStatus('comparison');
                            setSelectedChoice('generated');
                            stopLoading();
                            return;
                        } else {
                            const rowStatus = String(row['Status'] || '').trim().toLowerCase();
                            if (rowStatus.includes('accepted') || rowStatus.includes('sent') || rowStatus.includes('complete')) {
                                setMessageSentStatus('success');
                                stopLoading();
                                return;
                            }
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
        setIsActioningSelection(true);
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
            setIsActioningSelection(false);
        }
    };

    const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = () => setIsDragging(false);
    const onDrop = (e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e); };

    const handleDeleteRequirement = async (req) => {
        info('Processing...', 'Deleting requirement in background.', 2000);
        try {
            // Notify backend
            const response = await fetch(WEBHOOK_URLS.REQUIREMENT_INTAKE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    log_id: req.log_id,
                    action: 'delete',
                    role: req.role || 'Not specified',
                    timestamp: new Date().toISOString()
                })
            });

            if (response.ok) {
                // Wait for 1 second to allow Google Sheets sync
                await new Promise(resolve => setTimeout(resolve, 1000));
                setWebhookResponse({
                    success: true,
                    message: "Requirement Deleted",
                    summary: `"${req.role}" has been removed from the system.`,
                    type: 'check'
                });
                await forceRefresh(true);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setWebhookResponse({
                    success: false,
                    message: "Attention Required",
                    summary: errorData.message || errorData.summary || "Could not delete the requirement.",
                    type: 'alert'
                });
            }
        } catch (err) {
            console.error('Delete error:', err);
            setWebhookResponse({
                success: false,
                message: "Attention Required",
                summary: "A network error occurred while deleting the requirement.",
                type: 'alert'
            });
            forceRefresh(true); // Restore data on failure
        } finally {
            stopLoading();
            setDeleteConfirmation(null);
        }
    };

    // Grouping and Filtering logic
    const filteredRequirements = requirements.filter(req => {
        const rawStatus = (req.status || 'open').toString().trim().toLowerCase();
        const isClosed = (rawStatus === 'closed' || rawStatus === 'close');
        const isOpen = !isClosed; // Anything that isn't closed is open/active by default

        let matchesFilter = true;
        if (filter === 'active') {
            matchesFilter = isOpen;
        } else if (filter === 'closed') {
            matchesFilter = isClosed;
        }

        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            (req.role || '').toLowerCase().includes(searchLower) ||
            (req.location || '').toLowerCase().includes(searchLower) ||
            (req.log_id || '').toLowerCase().includes(searchLower);

        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return (
            <div className="p-8 space-y-8 animate-pulse">
                <div className="h-12 bg-slate-200 rounded-xl w-64"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-2xl"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
            {/* Controls Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white/80 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-[var(--border-color)]/60 mx-1 shadow-sm relative z-30">
                {/* Filters */}
                <div className="flex items-center bg-slate-100/50 p-1 rounded-xl border border-slate-200/60 overflow-x-auto">
                    {[
                        { id: 'all', label: 'all', count: requirements.length },
                        { id: 'active', label: 'open', count: requirements.filter(r => r.status === 'Open').length },
                        { id: 'closed', label: 'closed', count: requirements.filter(r => r.status === 'Closed').length }
                    ].map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-2 sm:px-4 py-1.5 rounded-lg text-[8px] sm:text-[10px] uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 ${filter === f.id
                                ? 'bg-black text-white shadow-lg shadow-black/10 font-bold'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 font-semibold'
                                }`}
                        >
                            {f.label}
                            <span className={`px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] ${filter === f.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                {f.count}
                            </span>
                        </button>
                    ))}
                </div>
                
                {/* Action Buttons */}
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border border-amber-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                    <Upload className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden sm:inline">Upload JD</span>
                    <span className="sm:hidden">Upload</span>
                </button>
                <button
                    onClick={() => { setRegenerationContext(null); setShowForm(true); }}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">New Requirement</span>
                    <span className="sm:hidden">New</span>
                </button>
                
                {/* View Toggle */}
                <div className="flex items-center bg-slate-100/50 p-1 rounded-xl border border-slate-200/60 ml-auto">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'grid' ? 'bg-black text-white shadow-lg shadow-black/10 font-bold' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 font-semibold'}`}
                        title="Grid View"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'list' ? 'bg-black text-white shadow-lg shadow-black/10 font-bold' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 font-semibold'}`}
                        title="List View"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRequirements.map((req) => {
                        const progressPercent = req.total > 0 ? Math.round((req.hired / req.total) * 100) : 0;
                        const isOpen = String(req.status || '').toLowerCase().trim() === 'open';

                        return (
                            <div key={req.id} className="glass-card p-5 md:p-6 rounded-2xl hover:shadow-xl hover:shadow-indigo-500/8 transition-all duration-500 group flex flex-col border border-[var(--border-color)] bg-[var(--card-bg)] relative overflow-hidden">
                                {/* Decorative Gradient */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>

                                <div className="flex items-start justify-between mb-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 transition-colors group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20">
                                            <Briefcase className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        {/* Status Toggle */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setStatusConfirm({ type: 'requirement', data: req, targetStatus: isOpen ? 'Closed' : 'Open' });
                                            }}
                                            disabled={isUpdatingStatus}
                                            className={`relative h-8 w-[110px] rounded-full transition-all duration-300 p-1 border shadow-inner ${isOpen
                                                ? 'bg-emerald-50 border-emerald-100'
                                                : 'bg-slate-50 border-slate-100'
                                                } ${isUpdatingStatus ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                                        >
                                            <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                                                <span className={`text-[8px] font-bold tracking-widest ${isOpen ? 'opacity-0' : 'text-slate-400 uppercase'}`}>OPEN</span>
                                                <span className={`text-[8px] font-bold tracking-widest ${!isOpen ? 'opacity-0' : 'text-slate-400 uppercase'}`}>CLOSED</span>
                                            </div>
                                            <div className={`absolute top-1 left-1 bottom-1 w-[52px] rounded-full transition-all duration-300 flex items-center justify-center shadow-md transform z-10 ${isOpen
                                                ? 'translate-x-0 bg-emerald-500'
                                                : 'translate-x-[52px] bg-slate-400'
                                                }`}>
                                                <span className="text-[9px] font-bold text-white uppercase tracking-tight">{isOpen ? 'OPEN' : 'CLOSED'}</span>
                                            </div>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">

                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmation(req); }}
                                            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                            title="Delete Requirement"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors tracking-tight relative z-10">
                                    {req.role}
                                </h3>

                                {/* Tags Row */}
                                <div className="flex flex-wrap items-center gap-2 mb-3 relative z-10">
                                    {req.location && req.location !== 'Not specified' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold border border-indigo-100">
                                            <MapPin className="w-3 h-3" />{req.location}
                                        </span>
                                    )}
                                    {req.salary && req.salary !== 'Not specified' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold border border-emerald-100">
                                            ₹ {req.salary}
                                        </span>
                                    )}
                                </div>

                                {/* Bottom section */}
                                <div className="space-y-3 mt-auto relative z-10">
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Hiring Progress</span>
                                            <span className="text-[10px] font-bold text-indigo-600">{req.hired}/{req.total} Hired</span>
                                        </div>
                                        <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${progressPercent >= 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-indigo-600'}`}
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedRequirement(req)}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2.5 group/btn"
                                    >
                                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        View {req.candidates?.length || 0} Candidates
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass-card rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-sm bg-white/40 backdrop-blur-xl">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/30">
                                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Position / Requirement</th>

                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] w-40 text-center">Hiring Progress</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] w-40 text-center">Status</th>
                                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] w-48 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]/50">
                                {filteredRequirements.map((req) => {
                                    const progressPercent = req.total > 0 ? Math.round((req.hired / req.total) * 100) : 0;
                                    const isOpen = String(req.status || '').toLowerCase().trim() === 'open';

                                    return (
                                        <tr key={req.id} className="group hover:bg-white/60 transition-all duration-300">
                                            <td className="px-8 py-3">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2.5 rounded-xl ${isOpen ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        <Briefcase className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-[var(--text-primary)] tracking-tight">{req.role}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" /> {req.location || 'Remote'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-3">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="text-[10px] font-bold text-indigo-600">{req.hired}/{req.total}</div>
                                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${progressPercent >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progressPercent}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => setStatusConfirm({ type: 'requirement', data: req, targetStatus: isOpen ? 'Closed' : 'Open' })}
                                                        className={`relative h-8 w-[110px] rounded-full transition-all duration-300 p-1 border shadow-inner ${isOpen
                                                            ? 'bg-emerald-50 border-emerald-100'
                                                            : 'bg-slate-100 border-slate-200'
                                                            }`}
                                                    >
                                                        <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                                                            <span className={`text-[8px] font-bold tracking-widest ${isOpen ? 'opacity-0' : 'text-slate-400'}`}>OPEN</span>
                                                            <span className={`text-[8px] font-bold tracking-widest ${!isOpen ? 'opacity-0' : 'text-emerald-500'}`}>CLOSED</span>
                                                        </div>
                                                        <div className={`absolute top-1 left-1 bottom-1 w-[52px] rounded-full transition-all duration-300 flex items-center justify-center shadow-sm transform z-10 ${isOpen
                                                            ? 'translate-x-0 bg-emerald-500'
                                                            : 'translate-x-[52px] bg-slate-400'
                                                            }`}>
                                                            <span className="text-[9px] font-bold text-white uppercase tracking-tight">{isOpen ? 'OPEN' : 'CLOSED'}</span>
                                                        </div>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedRequirement(req)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="View Candidates"
                                                    >
                                                        <Users className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteRequirement(req)}
                                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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
            )
            }

            {/* Modals section... (restored from Step 800+) */}
            {
                selectedRequirement && createPortal(
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in" onClick={() => setSelectedRequirement(null)}>
                        <div className="glass-card w-full max-w-6xl rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden animate-scale-in flex flex-col max-h-[90vh] shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="px-10 py-8 border-b border-[#F1F3F5] flex justify-between items-center bg-white">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-[#F8F9FA] rounded-[1.8rem] text-indigo-600 shadow-sm border border-[#F1F3F5]">
                                        <Briefcase className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-[#111834] tracking-tight">{selectedRequirement.role}</h2>
                                        <p className="text-[10px] font-bold text-[#5D7285] uppercase tracking-[0.25em] mt-1">
                                            Pipeline Status • {selectedRequirement.candidates?.length || 0} Candidates
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedRequirement(null)}
                                    className="p-3 hover:bg-[#F8F9FA] rounded-2xl text-slate-400 transition-all hover:rotate-90"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 pb-40 bg-[#FAFAFB]">
                                {selectedRequirement.candidates?.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-12 px-10 py-2 text-[10px] font-bold text-[#5D7285] uppercase tracking-[0.25em] mb-4 hidden md:grid">
                                            <div className="col-span-4">Candidate Name</div>
                                            <div className="col-span-2 text-center">Match Score</div>
                                            <div className="col-span-3 text-center">STATUS</div>
                                            <div className="col-span-3 text-right">Actions</div>
                                        </div>
                                        {[...selectedRequirement.candidates].reverse().map((candidate, idx) => (
                                            <div key={idx} className={`grid grid-cols-1 md:grid-cols-12 items-center px-6 py-4 bg-white border border-[#F1F3F5] rounded-[2rem] shadow-sm hover:shadow-md transition-all group animate-fade-in my-3 mx-2 ${openStatusDropdownId === idx ? 'relative z-50' : 'relative z-10'}`}>
                                                {/* Candidate Info */}
                                                <div className="col-span-1 md:col-span-4 flex items-center gap-5">
                                                    <div className="w-14 h-14 rounded-full bg-[#8E54E9] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
                                                        {candidate.name?.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-lg font-bold text-[#111834]">{candidate.name}</div>
                                                        <div className="text-xs font-medium text-[#5D7285] truncate opacity-70">{candidate.email}</div>
                                                    </div>
                                                </div>

                                                {/* Score */}
                                                <div className="col-span-1 md:col-span-2 flex justify-center py-4 md:py-0">
                                                    <div className="inline-flex items-center px-4 py-1.5 bg-[#FFF9E6] rounded-full border border-[#FFE7A3]">
                                                        <Star className="w-3.5 h-3.5 text-[#F5B800] fill-[#F5B800] mr-2" />
                                                        <span className="text-xs font-bold text-[#B38600]">
                                                            {(() => {
                                                                const scoreNum = parseInt(String(candidate.score || '0').replace('%', '')) || 0;
                                                                const maxScore = scoreNum <= 10 ? 10 : 100;
                                                                return `${scoreNum}/${maxScore}`;
                                                            })()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Status Dropdown */}
                                                <div className="col-span-1 md:col-span-3 flex flex-col justify-center items-center md:py-0 relative">
                                                    {(() => {
                                                        const rawStatus = candidate.status || candidate.Status || 'Pending';
                                                        const normalizedStatus = rawStatus.toUpperCase();
                                                        const isShortlisted = normalizedStatus.includes('SHORTLISTED');
                                                        return (
                                                            <>
                                                                <button
                                                                    onClick={(e) => {
                                                                        if (!isShortlisted) {
                                                                            e.stopPropagation(); setOpenStatusDropdownId(prev => prev === idx ? null : idx);
                                                                        }
                                                                    }}
                                                                    className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-3 transition-all min-w-fit whitespace-nowrap ${isShortlisted ? 'bg-[#E7FAF0] text-[#00C853] border border-[#BFF7D9] cursor-default' :
                                                                        normalizedStatus.includes('REJECTED') ? 'bg-[#FFF0F0] text-[#FF4D4D] border border-[#FFD9D9]' :
                                                                            'bg-[#F8F9FA] text-[#5D7285] border border-[#F1F3F5] hover:bg-gray-100'
                                                                        }`}
                                                                >
                                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${isShortlisted ? 'bg-[#00C853]' :
                                                                        normalizedStatus.includes('REJECTED') ? 'bg-[#FF4D4D]' : 'bg-[#A8B2BD]'
                                                                        }`}></div>
                                                                    <span className="truncate max-w-[120px]">{rawStatus}</span>
                                                                    {!isShortlisted && <ChevronDown className="w-3 h-3 opacity-50 ml-1 shrink-0" />}
                                                                </button>
                                                                {candidate.interviewType && (
                                                                    <div className="mt-1.5 w-full flex justify-center">
                                                                        <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 w-fit">
                                                                            <Video className="w-2.5 h-2.5 mr-1 shrink-0" />
                                                                            {candidate.interviewType}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {!isShortlisted && openStatusDropdownId === idx && (
                                                                    <div className="absolute top-full mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2 overflow-hidden animate-fade-in left-1/2 -translate-x-1/2">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setStatusConfirm({ candidate, targetStatus: 'Shortlisted for Round 1' }); setOpenStatusDropdownId(null); }}
                                                                            className="w-full text-left px-5 py-3 hover:bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-3 transition-colors border-b border-gray-50"
                                                                        >
                                                                            <CheckCircle className="w-4 h-4" /> Shortlist Round 1
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setStatusConfirm({ candidate, targetStatus: 'Rejected' }); setOpenStatusDropdownId(null); }}
                                                                            className="w-full text-left px-5 py-3 hover:bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-3 transition-colors"
                                                                        >
                                                                            <XCircle className="w-4 h-4" /> Reject
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Actions / Integrations */}
                                                < div className="col-span-1 md:col-span-3 flex justify-end items-center gap-3 mt-4 md:mt-0" >
                                                    <div className="flex items-center gap-1 pr-3 border-r border-[#F1F3F5]">
                                                        <button
                                                            onClick={() => { const { preview } = getDocUrls(candidate.cv); setSelectedDoc({ url: preview, title: candidate.name }); }}
                                                            className="p-2.5 bg-white border border-[#F1F3F5] rounded-xl text-slate-300 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                                                            title="Preview CV"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setActiveMessage({ candidate, type: 'whatsapp', content: '', role: selectedRequirement.role })}
                                                            className="p-2.5 bg-[#E7FAF0] text-[#00C853] border border-[#BFF7D9] rounded-xl hover:bg-[#D5F7E4] transition-all"
                                                            title="Send WhatsApp"
                                                        >
                                                            <MessageCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setActiveMessage({ candidate, type: 'email', content: '', role: selectedRequirement.role })}
                                                            className="p-2.5 bg-[#FFF0F0] text-[#FF4D4D] border border-[#FFD9D9] rounded-xl hover:bg-[#FFE6E6] transition-all"
                                                            title="Send Email"
                                                        >
                                                            <Mail className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                                        <Users className="w-24 h-24 mb-6 text-slate-300" />
                                        <h3 className="text-2xl font-bold uppercase tracking-[0.2em] text-slate-400">No Candidates Found</h3>
                                        <p className="text-sm font-bold mt-2 text-slate-400">Pipeline is currently empty for this role.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div >,
                    document.body
                )
            }

            {/* Form, Upload, Waiting, and Other Modals ... (Restored from Step 327) */}
            {/* ... (Truncated for brevity in tool call, but I will write the full JSX) */}

            {
                showForm && createPortal(
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                        <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh] border border-slate-200">
                            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center space-x-5">
                                    <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-600/20"><Sparkles className="w-6 h-6" /></div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{regenerationContext?.isRegeneration ? 'Regenerate Requirement' : 'Add New Requirement'}</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Let AI handle the JD creation</p>
                                        {
                                            regenerationContext?.log_id && (
                                                <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-widest">Original Log ID: {regenerationContext.log_id}</p>
                                            )
                                        }
                                    </div>
                                </div>
                                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"><X className="w-6 h-6" /></button>
                            </div>
                            <div className="p-10 overflow-y-auto custom-scrollbar flex-1 bg-white">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Role Title</label>
                                            <input type="text" name="role" value={formData.role} onChange={handleInputChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" placeholder="e.g. Senior Frontend Developer" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Salary Range</label>
                                            <input type="text" name="salary" value={formData.salary} onChange={handleInputChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" placeholder="e.g. $120k - $150k" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Experience</label>
                                            <input type="text" name="experience" value={formData.experience} onChange={handleInputChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" placeholder="e.g. 5+ Years" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Hiring Targets</label>
                                            <input type="number" name="total" value={formData.total} onChange={handleInputChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" min="1" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Location</label>
                                            <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" placeholder="e.g. Mumbai / Remote" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Department</label>
                                            <input type="text" name="department" value={formData.department} onChange={handleInputChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" placeholder="e.g. Engineering / Marketing" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Education</label>
                                            <input type="text" name="education" value={formData.education} onChange={handleInputChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" placeholder="e.g. Bachelor's in CS / MBA" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Urgency Level</label>
                                            <div className="relative priority-dropdown-container">
                                                <button type="button" onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-left flex items-center justify-between">
                                                    <span className={formData.priority ? 'text-slate-800' : 'text-slate-300'}>{formData.priority || 'Select Priority'}</span>
                                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isPriorityDropdownOpen ? 'rotate-180' : ''}`} />
                                                </button>
                                                {isPriorityDropdownOpen && (
                                                    <div className="absolute z-[160] w-full mt-3 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl p-2 animate-fade-in">
                                                        {
                                                            ['Normal', 'Urgent'].map(p => (
                                                                <button key={p} type="button" onClick={() => { setFormData(prev => ({ ...prev, priority: p })); setIsPriorityDropdownOpen(false); }} className={`w-full text-left px-5 py-3 rounded-xl text-sm font-bold transition-all ${formData.priority === p ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}>{p} Priority</button>
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Job Description</label>
                                            <textarea name="jobDescription" value={formData.jobDescription} onChange={handleInputChange} className="w-full h-32 px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 resize-none" placeholder="Paste the full job description here..."></textarea>
                                        </div>

                                    </div>
                                    <div className="pt-6 mt-10 border-t border-slate-100">
                                        <button type="submit" disabled={submitting} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center disabled:opacity-50 active:scale-[0.98]">
                                            {submitting ? <><Loader2 className="w-5 h-5 mr-3 animate-spin" />Processing...</> : <><Sparkles className="w-4 h-4 mr-2" />{regenerationContext?.isRegeneration ? 'Generate Variant' : 'Create Requirement'}</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {
                showUploadModal && createPortal(
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-center">
                        <div className={`glass-card w-full max-w-lg p-12 rounded-[3.5rem] border-4 border-dashed transition-all duration-300 transform animate-scale-in relative bg-white flex flex-col items-center justify-center ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
                            <button onClick={() => setShowUploadModal(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-300 transition-colors hidden md:block"><X className="w-6 h-6" /></button>
                            <div className="text-center space-y-6 flex flex-col items-center">
                                <div className={`w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center transition-all duration-300 shadow-sm ${isDragging ? 'bg-indigo-600 text-white rotate-12 scale-110 shadow-indigo-500/30' : 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 text-indigo-600 border border-indigo-100/50'}`}> <Briefcase className="w-10 h-10" /></div>
                                <div className="space-y-2">
                                    <h3 className="text-[26px] font-semibold text-slate-900 tracking-tight">Upload JD Document</h3>
                                    <p className="text-[15px] font-medium text-slate-500 leading-relaxed">Drag your PDF or Word document here,<br />or use the manual selector below.</p>
                                </div>
                                <div className="pt-4 pb-2">
                                    <input type="file" id="jd-upload-input" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx" />
                                    <label htmlFor="jd-upload-input" className="inline-flex justify-center px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.25rem] text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer max-w-fit border border-indigo-600/20 hover:shadow-indigo-500/30 tracking-wide">Select File</label>
                                </div>
                                <p className="text-xs font-semibold text-slate-400 block tracking-wide">PDF, DOC, DOCX up to 10MB</p>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {
                statusConfirm && !statusConfirm.type && createPortal(
                    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setStatusConfirm(null)}>
                        <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-scale-in border border-slate-200 relative" onClick={e => e.stopPropagation()}>
                            <div className="p-10 text-center space-y-8">
                                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center shadow-inner transition-transform duration-500 hover:scale-110 ${statusConfirm.targetStatus.toLowerCase().includes('shortlist') ? 'bg-[#e7faf0] text-[#00C853] shadow-emerald-100' : 'bg-rose-50 text-rose-500 shadow-rose-100'}`}>
                                    {statusConfirm.targetStatus.toLowerCase().includes('shortlist') ? <CheckCircle className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight whitespace-nowrap">
                                        {statusConfirm.targetStatus.toLowerCase().includes('shortlist') ? 'Confirm Shortlist' : 'Confirm Rejection'}
                                    </h3>
                                    <p className="text-sm font-bold text-slate-500 leading-relaxed px-4">
                                        Are you sure you want to mark <span className="text-slate-900 font-black">{statusConfirm.candidate?.name?.toUpperCase()}</span> as <span className={`font-black ${statusConfirm.targetStatus.toLowerCase().includes('shortlist') ? 'text-[#00C853]' : 'text-rose-600'}`}>{statusConfirm.targetStatus}</span>?
                                    </p>
                                </div>

                                {statusConfirm.targetStatus.toLowerCase().includes('shortlist') && (
                                    <div className="grid grid-cols-2 gap-6 items-start animate-slide-up w-full relative z-30">
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
                                                    portalId="datepicker-portal"
                                                    popperProps={{ strategy: 'fixed' }}
                                                    calendarClassName="glass-datepicker"
                                                    placeholderText="Select Date & Time"
                                                    onChangeRaw={(e) => e.preventDefault()}
                                                    className="premium-datepicker-input emerald w-full"
                                                >
                                                    <div className="p-4 bg-white rounded-b-2xl border-t border-slate-100 flex justify-center">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); datePickerRef2.current?.setOpen(false); }}
                                                            className="px-12 py-3.5 bg-black text-white font-bold text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-black/20 transition-all active:scale-95 hover:bg-slate-800"
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
                                        onClick={() => { setStatusConfirm(null); setShortlistDatetime(''); }}
                                        className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(statusConfirm.candidate, statusConfirm.targetStatus)}
                                        disabled={isUpdatingStatus || (statusConfirm.targetStatus.toLowerCase().includes('shortlist') && !shortlistDatetime)}
                                        className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${statusConfirm.targetStatus.toLowerCase().includes('shortlist') ? 'bg-[#00C853] hover:bg-[#00b049] shadow-emerald-500/30' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'} text-white`}
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
                                            TO: <span className="text-gray-900 ml-2">{activeMessage.candidate?.name || activeMessage.candidate?.['Name of the Candidate']}</span>
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setActiveMessage(null)} className="p-3 hover:bg-rose-50 rounded-2xl transition-all text-gray-300 hover:text-rose-500 border border-transparent hover:border-rose-100">
                                    <X className="w-7 h-7" />
                                </button>
                            </div>
                            <div className="p-10 overflow-y-auto custom-scrollbar flex-1 bg-white rounded-b-[2.5rem]">
                                {messageSentStatus === 'none' ? (
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
                                                        calendarClassName="glass-datepicker"
                                                        portalId="datepicker-portal"
                                                        popperProps={{ strategy: 'fixed' }}
                                                        placeholderText="Select Date & Time"
                                                        onChangeRaw={(e) => e.preventDefault()}
                                                        className="premium-datepicker-input w-full"
                                                    >
                                                        <div className="p-4 bg-white rounded-b-2xl border-t border-slate-100 flex justify-center mt-2">
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
                                                        { value: 'Google Meet', label: 'Google Meet' },
                                                        { value: 'AI Call Agent', label: 'AI Call Agent' }
                                                    ]}
                                                    icon={interviewMethod === 'Google Meet' ? Video : Sparkles}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 ml-2 block">MESSAGE CONTEXT (OPTIONAL)</label>
                                            <div className="relative group">
                                                <textarea value={activeMessage.content} onChange={(e) => setActiveMessage(prev => ({ ...prev, content: e.target.value }))} placeholder="Add any specifics our AI should mention..." className="w-full h-32 p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-normal focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-300 resize-none shadow-inner outline-none"></textarea>
                                                <div className="absolute bottom-6 right-6 p-2 bg-white rounded-xl shadow-md border border-gray-50 flex items-center gap-2">
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

            {
                selectedDoc && createPortal(
                    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fade-in" onClick={() => setSelectedDoc(null)}>
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden animate-scale-in flex flex-col border border-slate-200" onClick={e => e.stopPropagation()}>
                            <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center space-x-3"><FileText className="w-5 h-5 text-indigo-500" /><h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">{selectedDoc.title} - Document Preview</h3></div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => window.open(selectedDoc.url.replace('&embedded=true', ''), '_blank')} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-colors"><ExternalLink className="w-5 h-5" /></button>
                                    <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400"><X className="w-6 h-6" /></button>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-800 relative"><iframe src={selectedDoc.url} className="w-full h-full border-none" title="Doc Preview" /></div>
                        </div>
                    </div>,
                    document.body
                )
            }
            {
                statusConfirm && statusConfirm.type === 'requirement' && createPortal(
                    <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setStatusConfirm(null)}>
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in border border-slate-100" onClick={e => e.stopPropagation()}>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto ${statusConfirm.targetStatus.toLowerCase() === 'closed' ? 'bg-rose-50 text-rose-500' : 'bg-[#E7FAF0] text-[#00C853]'}`}>
                                {statusConfirm.targetStatus.toLowerCase() === 'closed' ? <XCircle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 text-center mb-2 tracking-tight">Are you sure?</h3>
                            <p className="text-sm font-medium text-slate-500 text-center mb-8">
                                You are about to move <span className="text-slate-900 font-bold uppercase">{statusConfirm.data.role || statusConfirm.data.name}</span> to <span className={`font-black uppercase tracking-widest ${statusConfirm.targetStatus.toLowerCase() === 'closed' ? 'text-rose-500' : 'text-[#00C853]'}`}>{statusConfirm.targetStatus}</span>.
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStatusConfirm(null)}
                                    className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (statusConfirm.type === 'requirement') {
                                            handleRequirementStatusToggle(statusConfirm.data, statusConfirm.targetStatus);
                                        }
                                    }}
                                    disabled={isUpdatingStatus}
                                    className={`flex-[2] py-4 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${statusConfirm.targetStatus.toLowerCase() === 'closed' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-[#00C853] hover:bg-[#00B148] shadow-[#00C853]/20'}`}
                                >
                                    {isUpdatingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm'}
                                </button>
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
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Delete Requirement?</h3>
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
                                        handleDeleteRequirement(deleteConfirmation);
                                        setDeleteConfirmation(null);
                                    }}
                                    className="flex-[2] py-4 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                                >
                                    Delete Requirement
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

export default RequirementIntake;
