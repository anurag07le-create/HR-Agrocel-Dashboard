import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, Video, Phone, X, FileText, LayoutGrid, List, CheckCircle, Star, Search, Linkedin, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CalendarDays, RefreshCw, Check } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fetchScheduledEvents } from '../utils/calendly';
import { getDocUrls, shareDoc } from '../utils/docHelper';
import { useSearch } from '../context/SearchContext';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';
import { useLoading } from '../context/LoadingContext';
import { WEBHOOK_URLS } from '../config';
import { parseCustomDate, extractTimeFromDate, formatDateToDDMMYYYY } from '../utils/dateFormatter';
import CandidateDetailPopup from './CandidateDetailPopup';

// Format date to IST string for workflow consumption
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

// Glass datepicker styles for reschedule modal
const datePickerStyles = `
    .reschedule-datepicker-container .react-datepicker-wrapper { width: 100%; display: block; }
    .glass-datepicker { font-family: inherit; background: #ffffff !important; border: 1px solid #e2e8f0 !important; border-radius: 16px !important; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 20px 25px -5px rgba(0,0,0,0.1) !important; padding: 0 !important; }
    .glass-datepicker .react-datepicker__month-container { padding: 20px; }
    .glass-datepicker .react-datepicker__header { background: transparent !important; border-bottom: 1px solid #f1f5f9; padding-top: 0; padding-bottom: 16px; margin-bottom: 8px; }
    .glass-datepicker .react-datepicker__current-month { color: #0f172a; font-weight: 800; font-size: 1.1rem; margin-bottom: 8px; }
    .glass-datepicker .react-datepicker__day-name { color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; width: 36px; line-height: 36px; margin: 2px; }
    .glass-datepicker .react-datepicker__day { color: #334155; width: 36px; line-height: 36px; margin: 2px; border-radius: 10px; font-weight: 600; transition: all 0.2s; border: 1px solid transparent; }
    .glass-datepicker .react-datepicker__day:hover { background-color: #f1f5f9; transform: scale(1.1); }
    .glass-datepicker .react-datepicker__day--selected, .glass-datepicker .react-datepicker__day--keyboard-selected { background: #0f172a !important; color: white !important; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transform: scale(1.05); }
    .glass-datepicker .react-datepicker__day--today { color: #0f172a; font-weight: 900; border: 1px solid #e2e8f0; }
    .glass-datepicker .react-datepicker__day--disabled { color: #cbd5e1 !important; cursor: not-allowed; }
    .glass-datepicker .react-datepicker__time-container { border-left: 1px solid #f1f5f9 !important; width: 110px !important; background: #ffffff; border-radius: 0 16px 16px 0; }
    .glass-datepicker .react-datepicker__time-container .react-datepicker__time { background: transparent !important; border-radius: 0 0 16px 0; }
    .glass-datepicker .react-datepicker__time-container .react-datepicker__time-box { width: 100% !important; }
    .glass-datepicker .react-datepicker__header--time { background: transparent !important; border-bottom: 1px solid #f1f5f9; padding: 20px 10px 16px !important; font-weight: 800; font-size: 0.85rem; color: #0f172a; }
    .glass-datepicker .react-datepicker__time-list { height: 260px !important; }
    .glass-datepicker .react-datepicker__time-list::-webkit-scrollbar { width: 4px; }
    .glass-datepicker .react-datepicker__time-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
    .glass-datepicker .react-datepicker__time-list-item { height: auto !important; padding: 6px 8px !important; font-size: 0.8rem; font-weight: 500; color: #475569; display: flex !important; align-items: center; justify-content: center; margin: 2px 6px; border-radius: 8px; }
    .glass-datepicker .react-datepicker__time-list-item:hover { background-color: #f1f5f9 !important; }
    .glass-datepicker .react-datepicker__time-list-item--selected { background: #0f172a !important; color: white !important; font-weight: 700; }
    .glass-datepicker .react-datepicker__navigation { top: 20px; border-radius: 50%; background-color: #f8fafc; width: 32px; height: 32px; border: 1px solid #e2e8f0; }
    .glass-datepicker .react-datepicker__navigation--previous { left: 20px; }
    .glass-datepicker .react-datepicker__navigation--next { right: auto; left: 260px; }
    .glass-datepicker .react-datepicker__navigation:hover { background-color: #f1f5f9; transform: scale(1.05); }
    .glass-datepicker .react-datepicker__navigation-icon::before { border-color: #475569; border-width: 2px 2px 0 0; height: 7px; width: 7px; top: 11px; }
    .react-datepicker-popper .react-datepicker__triangle { display: none !important; }
`;

const Interviews = () => {
    const { log: logData, requirements, jd: jdData, loading: sheetLoading, forceRefresh, setActiveRoute } = useData();
    const [interviews, setInterviews] = useState([]);
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [viewType, setViewType] = useState('grid');
    const [selectedDate, setSelectedDate] = useState(() => {
        return formatDateToDDMMYYYY(new Date());
    });
    const { searchQuery } = useSearch();
    const { success, error, info } = useToast();
    const { startLoading, stopLoading } = useLoading();
    const [statusConfirm, setStatusConfirm] = useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [rescheduleCandidate, setRescheduleCandidate] = useState(null);
    const [rescheduleDate, setRescheduleDate] = useState(null);
    const [rescheduleMethod, setRescheduleMethod] = useState('Google Meet');
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [webhookResponse, setWebhookResponse] = useState(null);

    // Handle reschedule submission
    const handleReschedule = useCallback(async () => {
        if (!rescheduleCandidate || !rescheduleDate) {
            error('Missing Info', 'Please select a new date and time.');
            return;
        }

        info('Processing...', 'Rescheduling interview in background.');
        try {
            const payload = {
                log_id: String(rescheduleCandidate.log_id || '').trim(),
                email: String(rescheduleCandidate.email || '').trim(),
                candidateName: String(rescheduleCandidate.name || '').trim(),
                role: rescheduleCandidate.role || 'Not specified',
                status: rescheduleCandidate.status || 'Shortlisted',
                interview_time: formatToIST(rescheduleDate),
                interview_method: rescheduleMethod,
                action: 'reschedule',
                meetingLink: 'https://calendly.com/shailesh-limbani-solarischemtech/interview-meeting',
                timestamp: new Date().toISOString()
            };

            const response = await fetch(WEBHOOK_URLS.SHORTLIST_STATUS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const responseData = await response.json().catch(() => ({}));

            if (response.ok && (responseData.success !== false && responseData.status !== 'error')) {
                setWebhookResponse({
                    success: true,
                    message: 'Interview Rescheduled',
                    summary: responseData.message || `Interview rescheduled for ${rescheduleCandidate.name}.`,
                    type: 'calendar'
                });
                setRescheduleCandidate(null);
                setRescheduleDate(null);
                setCalendarOpen(false);
                forceRefresh();
            } else {
                const errorMsg = responseData.message || responseData.summery || responseData.summary || 'Rescheduling failed.';
                setWebhookResponse({
                    success: false,
                    message: errorMsg.toLowerCase().includes('slot already booked') || responseData.interview_scheduled === 'no' ? 'Scheduling Conflict' : 'Attention Required',
                    summary: errorMsg,
                    type: errorMsg.toLowerCase().includes('slot already booked') || responseData.interview_scheduled === 'no' ? 'calendar' : 'alert'
                });
            }
        } catch (err) {
            console.error('[Reschedule Error]', err);
            setWebhookResponse({
                success: false,
                message: 'Attention Required',
                summary: err.message === 'Failed to fetch' ? 'Network error. Please check your connection.' : err.message,
                type: 'alert'
            });
        }
    }, [rescheduleCandidate, rescheduleDate, rescheduleMethod, info, error, forceRefresh]);

    useEffect(() => { setActiveRoute('interviews'); }, [setActiveRoute]);

    // Fetch events once on mount
    useEffect(() => {
        let cancelled = false;
        const loadEvents = async () => {
            try {
                const eventsData = await fetchScheduledEvents();
                if (!cancelled) setEvents(eventsData || []);
            } catch (err) {
                console.error("Failed to load events", err);
            } finally {
                if (!cancelled) setEventsLoading(false);
            }
        };
        loadEvents();
        return () => { cancelled = true; };
    }, []);

    // Process interviews data - don't wait for Calendly
    useEffect(() => {
        if (sheetLoading || !logData?.length) {
            console.log('[Interviews] Waiting for data...', { sheetLoading, logDataLength: logData?.length });
            return;
        }

        console.log('[Interviews] Processing log data:', logData.length, 'items');
        if (logData.length > 0) {
            console.log('[Interviews] First item keys:', Object.keys(logData[0]));
            console.log('[Interviews] First item sample:', logData[0]);
        }

        const getRawDate = (item) => {
            const standardKeys = ['Interview date', 'Interview Date', 'interview date', 'interview_date', 'InterviewDate'];
            for (const key of standardKeys) {
                if (item[key] && String(item[key]).trim() !== '') return String(item[key]);
            }
            // Fallback: search for a column header that is an actual date string
            const dateHeaderKey = Object.keys(item).find(k => k.match(/^\d{4}-\d{2}-\d{2}$/) || k.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/));
            if (dateHeaderKey) {
                const cellValue = item[dateHeaderKey];
                if (cellValue && String(cellValue).trim() !== '') {
                    if (typeof cellValue === 'string' && cellValue.match(/\d{1,2}:\d{2}/)) {
                        return `${dateHeaderKey} ${cellValue}`;
                    }
                    return String(cellValue);
                }
            }
            return null;
        };

        const formatted = logData
            .filter(item => {
                const hasInterviewDate = getRawDate(item);
                if (hasInterviewDate) {
                    console.log('[Interviews] Found interview date:', hasInterviewDate, 'in item:', item['Name of the Candidate'] || item.Name);
                }
                return !!hasInterviewDate;
            })
            .map((item, index) => {
                const rawDate = getRawDate(item);
                const parsedDate = parseCustomDate(rawDate);
                
                console.log('[Interviews] Processing:', item['Name of the Candidate'] || item.Name, 'Date:', rawDate, 'Parsed:', parsedDate);
                
                return {
                    name: item['Name of the Candidate'] || item.Name || item.name || 'Unknown',
                    email: item.Email || item.email,
                    role: item.Role || item.role || 'Not specified',
                    status: item.Status || item.status || 'Shortlisted',
                    round: item.Round || item.round || 'Round 1',
                    date: parsedDate ? formatDateToDDMMYYYY(parsedDate) : '',
                    time: extractTimeFromDate(rawDate) || 'Time not set',
                    link: item['Meeting Link'] || item['Meeting link'] || item.meetingLink || item['meeting link'] || '#',
                    cv: item.CV || item.cv,
                    score: item.Score || item.score,
                    log_id: item['Log ID'] || item['Log id'] || item.log_id || item['log id'],
                    row_id: item.ID || item.Id || item.id || item['Log ID'] || `row-${index}`,
                    linkedin: item.Linkedin || item.LinkedIn || item.linkedin,
                    date_iso: parsedDate ? formatDateToDDMMYYYY(parsedDate) : '',
                    contact: item['Contact Number'] || item['Contact number'] || item.contact || item['contact number'],
                    interviewType: item['Interview type'] || item['Interview Type'] || item['interview type'] || item.interviewType || 'Not specified',
                    id: item.ID || item.Id || item.id || item['Call ID'] || item['call_id'] || null,
                    callData: {
                        callId: item['Call ID'] || item['call_id'] || item.ID || item.Id || item.id || null,
                        duration: item['Call Duration'] || item['call_duration'] || item.duration || null,
                        recording: item['Call Recording'] || item['call_recording'] || item.Recording || item.recording || null,
                        status: item['Call Status'] || item['call_status'] || item.CallStatus || item.status || null,
                        notes: item['Call Notes'] || item['call_notes'] || item.Notes || item.notes || null,
                        feedback: item['Call Feedback'] || item['call_feedback'] || item.Feedback || item.feedback || null,
                        outcome: item['Call Outcome'] || item['call_outcome'] || item.Outcome || item.outcome || null,
                    },
                    full_details: item
                };
            });

        console.log('[Interviews] Formatted interviews:', formatted.length, 'items');
        setInterviews(formatted);
    }, [logData, events, sheetLoading, eventsLoading]);

    // Filter interviews
    const filteredInterviews = useMemo(() => {
        return interviews.filter(item => {
            const matchesSearch = !searchQuery ||
                item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.role?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDate = item.date_iso === selectedDate;
            return matchesSearch && matchesDate;
        });
    }, [interviews, searchQuery, selectedDate]);

    const loading = sheetLoading;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-4">
            <style>{datePickerStyles}</style>
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-xs sm:text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{filteredInterviews.length}</span> Interviews
                </div>
                <div className="flex-1 min-w-[200px]">
                    <ModernDatePicker 
                        selectedDate={selectedDate} 
                        onChange={setSelectedDate}
                        disablePast={false}
                    />
                </div>
                <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                    <button
                        onClick={() => setViewType('grid')}
                        className={`p-1.5 sm:p-2 rounded-lg transition-all ${viewType === 'grid' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                        onClick={() => setViewType('list')}
                        className={`p-1.5 sm:p-2 rounded-lg transition-all ${viewType === 'list' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            {filteredInterviews.length === 0 ? (
                <div className="p-12 text-center bg-gray-50 rounded-2xl border border-gray-200">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-500">No interviews scheduled for {selectedDate}</p>
                </div>
            ) : viewType === 'grid' ? (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredInterviews.map((interview) => (
                        <InterviewCard
                            key={interview.email}
                            interview={interview}
                            onSelect={setSelectedCandidate}
                            onReschedule={setRescheduleCandidate}
                            openDropdownId={openDropdownId}
                            setOpenDropdownId={setOpenDropdownId}
                        />
                    ))}
                </div>
            ) : (
                <InterviewList 
                    interviews={filteredInterviews}
                    onSelect={setSelectedCandidate}
                    onReschedule={setRescheduleCandidate}
                />
            )}

            {/* Candidate Modal */}
            {selectedCandidate && (
                <CandidateModal 
                    candidate={selectedCandidate} 
                    onClose={() => setSelectedCandidate(null)}
                />
            )}

            {/* Reschedule Modal */}
            {rescheduleCandidate && createPortal(
                <div
                    className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in"
                    onClick={() => { setRescheduleCandidate(null); setRescheduleDate(null); setCalendarOpen(false); }}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in border border-gray-200 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Gradient stripe */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-t-3xl" />

                        {/* Header */}
                        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-amber-500/30">
                                    <RefreshCw className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Reschedule Interview</h2>
                                    <p className="text-sm text-gray-500">{rescheduleCandidate.name} &bull; {rescheduleCandidate.role}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setRescheduleCandidate(null); setRescheduleDate(null); setCalendarOpen(false); }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-8 pb-4 space-y-5">
                            {/* Current schedule info */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Current Schedule</p>
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1.5 text-gray-700">
                                        <Calendar className="w-4 h-4 text-indigo-400" />
                                        <span className="font-semibold">{rescheduleCandidate.date || 'No date'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-700">
                                        <Clock className="w-4 h-4 text-indigo-400" />
                                        <span className="font-semibold">{rescheduleCandidate.time || 'No time'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* New Date & Time */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">New Date & Time</label>
                                <div className="reschedule-datepicker-container">
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                                        <input
                                            type="text"
                                            readOnly
                                            value={rescheduleDate ? new Date(rescheduleDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                                            placeholder="Select new date & time"
                                            onClick={() => setCalendarOpen(true)}
                                            className="w-full pl-10 pr-4 h-12 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm hover:border-gray-300 cursor-pointer text-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Interview Method */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Interview Method</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 'Google Meet', icon: Video, label: 'Google Meet' },
                                        { value: 'AI Call Agent', icon: Phone, label: 'AI Call Agent' }
                                    ].map((method) => (
                                        <button
                                            key={method.value}
                                            type="button"
                                            onClick={() => setRescheduleMethod(method.value)}
                                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 border-2 ${
                                                rescheduleMethod === method.value
                                                    ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm'
                                                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                                            }`}
                                        >
                                            <method.icon className="w-4 h-4" />
                                            {method.label}
                                            {rescheduleMethod === method.value && <Check className="w-4 h-4 ml-1" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                            <button
                                onClick={() => { setRescheduleCandidate(null); setRescheduleDate(null); setCalendarOpen(false); }}
                                className="flex-1 py-3 px-4 rounded-xl bg-white text-gray-500 border border-gray-200 font-bold hover:bg-gray-50 transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReschedule}
                                disabled={!rescheduleDate}
                                className={`flex-[2] py-3 px-4 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${
                                    rescheduleDate
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 active:scale-95'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reschedule Interview
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Calendar Portal for Reschedule */}
            {calendarOpen && createPortal(
                <div
                    className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
                    style={{ zIndex: 10001 }}
                    onClick={() => setCalendarOpen(false)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl p-4 animate-scale-up border border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DatePicker
                            selected={rescheduleDate}
                            onChange={(date) => setRescheduleDate(date)}
                            showTimeSelect
                            inline
                            calendarClassName="glass-datepicker"
                            minDate={new Date()}
                            filterDate={(date) => date.getDay() !== 0}
                            filterTime={(time) => {
                                const now = new Date();
                                if (!rescheduleDate) return true;
                                const isToday = rescheduleDate.toDateString() === now.toDateString();
                                if (!isToday) return true;
                                return time.getTime() >= now.getTime();
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setCalendarOpen(false)}
                            className="mt-4 w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-sm font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                        >
                            Confirm Date & Time
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* Webhook Response Modal */}
            {webhookResponse && createPortal(
                <div
                    className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in"
                    onClick={() => setWebhookResponse(null)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-scale-in border border-gray-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                            webhookResponse.success ? 'bg-emerald-100' : 'bg-rose-100'
                        }`}>
                            {webhookResponse.success
                                ? <CheckCircle className="w-8 h-8 text-emerald-600" />
                                : <X className="w-8 h-8 text-rose-600" />
                            }
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{webhookResponse.message}</h3>
                        <p className="text-sm text-gray-500 mb-6">{webhookResponse.summary}</p>
                        <button
                            onClick={() => setWebhookResponse(null)}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                                webhookResponse.success
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-rose-600 text-white hover:bg-rose-700'
                            }`}
                        >
                            Close
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

// Interview Card Component
const InterviewCard = React.memo(({ interview, onSelect, onReschedule, openDropdownId, setOpenDropdownId }) => {
    const scoreNum = parseInt(interview.score) || 0;
    const normalizedScore = scoreNum <= 10 ? scoreNum * 10 : scoreNum;
    const scoreColor = normalizedScore >= 80 ? 'bg-emerald-500' : normalizedScore >= 60 ? 'bg-indigo-500' : normalizedScore >= 40 ? 'bg-amber-500' : 'bg-slate-400';
    
    // Check if ID exists (column N)
    const hasCallData = interview.callData && (
        interview.callData.callId || 
        interview.callData.duration || 
        interview.callData.recording ||
        interview.callData.status ||
        interview.callData.notes ||
        interview.callData.feedback ||
        interview.callData.outcome
    );

    return (
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.1)] transition-all duration-300">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative shrink-0">
                    <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                        {interview.name.charAt(0).toUpperCase()}
                    </div>
                    {interview.score && (
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-md bg-slate-400 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                            {scoreNum}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-[15px] truncate">{interview.name}</h3>
                    <div className="flex items-center text-[13px] text-slate-500 mt-0.5 font-medium">
                        <Star className="w-3.5 h-3.5 mr-1.5 text-amber-400 fill-amber-400" />
                        <span className="truncate">{interview.role}</span>
                    </div>
                </div>
            </div>


            {/* Status */}
            <div className="mb-4">
                <StatusBadge status={interview.status} round={interview.round} />
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-5 text-[13px] font-medium text-slate-600">
                <div className="flex items-center bg-[#F8F9FA] px-3.5 py-3 rounded-xl border border-gray-50">
                    <Calendar className="w-4 h-4 mr-2 text-indigo-400" />
                    <span>{interview.date || 'No date'}</span>
                </div>
                <div className="flex items-center bg-[#F8F9FA] px-3.5 py-3 rounded-xl border border-gray-50">
                    <Clock className="w-4 h-4 mr-2 text-indigo-400" />
                    <span>{interview.time || 'No time'}</span>
                </div>
                {interview.contact && (
                    <div className="flex items-center bg-[#F8F9FA] px-3.5 py-3 rounded-xl col-span-2 border border-gray-50">
                        <Phone className="w-4 h-4 mr-2 text-emerald-400" />
                        <span>{interview.contact}</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={() => onSelect(interview)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-slate-700 text-[12px] font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                    <FileText className="w-3.5 h-3.5" />
                    Details
                </button>
                <button
                    onClick={() => onReschedule(interview)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#FFF9EA] border border-amber-200 text-amber-600 text-[12px] font-bold py-2.5 rounded-xl hover:bg-amber-50 transition-all active:scale-95"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reschedule
                </button>
                {interview.interviewType?.toLowerCase().includes('ai') ? (
                    <div className="flex-1 flex items-center justify-center gap-1.5 bg-[#EEF2FF] text-indigo-600 text-[12px] font-bold py-2.5 rounded-xl">
                        <Clock className="w-4 h-4" />
                        Scheduled
                    </div>
                ) : (
                    <a
                        href={interview.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#EEF2FF] text-indigo-600 text-[12px] font-bold py-2.5 rounded-xl hover:bg-indigo-100 transition-colors inline-block text-center"
                    >
                        Join
                    </a>
                )}
            </div>
        </div>
    );
});

// Interview List Component
const InterviewList = React.memo(({ interviews, onSelect, onReschedule }) => {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[900px]">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-widest font-bold">
                            <th className="px-6 py-4">Candidate</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Date & Time</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {interviews.map((interview) => (
                            <tr key={interview.email} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                                            {interview.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-gray-900">{interview.name}</p>
                                            <p className="text-xs text-gray-500">{interview.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-gray-900 max-w-[250px] truncate">{interview.role}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-gray-900">{interview.date}</p>
                                    <p className="text-xs text-gray-500">{interview.time}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                                        interview.interviewType?.toLowerCase().includes('ai')
                                            ? 'bg-purple-100 text-purple-700'
                                            : interview.interviewType?.toLowerCase().includes('not specified') || !interview.interviewType
                                                ? 'bg-gray-100 text-gray-600'
                                                : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {interview.interviewType || 'Not specified'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                                        interview.status?.toLowerCase().includes('shortlist') ? 'bg-emerald-100 text-emerald-700' : 
                                        interview.status?.toLowerCase().includes('reject') ? 'bg-rose-100 text-rose-700' : 
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                        {interview.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onSelect(interview)}
                                            className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            Details
                                        </button>
                                        <button
                                            onClick={() => onReschedule(interview)}
                                            className="px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                            Reschedule
                                        </button>
                                        {interview.interviewType?.toLowerCase().includes('ai') ? (
                                            <span className="px-3 py-1.5 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-lg">
                                                Scheduled
                                            </span>
                                        ) : (
                                            <a
                                                href={interview.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors inline-block"
                                            >
                                                Join
                                            </a>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

// Status Badge Component
const StatusBadge = ({ status, round }) => {
    const statusConfig = {
        shortlisted: { bg: 'bg-[#FFF9EA]', text: 'text-amber-600', dot: 'bg-amber-400' },
        rejected: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-400' },
        pending: { bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-400' }
    };
    
    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    
    // Format display text: "SHORTLISTED FOR ROUND 1"
    let displayText = status || 'Pending';
    if (status?.toLowerCase() === 'shortlisted' && round) {
        displayText = `${status} FOR ${round}`;
    }
    
    return (
        <div className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] text-[11px] font-bold uppercase tracking-wide ${config.bg} ${config.text}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            <span>{displayText}</span>
        </div>
    );
};

// Modern Date Picker Component
const ModernDatePicker = ({ selectedDate, onChange, disablePast = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
    const containerRef = useRef(null);

    const currentSelected = useMemo(() => {
        const [day, month, year] = selectedDate.split('/');
        return new Date(year, month - 1, day);
    }, [selectedDate]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setShowMonthYearPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    const getDaysInMonth = (year, month) => {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        const days = [];
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
        
        for (let i = adjustedFirstDay - 1; i >= 0; i--) {
            days.push({ day: daysInPrevMonth - i, currentMonth: false });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, currentMonth: true });
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, currentMonth: false });
        }
        return days;
    };

    const handleSelectDate = (day, isCurrentMonth) => {
        if (!isCurrentMonth) return;
        const year = currentSelected.getFullYear();
        const month = currentSelected.getMonth();
        onChange(`${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`);
        setIsOpen(false);
        setShowMonthYearPicker(false);
    };

    const goToToday = () => {
        const today = new Date();
        onChange(`${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`);
        setIsOpen(false);
        setShowMonthYearPicker(false);
    };

    const goToPrevMonth = () => {
        const newDate = new Date(currentSelected.getFullYear(), currentSelected.getMonth() - 1, currentSelected.getDate());
        onChange(`${String(newDate.getDate()).padStart(2, '0')}/${String(newDate.getMonth() + 1).padStart(2, '0')}/${newDate.getFullYear()}`);
    };

    const goToNextMonth = () => {
        const newDate = new Date(currentSelected.getFullYear(), currentSelected.getMonth() + 1, currentSelected.getDate());
        onChange(`${String(newDate.getDate()).padStart(2, '0')}/${String(newDate.getMonth() + 1).padStart(2, '0')}/${newDate.getFullYear()}`);
    };

    const goToPrevYear = () => {
        const newDate = new Date(currentSelected.getFullYear() - 1, currentSelected.getMonth(), currentSelected.getDate());
        onChange(`${String(newDate.getDate()).padStart(2, '0')}/${String(newDate.getMonth() + 1).padStart(2, '0')}/${newDate.getFullYear()}`);
    };

    const goToNextYear = () => {
        const newDate = new Date(currentSelected.getFullYear() + 1, currentSelected.getMonth(), currentSelected.getDate());
        onChange(`${String(newDate.getDate()).padStart(2, '0')}/${String(newDate.getMonth() + 1).padStart(2, '0')}/${newDate.getFullYear()}`);
    };

    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() && currentSelected.getMonth() === today.getMonth() && currentSelected.getFullYear() === today.getFullYear();
    };

    const isPastDate = (day) => {
        if (!disablePast) return false;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dateToCheck = new Date(currentSelected.getFullYear(), currentSelected.getMonth(), day);
        return dateToCheck < today;
    };

    const isSelected = (day) => {
        return day === currentSelected.getDate();
    };

    const days = getDaysInMonth(currentSelected.getFullYear(), currentSelected.getMonth());
    const years = Array.from({ length: 21 }, (_, i) => currentSelected.getFullYear() - 10 + i);

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => { setIsOpen(!isOpen); setShowMonthYearPicker(false); }}
                className="flex items-center justify-between gap-2 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] shadow-sm"
            >
                <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-700">{selectedDate}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl shadow-gray-200/80 border border-gray-200 p-4 w-[280px]">
                    {showMonthYearPicker ? (
                        /* Month/Year Picker */
                        <div className="animate-fade-in">
                            {/* Year Navigation */}
                            <div className="flex items-center justify-between mb-3">
                                <button onClick={goToPrevYear} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                                </button>
                                <span className="text-sm font-semibold text-gray-800">{currentSelected.getFullYear()}</span>
                                <button onClick={goToNextYear} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                            {/* Month Grid */}
                            <div className="grid grid-cols-3 gap-2">
                                {monthNames.map((name, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            const newDate = new Date(currentSelected.getFullYear(), idx, 1);
                                            const maxDay = new Date(idx + 1 === 12 ? currentSelected.getFullYear() + 1 : currentSelected.getFullYear(), (idx + 1) % 12, 0).getDate();
                                            const day = Math.min(currentSelected.getDate(), maxDay);
                                            onChange(`${String(day).padStart(2, '0')}/${String(idx + 1).padStart(2, '0')}/${newDate.getFullYear()}`);
                                            setShowMonthYearPicker(false);
                                        }}
                                        className={`py-2.5 text-xs font-medium rounded-lg transition-all ${
                                            idx === currentSelected.getMonth()
                                                ? 'bg-[#6366f1] text-white'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        {shortMonthNames[idx]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Calendar View */
                        <div className="animate-fade-in">
                            {/* Month/Year Header */}
                            <div className="flex items-center justify-between mb-4">
                                <button onClick={goToPrevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                </button>
                                <button 
                                    onClick={() => setShowMonthYearPicker(true)}
                                    className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <span className="text-sm font-semibold text-gray-800">
                                        {monthNames[currentSelected.getMonth()]}, {currentSelected.getFullYear()}
                                    </span>
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                                <button onClick={goToNextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>

                            {/* Day Names */}
                            <div className="grid grid-cols-7 gap-0 mb-2">
                                {dayNames.map(day => (
                                    <div key={day} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-1">{day}</div>
                                ))}
                            </div>

                            {/* Days Grid */}
                            <div className="grid grid-cols-7 gap-0">
                                {days.map((dayObj, idx) => {
                                    const disabled = !dayObj.currentMonth || isPastDate(dayObj.day);
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectDate(dayObj.day, dayObj.currentMonth)}
                                            disabled={disabled}
                                            className={`
                                                h-9 w-9 flex items-center justify-center text-sm rounded-full transition-all mx-auto
                                                ${disabled ? 'text-gray-300 cursor-default' : 'hover:bg-gray-100 cursor-pointer'}
                                                ${isSelected(dayObj.day) && dayObj.currentMonth ? 'bg-[#6366f1] text-white font-semibold shadow-md shadow-indigo-200' : ''}
                                                ${isToday(dayObj.day) && !isSelected(dayObj.day) && dayObj.currentMonth ? 'text-[#6366f1] font-medium bg-indigo-50' : ''}
                                                ${dayObj.currentMonth && !isSelected(dayObj.day) && !isToday(dayObj.day) && !isPastDate(dayObj.day) ? 'text-gray-700' : ''}
                                            `}
                                        >
                                            {dayObj.day}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Footer Actions */}
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                <button 
                                    onClick={() => onChange('')}
                                    className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    Clear
                                </button>
                                <button 
                                    onClick={goToToday}
                                    className="px-4 py-2 text-xs font-medium text-white bg-[#6366f1] hover:bg-[#4f46e5] rounded-lg transition-colors shadow-sm"
                                >
                                    Today
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Candidate Modal Component - Uses shared popup
const CandidateModal = ({ candidate, onClose }) => {
    // Map interview data to the shared popup format
    const mappedData = {
        'Name of the Candidate': candidate.name,
        Email: candidate.email,
        Role: candidate.role,
        Status: candidate.status,
        Score: candidate.score,
        'Contact Number': candidate.contact,
        Summary: candidate.full_details?.Summary || '',
        CV: candidate.full_details?.CV || candidate.cv,
        'Interview date': `${candidate.date} ${candidate.time}`,
        'Interview type': candidate.interviewType,
        'Meeting link': candidate.link,
        // Call data from full_details
        'Call status': candidate.full_details?.['Call status'] || candidate.callData?.status || '',
        'call summary': candidate.full_details?.['call summary'] || '',
        'fullConvertion': candidate.full_details?.['fullConvertion'] || '',
        'recording URL': candidate.full_details?.['recording URL'] || candidate.callData?.recording || '',
    };

    return (
        <CandidateDetailPopup 
            data={mappedData}
            onClose={onClose}
        />
    );
};

export default Interviews;
