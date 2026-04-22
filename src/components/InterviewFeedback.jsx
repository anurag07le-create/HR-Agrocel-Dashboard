import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Send, User, Mail, MessageSquare, Loader2, Calendar, ChevronDown, Check } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { WEBHOOK_URLS } from '../config';
import { useLoading } from '../context/LoadingContext';
import { useToast } from '../context/ToastContext';

const CustomDropdown = ({ label, options, value, onChange, name, placeholder = "Select an option", icon: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef(null);

    React.useEffect(() => {
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
        <div className={`relative group ${isOpen ? 'z-[100]' : 'z-20'}`} ref={dropdownRef}>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 ml-1">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full ${DisplayIcon ? 'pl-9' : 'pl-3'} pr-8 h-11 text-left bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:border-purple-500 flex items-center justify-between transition-all duration-200 text-sm ${isOpen ? 'ring-2 ring-purple-500 border-transparent bg-white' : ''}`}
            >
                {DisplayIcon && <DisplayIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none z-10" />}
                <span className={!selectedOption ? 'text-gray-500' : ''}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[100] w-full mt-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xl overflow-hidden animate-fade-in-up">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={`w-full px-4 py-2.5 text-sm font-bold text-left flex items-center gap-3 rounded-xl transition-all ${value === option.value ? 'bg-[var(--hover-bg)] text-purple-400' : 'text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'}`}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    {option.icon ? (
                                        <option.icon className={`w-5 h-5 ${value === option.value ? 'text-purple-400' : 'text-gray-500'}`} />
                                    ) : DisplayIcon ? (
                                        <div className="w-5 h-5" /> // Spacer for alignment
                                    ) : null}
                                    <span>{option.label}</span>
                                </div>
                                {value === option.value && <Check className="h-4 w-4" />}
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
    /* Time Column */
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
    /* Navigation Arrows */
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
    /* Hide triangle globally */
    .react-datepicker-popper .react-datepicker__triangle {
        display: none !important;
    }
`;

const InterviewFeedback = () => {
    const { startLoading, stopLoading } = useLoading();
    const { success, error: showError, info } = useToast();
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [formData, setFormData] = useState({
        candidateName: '',
        email: '',
        round: 'First Round',
        status: 'Pending',
        joiningDate: '',
        interview_method: 'Google Meet',
        feedback: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        info('Processing...', 'Saving candidate evaluation in background.', 2000);
        const payload = { ...formData };
        if (payload.joiningDate) {
            const date = new Date(payload.joiningDate);
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            const dayName = days[date.getDay()];
            const day = date.getDate();
            const month = months[date.getMonth()];
            const year = date.getFullYear();

            let hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12;

            payload.joiningDate = `${dayName}, ${day} ${month} ${year} at ${hours}:${minutes}:00 ${ampm} IST`;
        }

        try {
            const response = await fetch(WEBHOOK_URLS.INTERVIEW_FEEDBACK, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                success('Feedback Submitted', 'Candidate feedback saved successfully!');
                setFormData({ candidateName: '', email: '', round: 'First Round', status: 'Pending', joiningDate: '', interview_method: 'Google Meet', feedback: '' });
            } else {
                showError('Submission Failed', 'Failed to submit feedback. Please try again.');
            }
        } catch (err) {
            console.error('Error submitting form:', err);
            showError('Error', 'An error occurred while submitting feedback.');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-4 animate-fade-in min-h-[calc(100vh-180px)]">
            <style>{datePickerStyles}</style>
            <div className="glass-card rounded-2xl p-4 md:p-6 relative border border-[var(--border-color)] flex flex-col">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 rounded-t-2xl"></div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 ml-1">Candidate Name</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-4 w-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                name="candidateName"
                                value={formData.candidateName}
                                onChange={handleInputChange}
                                required
                                className="input-field w-full pl-10 h-11 bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-gray-500 focus:border-purple-500 text-sm"
                                placeholder="Enter full name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 ml-1">Candidate Email</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-4 w-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                className="input-field w-full pl-10 h-11 bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-gray-500 focus:border-purple-500 text-sm"
                                placeholder="candidate@example.com"
                            />
                        </div>
                    </div>

                    <div className="relative z-50">
                        <CustomDropdown
                            label="Interview Round"
                            name="round"
                            value={formData.round}
                            onChange={handleInputChange}
                            options={[
                                { value: 'First Round', label: 'First Round' },
                                { value: 'Second Round', label: 'Second Round' }
                            ]}
                        />
                    </div>

                    <div className="relative z-40">
                        <CustomDropdown
                            label="Decision Status"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            options={[
                                { value: 'Pending', label: 'Pending' },
                                { value: 'Selected', label: 'Selected' },
                                { value: 'Rejected', label: 'Rejected' }
                            ]}
                        />
                    </div>

                    {formData.status === 'Selected' && (formData.round === 'First Round' || formData.round === 'Second Round') && (
                        <>
                            <div className="animate-fade-in">
                                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 ml-1">
                                    {formData.round === 'First Round' ? 'Second Round Date & Time' : 'Joining Date & Time'}
                                </label>
                                <div className="relative group custom-datepicker-container">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                                        <Calendar className="h-4 w-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        readOnly
                                        value={formData.joiningDate ? (() => { const d = new Date(formData.joiningDate); const day = String(d.getDate()).padStart(2, '0'); const month = String(d.getMonth() + 1).padStart(2, '0'); const year = d.getFullYear(); const hours = String(d.getHours()).padStart(2, '0'); const minutes = String(d.getMinutes()).padStart(2, '0'); return `${day}/${month}/${year} ${hours}:${minutes}`; })() : ''}
                                        placeholder="Select Date & Time"
                                        onClick={() => setCalendarOpen(true)}
                                        className="w-full pl-9 pr-3 h-11 bg-white border border-[var(--border-color)] text-gray-900 placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all shadow-sm hover:bg-white cursor-pointer text-sm"
                                    />
                                </div>
                            </div>

                            {/* Calendar Modal */}
                            {calendarOpen && createPortal(
                                <div
                                    className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
                                    style={{ zIndex: 9999 }}
                                    onClick={() => setCalendarOpen(false)}
                                >
                                    <div
                                        className="bg-white rounded-3xl shadow-2xl p-4 animate-scale-up border border-slate-200"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <DatePicker
                                            selected={formData.joiningDate ? new Date(formData.joiningDate) : null}
                                            onChange={(date) => {
                                                handleInputChange({ target: { name: 'joiningDate', value: date } });
                                            }}
                                            showTimeSelect
                                            inline
                                            calendarClassName="glass-datepicker"
                                            minDate={new Date()}
                                            filterTime={(time) => {
                                                const now = new Date();
                                                const selected = formData.joiningDate ? new Date(formData.joiningDate) : null;
                                                if (!selected) return true;
                                                const isToday = selected.toDateString() === now.toDateString();
                                                if (!isToday) return true;
                                                return time.getTime() >= now.getTime();
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setCalendarOpen(false)}
                                            className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                                        >
                                            Confirm Date & Time
                                        </button>
                                    </div>
                                </div>,
                                document.body
                            )}
                        </>
                    )}

                    {formData.status === 'Selected' && formData.round === 'First Round' && (
                        <div className="animate-fade-in">
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 ml-1">Interview Method</label>
                            <div className="w-full pl-4 pr-10 h-11 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center">
                                <span className="font-semibold text-sm">Google Meet</span>
                            </div>
                        </div>
                    )}

<div className="md:col-span-3 relative z-10 flex-1 flex flex-col">
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 ml-1">Feedback & Comments</label>
                        <div className="relative group flex-1 flex flex-col">
                            <div className="absolute top-3 left-3 pointer-events-none">
                                <MessageSquare className="h-4 w-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                            </div>
<textarea
                                name="feedback"
                                value={formData.feedback}
                                onChange={handleInputChange}
                                required
                                rows={8}
                                className="input-field w-full pl-10 py-2 resize-none bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-gray-500 focus:border-purple-500 text-sm flex-1 min-h-[200px]"
                                placeholder="Provide detailed feedback about the candidate's performance, strengths, and areas for improvement..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full flex items-center justify-center py-3 text-base font-semibold rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-black/10 bg-black hover:bg-gray-900 text-white border-none md:col-span-3"
                    >
                        <Send className="w-5 h-5 mr-2" />
                        Submit Feedback
                    </button>
                </form>
            </div >
        </div >
    );
};

export default InterviewFeedback;
