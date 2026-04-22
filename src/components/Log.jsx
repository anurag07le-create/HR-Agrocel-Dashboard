import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearch } from '../context/SearchContext';
import { FileText, Mail, Star, User, CheckCircle, XCircle, Clock, Loader2, Eye, Download, Share2, X, MessageCircle, Send, Users, ChevronDown, LayoutGrid, List, AlignLeft, Calendar, Sparkles, Phone, Video, Link, Play, ExternalLink } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { fetchSheetData } from '../utils/googleSheets';
import { GOOGLE_SHEETS_CONFIG, WEBHOOK_URLS } from '../config';
import { getDocUrls, shareDoc } from '../utils/docHelper';
import { fetchWithRetry } from '../utils/fetchHelper';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useData } from '../context/DataContext';
import { useLoading } from '../context/LoadingContext';

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
    .glass-datepicker .react-datepicker__day--selected {
        background: #0f172a !important;
        color: white !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        transform: scale(1.05);
    }
    .glass-datepicker .react-datepicker__day--keyboard-selected {
        background: transparent !important;
        color: #0f172a !important;
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

const CandidateRow = memo(({
    item,
    index,
    openDropdownId,
    setOpenDropdownId,
    statusConfirm,
    setStatusConfirm,
    setActiveMessage,
    activeMessage,
    setSelectedDoc,
    getDocUrls,
    shareDoc,
    setSelectedCandidate
}) => {
    return (
        <tr 
            key={index} 
            onClick={() => setSelectedCandidate(item)}
            className={`group hover:bg-slate-500/5 transition-all duration-300 relative border-b border-[var(--border-color)]/30 cursor-pointer ${openDropdownId === item.Email ? 'z-50' : 'z-0'}`}>

            <td className="px-3 py-3"> {/* Reduced px-6 to px-3 */}
                <div className="flex flex-col">
                    <span className="font-semibold text-base text-[var(--text-primary)] tracking-tight group-hover:text-indigo-600 transition-colors">
                        {item['Name of the Candidate'] || item.Name}
                    </span>
                    <div className="flex flex-col gap-1 mt-0.5">
                        <span className="text-xs text-[var(--text-secondary)]/60 font-medium tracking-tight">
                            {item.Email}
                        </span>
                    </div>
                </div>
            </td>
            <td className="px-3 py-3"> {/* Reduced px-6 to px-3 */}
                <div className="max-w-[180px] truncate text-sm font-semibold text-[var(--text-primary)]/80"> {/* Reduced max-width slightly */}
                    {item.Role}
                </div>
            </td>
            <td className="px-3 py-3 text-center"> {/* Reduced px-6 to px-3 */}
                <span className="inline-flex items-center justify-center px-2 py-1 bg-indigo-500/10 text-indigo-600 rounded-lg text-sm font-bold border border-indigo-500/10 min-w-[40px]">
                    {item.Score || 'N/A'}/10
                </span>
            </td>
            <td className="px-3 py-3 text-center"> {/* Reduced px-6 to px-3 */}
                <div className="relative status-dropdown-container flex flex-col items-center justify-center gap-1.5">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!(item.Status || '').toLowerCase().includes('shortlist')) {
                                setOpenDropdownId(openDropdownId === item.Email ? null : item.Email);
                            }
                        }}
                        className={`flex items-center justify-between gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 border w-fit ${!(item.Status || '').toLowerCase().includes('shortlist') ? 'active:scale-[0.98] cursor-pointer' : 'cursor-default'} ${(item.Status || 'Pending').toLowerCase().includes('shortlist')
                            ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10 hover:bg-emerald-500/10'
                            : (item.Status || '').toLowerCase().includes('reject') || (item.Status || '').toLowerCase().includes('not shortlisted')
                                ? 'bg-rose-500/5 text-rose-600 border-rose-500/10 hover:bg-rose-500/10'
                                : 'bg-amber-500/5 text-amber-600 border-amber-500/10 hover:bg-amber-500/10'
                            }`}
                    >
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                            {item.Status || 'Pending'}
                        </div>
                        {!(item.Status || '').toLowerCase().includes('shortlist') && (
                            <ChevronDown className={`w-3 h-3 opacity-40 transition-transform duration-300 ${openDropdownId === item.Email ? 'rotate-180' : ''}`} />
                        )}
                    </button>

                    {openDropdownId === item.Email && (
                        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-max min-w-[120px] bg-white/95 backdrop-blur-xl border border-[var(--border-color)] rounded-xl shadow-xl z-[90] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top">
                            <div className="p-1 space-y-0.5">
                                {[
                                    { id: 'pending', label: 'Pending', icon: Clock, color: 'text-indigo-500', bg: 'hover:bg-indigo-500/10' },
                                    { id: 'Shortlist Round 1', label: 'Shortlist Round 1', icon: CheckCircle, color: 'text-emerald-500', bg: 'hover:bg-emerald-500/10' },
                                    { id: 'not shortlisted', label: 'Rejected', icon: XCircle, color: 'text-rose-500', bg: 'hover:bg-rose-500/10' }
                                ].map((opt) => (
                                     <button
                                        key={opt.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setStatusConfirm({ candidate: item, targetStatus: opt.id });
                                            setOpenDropdownId(null);
                                        }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all duration-200 ${opt.bg} ${opt.color} group/opt`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <opt.icon className="w-3.5 h-3.5" />
                                            {opt.label}
                                        </div>
                                        {((item.Status || 'Pending').toLowerCase().includes('shortlist') && opt.id === 'Shortlist Round 1' ||
                                            (item.Status || 'Pending').toLowerCase() === opt.id.toLowerCase() ||
                                            ((item.Status || '').toLowerCase().includes('reject') && opt.id === 'not shortlisted')
                                        ) && (
                                                <CheckCircle className={`w-3 h-3 ${opt.color}`} />
                                            )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </td>
            <td className="px-3 py-3"> {/* Reduced px-6 to px-3 */}
                <div className="flex items-center justify-center gap-1.5">
                    <button
                        onClick={(e) => { e.stopPropagation(); setActiveMessage({ candidate: item, type: 'email', content: '' }); }}
                        className={`p-1.5 rounded-lg transition-all duration-300 border ${activeMessage?.candidate?.Email === item.Email && activeMessage?.type === 'email' ? 'bg-[#EA4335] text-white border-[#EA4335] shadow-lg shadow-[#EA4335]/20 scale-110' : 'bg-white text-[#EA4335]/70 border-[var(--border-color)]/60 hover:text-[#EA4335] hover:bg-[#EA4335]/5 hover:border-[#EA4335]/20'}`}
                        title="Email"
                    >
                        <Mail className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setActiveMessage({ candidate: item, type: 'whatsapp', content: '' }); }}
                        className={`p-1.5 rounded-lg transition-all duration-300 border ${activeMessage?.candidate?.Email === item.Email && activeMessage?.type === 'whatsapp' ? 'bg-[#25D366] text-white border-[#25D366] shadow-lg shadow-[#25D366]/20 scale-110' : 'bg-white text-[#25D366]/70 border-[var(--border-color)]/60 hover:text-[#25D366] hover:bg-[#25D366]/5 hover:border-[#25D366]/20'}`}
                        title="WhatsApp"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                </div>
            </td>
            <td className="px-3 py-3 text-center"> {/* Changed from text-right to text-center */}
                <div className="flex items-center justify-center gap-1.5"> {/* Changed from justify-end to justify-center */}
                    {item.CV && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const { preview } = getDocUrls(item.CV);
                                    if (preview) {
                                        setSelectedDoc({ url: preview, title: `${item['Name of the Candidate'] || item.Name}'s Resume` });
                                    } else {
                                        toast.error('Preview Unavailable', 'The resume link is invalid or missing.');
                                    }
                                }}
                                className="p-1.5 bg-white text-indigo-500/70 hover:text-indigo-600 border border-[var(--border-color)]/60 hover:bg-indigo-500/5 hover:border-indigo-500/20 rounded-lg transition-all shadow-sm hover:scale-110 active:scale-95"
                                title="View CV"
                            >
                                <Eye className="w-3.5 h-3.5" />
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
});

const ScoreFilterDropdown = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const options = [
        { value: 'all', label: 'All Scores' },
        { value: '8-10', label: '8 - 10' },
        { value: '6-7', label: '6 - 7' },
        { value: '4-5', label: '4 - 5' },
        { value: '0-3', label: '0 - 3' }
    ];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(o => o.value === value)?.label || 'All Scores';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus:outline-none transition-all"
            >
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="hidden sm:inline">{selectedLabel}</span>
                <span className="sm:hidden">Score</span>
                <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-32 sm:w-36 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="p-1">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                    value === opt.value
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const Log = () => {
    const { log: logData, loading, refreshData, forceRefresh, setActiveRoute } = useData();
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [viewType, setViewType] = useState('list'); // 'grid' or 'list'
    const { searchQuery } = useSearch();
    const datePickerRef1 = useRef(null);

    useEffect(() => { setActiveRoute('log'); }, [setActiveRoute]);

    // COMMUNICATION STATE
    const [activeMessage, setActiveMessage] = useState(null);
    const [selectedChoice, setSelectedChoice] = useState('generated');
    const [messageSentStatus, setMessageSentStatus] = useState('none');
    const [comparisonData, setComparisonData] = useState(null);
    const [pollingIntervalId, setPollingIntervalId] = useState(null);

    // SHORTLISTING STATE
    const [statusConfirm, setStatusConfirm] = useState(null); // { candidate, targetStatus }
    const [webhookResponse, setWebhookResponse] = useState(null); // Detailed response modal for all actions
    const [openDropdownId, setOpenDropdownId] = useState(null); // Track which dropdown is open
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'shortlisted', 'rejected'
    const [scoreFilter, setScoreFilter] = useState('all'); // 'all', '8-10', '6-7', '4-5', '0-3'

    // WORKFLOW STATE
    const [shortlistDate, setShortlistDate] = useState('');
    const [messageType, setMessageType] = useState('interview'); // 'interview' only now
    const [isMessageTypeDropdownOpen, setIsMessageTypeDropdownOpen] = useState(false);
    const [interviewDatetime, setInterviewDatetime] = useState('');
    const [shortlistDatetime, setShortlistDatetime] = useState('');
    const [interviewCalendarOpen, setInterviewCalendarOpen] = useState(false);
    const [shortlistCalendarOpen, setShortlistCalendarOpen] = useState(false);
    const [interviewMethod, setInterviewMethod] = useState('Google Meet');
    const [selectedCandidate, setSelectedCandidate] = useState(null); // For candidate detail popup

    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const toast = useToast();
    const { startLoading, stopLoading } = useLoading();

    const handleDateChange = (e, setter) => {
        const dateVal = e.target.value;
        if (!dateVal) {
            setter('');
            return;
        }
        const date = new Date(dateVal);
        const day = date.getDay(); // 0 is Sunday

        // Check for Sunday
        if (day === 0) {
            toast.error('Invalid Date Selection', 'Sundays are not allowed. Please select another date.');
            setter(''); // Reset input
        } else {
            setter(dateVal);
        }
    };

    // Cleanup and Click Outside Handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.status-dropdown-container')) {
                setOpenDropdownId(null);
            }
            if (!event.target.closest('.message-type-dropdown-container')) {
                setIsMessageTypeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            if (pollingIntervalId) clearInterval(pollingIntervalId);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [pollingIntervalId]);

    // Memoized Handlers to prevent row re-renders
    const handleSetSelectedDoc = useCallback((doc) => setSelectedDoc(doc), []);
    const handleSetOpenDropdownId = useCallback((id) => setOpenDropdownId(id), []);



    const handleSetActiveMessage = useCallback((msg) => {
        setActiveMessage(msg);
        setMessageType('interview');
        setInterviewDatetime('');
    }, []);

    // Manage body class for modal blurring
    useEffect(() => {
        if (activeMessage || statusConfirm || selectedDoc || webhookResponse || selectedCandidate) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [activeMessage, statusConfirm, selectedDoc, webhookResponse, selectedCandidate]);

    // Use data from context
    const data = useMemo(() => logData || [], [logData]);

    const handleSendMessage = async () => {
        if (!activeMessage || !activeMessage.candidate) return;
        toast.info('Processing...', 'Dispatching communication in background.', 2000);
        setMessageSentStatus('waiting');

        try {
            // Generate a unique chat_id for this specific send
            const chatId = `CHAT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

            const payload = {
                candidate: String(activeMessage.candidate['Name of the Candidate'] || activeMessage.candidate.Name || '').trim(),
                candidateName: String(activeMessage.candidate['Name of the Candidate'] || activeMessage.candidate.Name || '').trim(),
                email: String(activeMessage.candidate.Email || '').trim(),
                role: activeMessage.candidate.Role || activeMessage.candidate.role || 'Not specified',
                log_id: String(activeMessage.candidate['Log ID'] || activeMessage.candidate.log_id || '').trim(),
                type: activeMessage.type || 'email',
                purpose: 'interview',
                message: activeMessage.content || '',
                // Aliases for stability across components and backend
                channel: activeMessage.type || 'email',
                message_intent: 'interview',
                context: activeMessage.content || '',
                interview_time: formatToIST(interviewDatetime),
                interview_method: interviewMethod,
                'meeting type': interviewMethod,
                response: formatToIST(interviewDatetime),
                timestamp: new Date().toISOString(),
                chat_id: chatId
            };

            const response = await fetch(WEBHOOK_URLS.COMMUNICATION, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('[COMMUNICATION] Webhook response status:', response.status);

            // START POLLING FOR GENERATED MESSAGE (Sheet MESSAGE_APPROVAL)
            let attempts = 0;
            const maxMsgAttempts = 90; // ~4.5 minutes (increased for AI processing time)
            const currentLogId = String(activeMessage.candidate['Log ID'] || activeMessage.candidate.log_id || '').trim();
            const targetType = activeMessage.type.toLowerCase().trim();

            console.log(`[POLLING] Started polling for LogID: ${currentLogId}, Type: ${targetType}`);
            const pollInterval = setInterval(async () => {
                attempts++;
                if (attempts % 5 === 0) console.log(`[POLLING] Attempt ${attempts}/${maxMsgAttempts}...`);
                try {
                    const results = await fetchSheetData(
                        GOOGLE_SHEETS_CONFIG.HR_WORKFLOW_ID,
                        GOOGLE_SHEETS_CONFIG.GIDS.MESSAGE_APPROVAL,
                        { force: true }
                    );

                    // Find latest row matching Chat ID, or fallback to Log ID/Email + Type
                    const row = [...results].reverse().find(r => {
                        // Get all column names
                        const allKeys = Object.keys(r);
                        
                        // Find Chat_id column - check multiple variants
                        let rowChatId = '';
                        const chatIdVariants = ['Chat_id', 'Chat ID', 'chat_id', 'ChatID', 'chatId', 'chat id', 'Chat_Id'];
                        for (const key of chatIdVariants) {
                            if (r[key]) {
                                rowChatId = String(r[key]).trim();
                                break;
                            }
                        }
                        
                        // If not found by name, search for any value starting with "CHAT-"
                        if (!rowChatId) {
                            for (const key of allKeys) {
                                const val = String(r[key] || '').trim();
                                if (val.startsWith('CHAT-')) {
                                    rowChatId = val;
                                    break;
                                }
                            }
                        }
                        
                        const rowLogId = String(r['Log ID'] || r['log_id'] || r['logid'] || r['LogID'] || '').trim();
                        const rowType = String(r['Type'] || r['type'] || '').toLowerCase().trim();
                        const rowEmail = String(r['Email'] || r['email'] || r['Candidate Email'] || r['Candidate email'] || '').toLowerCase().trim();
                        const targetEmail = String(activeMessage.candidate.Email || activeMessage.candidate.email || '').toLowerCase().trim();

                        // Primary match: Chat ID
                        if (chatId && rowChatId && rowChatId === chatId) {
                            console.log(`[POLLING] Matched by Chat ID: ${chatId}`);
                            return true;
                        }

                        // Fallback match: (Log ID or Email) AND Type
                        const logIdMatch = currentLogId && rowLogId && (rowLogId === currentLogId);
                        const emailMatch = targetEmail && rowEmail && (rowEmail === targetEmail);
                        const typeMatch = !rowType || rowType.includes(targetType) || targetType.includes(rowType);

                        const matched = (logIdMatch || emailMatch) && typeMatch;
                        if (matched) console.log(`[POLLING] Matched by LogId/Email: LogId=${logIdMatch}, Email=${emailMatch}, Type=${typeMatch}`);
                        return matched;
                    });

                    const getValidVal = (val) => {
                        const s = String(val || '').trim();
                        return (s && s !== 'undefined' && s !== 'null') ? s : null;
                    };

                    if (row) {
                        // Get values using exact column names from the sheet
                        const genMsg = getValidVal(row['Generated Message'] || row['Generated Message '] || row['Generated'] || row['AI Message']);
                        const userMsg = getValidVal(row['Message'] || row['User Message'] || row['user_message']) || activeMessage.content;
                        const acceptUrl = getValidVal(row['Approved'] || row['Accepted URL'] || row['Accept']);
                        const rejectUrl = getValidVal(row['Rejected'] || row['Rejected URL'] || row['Reject']);
                        const rowStatus = String(row['Status'] || '').trim();

                        console.log(`[POLLING] Row found! GenMsg: ${!!genMsg}, Accept: ${!!acceptUrl}, Reject: ${!!rejectUrl}, Status: ${rowStatus}`);

                        // Success if we have a generated message with accept/reject URLs
                        if (genMsg && (acceptUrl || rejectUrl)) {
                            clearInterval(pollInterval);
                            setPollingIntervalId(null);
                            setComparisonData({
                                generated: genMsg,
                                user: userMsg,
                                acceptUrl: acceptUrl,
                                rejectUrl: rejectUrl,
                                candidate: activeMessage.candidate,
                                type: activeMessage.type
                            });
                            setMessageSentStatus('comparison');
                            stopLoading();
                        } else if (genMsg && !acceptUrl && !rejectUrl) {
                            // If we have a generated message but no URLs, show success anyway
                            clearInterval(pollInterval);
                            setPollingIntervalId(null);
                            setMessageSentStatus('success');
                            stopLoading();
                        } else if (rowStatus.toLowerCase().includes('accepted') || rowStatus.toLowerCase().includes('sent') || rowStatus.toLowerCase().includes('complete')) {
                            // If status indicates completion
                            clearInterval(pollInterval);
                            setPollingIntervalId(null);
                            setMessageSentStatus('success');
                            stopLoading();
                        }
                    }

                    if (attempts >= maxMsgAttempts) {
                        clearInterval(pollInterval);
                        setPollingIntervalId(null);
                        setMessageSentStatus('error');
                        stopLoading();
                    }
                } catch (err) {
                    console.error("Polling error", err);
                }
            }, 3000);

            setPollingIntervalId(pollInterval);

        } catch (err) {
            console.error("Send message error", err);
            setMessageSentStatus('error');
            stopLoading();
        }
    };

    const handleActionChoice = async (url) => {
        if (!url) return;
        toast.info('Processing...', 'Dispatching selected message in background.', 2000);
        try {
            const response = await fetch(url);
            const responseData = await response.json().catch(() => ({}));

            if (response.ok && (responseData.success !== false && responseData.status !== 'error')) {
                setMessageSentStatus('success');
                setTimeout(() => {
                    setMessageSentStatus('none');
                    setActiveMessage(null);
                    setComparisonData(null);
                }, 3000);
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

    const handleUpdateStatus = useCallback(async (candidate, targetStatus) => {
        const isShortlisting = targetStatus.toLowerCase().includes('shortlist');

        if (isShortlisting) {
            toast.info('Processing...', 'Generating AI Context in background.', 2000);
            setStatusConfirm(null);
            // 1-second delay for aesthetic AI generation loading before webhook
            await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
            toast.info('Processing...', 'Updating Status in background.', 2000);
        }

        try {
            const webhookUrl = isShortlisting ? WEBHOOK_URLS.SHORTLIST_STATUS : WEBHOOK_URLS.STATUS_ACTION_WEBHOOK;

            const payload = isShortlisting ? {
                log_id: String(candidate['Log ID'] || candidate.log_id || '').trim(),
                email: String(candidate.Email || '').trim(),
                candidateName: String(candidate['Name of the Candidate'] || candidate.Name || '').trim(),
                role: candidate.Role || candidate.role || 'Not specified',
                status: targetStatus,
                interview_time: shortlistDatetime ? formatToIST(shortlistDatetime) : null,
                interview_method: interviewMethod,
                action: 'new schedue',
                meetingLink: 'https://calendly.com/shailesh-limbani-solarischemtech/interview-meeting',
                timestamp: new Date().toISOString()
            } : {
                log_id: String(candidate['Log ID'] || candidate.log_id || '').trim(),
                email: String(candidate.Email || '').trim(),
                candidateName: String(candidate['Name of the Candidate'] || candidate.Name || '').trim(),
                role: candidate.Role || candidate.role || 'Not specified',
                status: targetStatus,
                interview_time: shortlistDatetime ? formatToIST(shortlistDatetime) : null,
                interview_method: interviewMethod,
                action: 'candidate_status_update',
                timestamp: new Date().toISOString()
            };

            const response = await fetchWithRetry(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }, 3); // 3 retries

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();

            if (responseData.success || responseData.status === 'success') {
                const title = responseData.interview_scheduled === 'yes' ? 'Interview Scheduled' : 'Success';

                // Wait for 1 second to allow Google Sheets sync
                await new Promise(resolve => setTimeout(resolve, 1000));

                setWebhookResponse({
                    success: true,
                    message: responseData.interview_scheduled === 'yes' ? 'Interview Scheduled' : 'Action Successful',
                    summary: responseData.message || 'Action completed successfully',
                    type: responseData.interview_scheduled === 'yes' ? 'calendar' : 'check'
                });

                // Force refresh data immediately
                forceRefresh();
            } else {
                console.error("Webhook returned error:", responseData);
                const errorMsg = responseData.message || responseData.summery || responseData.summary || 'Operation failed';

                setWebhookResponse({
                    success: false,
                    message: (errorMsg.toLowerCase().includes("slot already booked") || responseData.interview_scheduled === "no") ? "Scheduling Conflict" : "Attention Required",
                    summary: errorMsg,
                    type: (errorMsg.toLowerCase().includes("slot already booked") || responseData.interview_scheduled === "no") ? 'calendar' : 'alert'
                });
            }

            setStatusConfirm(null);
        } catch (err) {
            console.error("Status update error", err);
            setWebhookResponse({
                success: false,
                message: "Attention Required",
                summary: err.message === "Failed to fetch" ? "Network error. Please check your connection." : err.message,
                type: 'alert'
            });
        } finally {
            stopLoading();
        }
    }, [shortlistDatetime, toast, forceRefresh, interviewMethod]);

    const handleSetStatusConfirm = useCallback((conf) => {
        if (conf && conf.targetStatus === 'pending') {
            handleUpdateStatus(conf.candidate, 'pending');
            // Check if we need to set statusConfirm for the loader to show
            // The row loader check is: isUpdatingStatus && statusConfirm?.candidate?.Email === item.Email
            // So we MUST set statusConfirm with the candidate, but use skipModal to avoid the dialog
            setStatusConfirm({ ...conf, skipModal: true });
        } else {
            setStatusConfirm(conf);
            setShortlistDatetime('');
        }
    }, [handleUpdateStatus]);

    const filteredData = useMemo(() => {
        // Reverse the data to show latest entries first
        const query = (searchQuery || '').trim().toLowerCase();
        
        return [...data].reverse().filter(item => {
            const matchesSearch = !query || (
                (item['Name of the Candidate'] || item.Name || '').toLowerCase().includes(query) ||
                (item.Email || '').toLowerCase().includes(query) ||
                (item.Role || '').toLowerCase().includes(query) ||
                (item.Summary || '').toLowerCase().includes(query) ||
                String(item['Contact Number'] || '').toLowerCase().includes(query) ||
                String(item['Score'] || '').includes(query)
            );
            const matchesStatus = statusFilter === 'all' ||
                (item.Status || 'Pending').toLowerCase().includes(statusFilter.toLowerCase());
            
            // Score filter
            let matchesScore = true;
            if (scoreFilter !== 'all') {
                const score = parseFloat(item.Score) || 0;
                switch (scoreFilter) {
                    case '8-10': matchesScore = score >= 8 && score <= 10; break;
                    case '6-7': matchesScore = score >= 6 && score < 8; break;
                    case '4-5': matchesScore = score >= 4 && score < 6; break;
                    case '0-3': matchesScore = score >= 0 && score < 4; break;
                    default: matchesScore = true;
                }
            }
            
            return matchesSearch && matchesStatus && matchesScore;
        });
    }, [data, searchQuery, statusFilter, scoreFilter]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* View Toggle Header */}
            <div className="flex flex-col gap-3 bg-white/80 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-[var(--border-color)]/60 mx-1 shadow-sm relative z-30">
                {/* Top Row: Count */}
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    <span>{filteredData.length} Candidates</span>
                </div>

                {/* Bottom Row: Filters + View Toggle */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Status Filter - takes full width */}
                    <div className="flex items-center bg-slate-100/50 p-1 rounded-xl border border-slate-200/60 overflow-x-auto flex-1">
                        {['all', 'pending', 'shortlisted', 'rejected'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-2 sm:px-3 py-1.5 rounded-lg text-[8px] sm:text-[9px] uppercase tracking-wider transition-all duration-300 whitespace-nowrap flex-shrink-0 ${statusFilter === status
                                    ? 'bg-black text-white shadow-lg shadow-black/10 font-bold'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 font-semibold'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center bg-slate-100/50 p-1 rounded-xl border border-slate-200/60">
                        <button
                            onClick={() => setViewType('grid')}
                            className={`p-2 rounded-lg transition-all duration-300 ${viewType === 'grid' ? 'bg-black text-white shadow-lg shadow-black/10 font-bold' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 font-semibold'}`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewType('list')}
                            className={`p-2 rounded-lg transition-all duration-300 ${viewType === 'list' ? 'bg-black text-white shadow-lg shadow-black/10 font-bold' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50 font-semibold'}`}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Score Filter Dropdown */}
                    <div className="flex-shrink-0">
                        <ScoreFilterDropdown value={scoreFilter} onChange={setScoreFilter} />
                    </div>
                </div>
            </div>

            {viewType === 'grid' ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredData.map((item, index) => {
                        const { preview, download } = getDocUrls(item.CV);
                        return (
                            <div key={`${item['Log ID'] || ''}-${item.Email || ''}-${index}`} className="glass-card p-6 rounded-2xl group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 cursor-pointer" onClick={() => setSelectedCandidate(item)}>
                                {/* Accent Background */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-125"></div>

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center space-x-4 min-w-0 flex-1 mr-2">
                                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg group-hover:rotate-3 transition-transform shrink-0">
                                                <div className="h-full w-full rounded-[10px] bg-black/20 flex items-center justify-center text-white text-xl font-bold backdrop-blur-sm">
                                                    {(item['Name of the Candidate'] || item.Name || '?').charAt(0)}
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors">
                                                    {item['Name of the Candidate'] || item.Name}
                                                </h3>
                                                <div className="flex items-center text-[10px] text-[var(--text-secondary)] mt-0.5 font-bold uppercase tracking-wider opacity-70 truncate">
                                                    <Mail className="w-3 h-3 mr-1 text-indigo-400 shrink-0" />
                                                    <span className="truncate">{item.Email}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-xs font-bold text-[var(--text-primary)] bg-[var(--bg-secondary)]/50 px-2 py-1 rounded-lg border border-[var(--border-color)] shrink-0">
                                            <Star className="w-3 h-3 text-amber-400 mr-1 fill-amber-400" />
                                            {item.Score ? `${item.Score}/10` : '-'}
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6 flex-1">
                                        <div className="p-3 bg-[var(--bg-secondary)]/50 rounded-xl border border-[var(--border-color)]">
                                            <div className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em] mb-1 opacity-60">Applied Role</div>
                                            <div className="text-sm font-bold text-[var(--text-primary)]">{item.Role}</div>
                                        </div>

                                        <div className="p-3 bg-[var(--bg-secondary)]/50 rounded-xl border border-[var(--border-color)]">
                                            <div className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em] mb-1 opacity-60">Status</div>
                                            {((item.Status || 'Pending').toLowerCase() === 'pending' || (item.Status || '').toLowerCase().includes('prefer')) ? (
                                                <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => setStatusConfirm({ candidate: item, targetStatus: 'shortlisted' })}
                                                        className="flex-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-emerald-500/20"
                                                    >
                                                        Shortlist
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(item, 'not shortlisted')}
                                                        className="flex-1 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-rose-500/20"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className={`flex items-center text-xs font-bold uppercase tracking-[0.15em] ${(item.Status || '').toUpperCase().includes('SHORTLIST') ? 'text-emerald-500' : (item.Status || '').toUpperCase().includes('REJECT') ? 'text-rose-500' : 'text-indigo-400'}`}>
                                                        {item.Status}
                                                        {(item.Status || '').toUpperCase().includes('SHORTLIST') ? <CheckCircle className="w-3.5 h-3.5 ml-2" /> : (item.Status || '').toUpperCase().includes('REJECT') ? <XCircle className="w-3.5 h-3.5 ml-2" /> : null}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => setActiveMessage({ candidate: item, type: 'email', content: '' })}
                                                className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all border border-rose-100 shadow-sm active:scale-95"
                                            >
                                                <Mail className="w-3.5 h-3.5" />
                                                Email
                                            </button>
                                            <button
                                                onClick={() => setActiveMessage({ candidate: item, type: 'whatsapp', content: '' })}
                                                className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all border border-emerald-100 shadow-sm active:scale-95"
                                            >
                                                <MessageCircle className="w-3.5 h-3.5" />
                                                WhatsApp
                                            </button>
                                        </div>

                                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                            {item.CV ? (
                                                <button
                                                    onClick={() => setSelectedCandidate(item)}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Resume
                                                </button>
                                            ) : (
                                                <div className="w-full text-[10px] font-bold uppercase tracking-widest text-gray-400 py-2.5 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center">
                                                    No Resume Attached
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-[var(--border-color)]/60 shadow-sm mx-1 flex flex-col">
                    <div className="overflow-y-auto h-[calc(100vh-220px)] custom-scrollbar">
                        <table className="w-full text-left border-collapse relative">
                            <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-md shadow-sm">
                                <tr className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-[var(--border-color)]/30">
                                    <th className="px-3 py-5">Candidate</th>
                                    <th className="px-3 py-5">Applied Role</th>
                                    <th className="px-3 py-5 text-center">Score</th>
                                    <th className="px-3 py-5 text-center">Status</th>
                                    <th className="px-3 py-5 text-center">Communicate</th>
                                    <th className="px-3 py-5 text-center">Resume</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]/50">
                                {filteredData.map((item, index) => (
                                    <CandidateRow
                                        key={`${item['Log ID'] || ''}-${item.Email || ''}-${index}`}
                                        item={item}
                                        index={index}
                                        openDropdownId={openDropdownId}
                                        setOpenDropdownId={handleSetOpenDropdownId}
                                        statusConfirm={statusConfirm}
                                        setStatusConfirm={handleSetStatusConfirm}
                                        setActiveMessage={handleSetActiveMessage}
                                        activeMessage={activeMessage}
                                        setSelectedDoc={handleSetSelectedDoc}
                                        getDocUrls={getDocUrls}
                                        shareDoc={shareDoc}
                                        setSelectedCandidate={setSelectedCandidate}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <style>{datePickerStyles}</style>

            {/* MESSAGE MODAL */}
            {
                activeMessage && createPortal(
                    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setActiveMessage(null)}>
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
                                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500/60 flex items-center gap-2">
                                            <span className="w-4 h-px bg-indigo-500/20"></span>
                                            To: <span className="text-slate-900">{activeMessage.candidate['Name of the Candidate'] || activeMessage.candidate.Name}</span>
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setActiveMessage(null)} className="p-3 hover:bg-rose-50 rounded-2xl transition-all text-gray-300 hover:text-rose-500 border border-transparent hover:border-rose-100">
                                    <X className="w-7 h-7" />
                                </button>
                            </div>
                            <div className="p-10 overflow-y-auto custom-scrollbar flex-1 bg-white rounded-b-[2.5rem]">
                                {messageSentStatus === 'none' || messageSentStatus === 'waiting' ? (
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
                                                <div className="absolute bottom-6 right-6 p-2 bg-white rounded-xl shadow-md border border-gray-50 flex items-center gap-2">
                                                    <Sparkles className="w-3 h-3 text-indigo-400" />
                                                    <span className="text-[8px] font-black tracking-[0.1em] text-gray-300 uppercase">AI POWERED DRAFTING</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={handleSendMessage} className="w-full py-5 bg-[#6366F1] hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl shadow-indigo-600/30 flex items-center justify-center hover:scale-[1.02] active:scale-95">
                                            <Sparkles className="w-5 h-5 mr-3" />GENERATE MESSAGE PROPOSALS
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
                                            <button onClick={() => handleActionChoice(comparisonData.rejectUrl)} className="px-10 py-5 bg-white text-gray-400 border border-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all font-bold">Discard Draft</button>
                                            <button onClick={() => handleActionChoice(selectedChoice === 'generated' ? comparisonData.acceptUrl : comparisonData.rejectUrl)} className="flex-1 py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-black/20 flex items-center justify-center gap-3 hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-95"><><Send className="w-5 h-5 text-indigo-400" />Approve & Dispatch</></button>
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
                        </div >
                    </div >,
                    document.body
                )
            }


            {/* STATUS UPDATE CONFIRMATION */}
            {
                statusConfirm && !statusConfirm.skipModal && createPortal(
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setStatusConfirm(null)}>
                        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-scale-up border border-slate-100 text-center flex flex-col max-h-[90vh] overflow-visible" onClick={e => e.stopPropagation()}>
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto ${statusConfirm.targetStatus.toLowerCase().includes('shortlist') ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                {statusConfirm.targetStatus.toLowerCase().includes('shortlist') ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 text-center mb-2 tracking-tight">
                                {statusConfirm.targetStatus.toLowerCase().includes('shortlist') ? 'Confirm Shortlist' : 'Confirm Rejection'}
                            </h3>
                            <p className="text-sm font-medium text-slate-500 text-center mb-8 px-4">
                                Are you sure you want to mark <span className="text-slate-800 font-bold uppercase">{statusConfirm.candidate['Name of the Candidate'] || statusConfirm.candidate.Name}</span> as <span className={statusConfirm.targetStatus.toLowerCase().includes('shortlist') ? 'text-emerald-500 font-bold uppercase' : 'text-rose-500 font-bold uppercase'}>{statusConfirm.targetStatus.toLowerCase().includes('shortlist') ? 'Shortlisted for Round 1' : 'Rejected'}</span>?
                            </p>

                            {statusConfirm.targetStatus.toLowerCase().includes('shortlist') && (
                                <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 relative">
                                    <div className="grid grid-cols-2 gap-6 items-start relative z-30">
                                        {/* Date & Time Column */}
                                        <div className="space-y-2 text-left">
                                            <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 ml-2 block uppercase">
                                                Interview Date & Time
                                            </label>
                                            <div className="relative custom-datepicker-container">
                                                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 pointer-events-none z-10" />
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={shortlistDatetime ? new Date(shortlistDatetime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
                                                    onClick={() => setShortlistCalendarOpen(true)}
                                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-[3.75rem] pr-4 h-[56px] text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                                                />
                                                {!shortlistDatetime && (
                                                    <span className="absolute left-[3.75rem] top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">
                                                        Select Date & Time
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[9px] text-slate-300 mt-1.5 font-bold ml-2 leading-relaxed">
                                                * Minimum 2 days from today. Sundays excluded.
                                            </p>
                                        </div>

                                        {/* Method Column */}
                                        <div className="space-y-2 text-left">
                                            <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 ml-2 block uppercase">
                                                Interview Method
                                            </label>
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
                                </div>
                            )}
                            {shortlistCalendarOpen && createPortal(
                                <div
                                    className="fixed inset-0 flex items-center justify-center"
                                    style={{ zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.5)' }}
                                    onClick={(e) => { if (e.target === e.currentTarget) setShortlistCalendarOpen(false); }}
                                >
                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col items-center animate-scale-up" onClick={(e) => e.stopPropagation()}>
                                        <DatePicker
                                            selected={shortlistDatetime ? new Date(shortlistDatetime) : null}
                                            onChange={(date) => {
                                                if (date.getDay() === 0) {
                                                    toast.error('Invalid Date Selection', 'Sundays are not allowed. Please select another date.');
                                                    return;
                                                }
                                                setShortlistDatetime(date.toISOString());
                                            }}
                                            showTimeSelect
                                            inline
                                            calendarClassName="glass-datepicker"
                                            minDate={new Date()}
                                            filterDate={(date) => date.getDay() !== 0}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShortlistCalendarOpen(false)}
                                            className="mt-8 w-full py-4 bg-black text-white rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-black/20 transition-all transform active:scale-[0.98] hover:bg-slate-800"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>,
                                document.body
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStatusConfirm(null)}
                                    className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(statusConfirm.candidate, statusConfirm.targetStatus)}
                                    disabled={statusConfirm.targetStatus.toLowerCase().includes('shortlist') && !shortlistDatetime}
                                    className={`flex-[2] py-4 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${statusConfirm.targetStatus.toLowerCase().includes('shortlist') ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'}`}
                                >
                                    CONFIRM
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* SELECTED DOCUMENT MODAL */}
            {
                selectedDoc && createPortal(
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setSelectedDoc(null)}>
                        <div className="relative w-full max-w-5xl h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl animate-scale-up border border-white/10" onClick={e => e.stopPropagation()}>
                            <div className="absolute top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-6 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 truncate max-w-md">{selectedDoc.title}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => window.open(selectedDoc.url.replace('&embedded=true', ''), '_blank')}
                                        className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                        title="Open in New Tab"
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setSelectedDoc(null)}
                                        className="p-2.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
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
                                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-xl shadow-rose-500/10">
                                            <XCircle className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Preview Failed</h3>
                                        <p className="text-sm font-bold text-gray-400 max-w-xs mx-auto">
                                            We couldn't generate a preview for this document. The link might be broken or private.
                                        </p>
                                    </div>
                                )}
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

            {/* CANDIDATE DETAIL POPUP MODAL - Clean & Simple */}
            {selectedCandidate && createPortal(
                <div 
                    className="fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" 
                    onClick={() => setSelectedCandidate(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden border border-gray-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                                    {(selectedCandidate['Name of the Candidate'] || selectedCandidate.Name || '?').charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {selectedCandidate['Name of the Candidate'] || selectedCandidate.Name}
                                    </h2>
                                    <p className="text-sm text-gray-500">{selectedCandidate.Email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {selectedCandidate.CV && (
                                    <button
                                        onClick={() => {
                                            const { preview } = getDocUrls(selectedCandidate.CV);
                                            if (preview) {
                                                setSelectedDoc({ url: preview, title: `${selectedCandidate['Name of the Candidate'] || selectedCandidate.Name}'s Resume` });
                                            }
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-500 transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Preview CV
                                    </button>
                                )}
                                <button 
                                    onClick={() => setSelectedCandidate(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="popup-scroll overflow-y-auto h-[calc(90vh-140px)] p-8 space-y-6 scroll-smooth">
                            
                            {/* Status & Quick Info Row */}
                            <div className="flex items-center gap-4 flex-wrap">
                                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                                    (selectedCandidate.Status || '').toLowerCase().includes('shortlist') 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : (selectedCandidate.Status || '').toLowerCase().includes('reject')
                                            ? 'bg-rose-100 text-rose-700'
                                            : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {selectedCandidate.Status || 'Pending'}
                                </span>
                                <div className="flex gap-3 flex-1">
                                    <div className="flex-1 bg-gray-50 px-4 py-3 rounded-xl">
                                        <p className="text-xs font-medium text-gray-400 uppercase mb-1">Role</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedCandidate.Role || 'N/A'}</p>
                                    </div>
                                    <div className="flex-1 bg-gray-50 px-4 py-3 rounded-xl">
                                        <p className="text-xs font-medium text-gray-400 uppercase mb-1">Contact</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedCandidate['Contact Number'] || 'N/A'}</p>
                                    </div>
                                    <div className="w-32 bg-gray-50 px-4 py-3 rounded-xl text-center">
                                        <p className="text-xs font-medium text-gray-400 uppercase mb-1">Score</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedCandidate.Score ? `${selectedCandidate.Score}/10` : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Interview & Contact Row */}
                            {(selectedCandidate['Interview date'] || selectedCandidate['Interview type'] || selectedCandidate['Meeting link']) && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-3">Interview Details</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {selectedCandidate['Interview date'] && (
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-medium text-gray-400 uppercase mb-1">Date & Time</p>
                                                <p className="text-sm font-semibold text-gray-900">{selectedCandidate['Interview date']}</p>
                                            </div>
                                        )}
                                        {selectedCandidate['Interview type'] && (
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-xs font-medium text-gray-400 uppercase mb-1">Type</p>
                                                <p className="text-sm font-semibold text-gray-900">{selectedCandidate['Interview type']}</p>
                                            </div>
                                        )}
                                        {selectedCandidate['Meeting link'] && (
                                            <a 
                                                href={selectedCandidate['Meeting link']} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="bg-indigo-50 p-4 rounded-xl hover:bg-indigo-100 transition-colors"
                                            >
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
                            {selectedCandidate.Summary && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-3">Summary</h3>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-sm text-gray-700 leading-relaxed">{selectedCandidate.Summary}</p>
                                    </div>
                                </div>
                            )}

                            {/* Call Details */}
                            {(() => {
                                const callStatus = selectedCandidate['Call status'];
                                const callSummary = selectedCandidate['call summary'];
                                const fullConversion = selectedCandidate['fullConvertion'];
                                const recordingUrl = selectedCandidate['recording URL'];
                                
                                if (!callStatus && !callSummary && !fullConversion && !recordingUrl) return null;
                                
                                // Get conversation from call summary or fullConvertion (check which has JSON)
                                let conversationData = null;
                                let isConversation = false;
                                
                                // Check call summary first
                                if (callSummary) {
                                    try {
                                        const parsed = JSON.parse(callSummary);
                                        if (Array.isArray(parsed)) {
                                            conversationData = callSummary;
                                            isConversation = true;
                                        }
                                    } catch {}
                                }
                                
                                // If no conversation in call summary, check fullConvertion
                                if (!isConversation && fullConversion) {
                                    try {
                                        const parsed = JSON.parse(fullConversion);
                                        if (Array.isArray(parsed)) {
                                            conversationData = fullConversion;
                                            isConversation = true;
                                        }
                                    } catch {}
                                }
                                
                                return (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-3">Call Details</h3>
                                    <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                                        {/* Status & Recording Row */}
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

                                        {/* Conversation - Chat Style */}
                                        {(isConversation || callSummary?.includes('"role"') || fullConversion?.includes('"role"')) && (
                                            <div>
                                                <p className="text-xs font-medium text-gray-400 uppercase mb-2">Conversation</p>
                                                <div className="conversation-scroll bg-white border border-gray-200 rounded-xl p-4 max-h-80 overflow-y-auto space-y-3 scroll-smooth">
                                                    {(() => {
                                                        try {
                                                            // Try all sources for conversation data
                                                            let rawData = conversationData || callSummary || fullConversion;
                                                            
                                                            // Handle double-encoded JSON
                                                            let messages;
                                                            try {
                                                                messages = JSON.parse(rawData);
                                                            } catch {
                                                                messages = JSON.parse(JSON.parse(rawData));
                                                            }
                                                            
                                                            // Flatten nested arrays
                                                            if (Array.isArray(messages) && messages.length > 0 && Array.isArray(messages[0])) {
                                                                messages = messages.flat();
                                                            }
                                                            
                                                            // Filter to only messages with role and content
                                                            messages = messages.filter(m => m && typeof m === 'object' && m.role && m.content);
                                                            
                                                            if (messages.length === 0) {
                                                                return <div className="text-sm text-gray-500 italic">No messages found</div>;
                                                            }
                                                            
                                                            return messages.map((msg, i) => {
                                                                const isUser = msg.role === 'user';
                                                                return (
                                                                    <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`} style={{ animationDelay: `${Math.min(i * 30, 300)}ms`, animationFillMode: 'backwards' }}>
                                                                        <div className={`flex items-end gap-2 max-w-[75%] ${isUser ? 'flex-row-reverse' : ''}`}>
                                                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                                                                isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                                                                            }`}>
                                                                                {isUser ? 'U' : 'AI'}
                                                                            </div>
                                                                            <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                                                                                isUser 
                                                                                    ? 'bg-indigo-600 text-white rounded-br-md' 
                                                                                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                                                            }`}>
                                                                                <p className="leading-relaxed">{msg.content}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            });
                                                        } catch (e) {
                                                            console.error('Conversation parse error:', e);
                                                            return (
                                                                <div className="text-sm text-gray-500 italic">Unable to display conversation</div>
                                                            );
                                                        }
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                );
                            })()}

                        </div>
                    </div>
                </div>,
                document.body
            )}

            <style>{datePickerStyles}</style>
        </div >
    );
};

export default Log;
