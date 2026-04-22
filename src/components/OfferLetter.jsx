import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Printer, User, Building, Briefcase, Calendar, MapPin, Phone, Mail, FileText, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CalendarDays } from 'lucide-react';

// Modern Date Picker Component
const ModernDatePicker = ({ selectedDate, onChange, placeholder = "Select date", disablePast = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);

    const currentSelected = useMemo(() => {
        if (!selectedDate) return new Date();
        const d = new Date(selectedDate);
        return isNaN(d.getTime()) ? new Date() : d;
    }, [selectedDate]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            const clickedInContainer = containerRef.current && containerRef.current.contains(e.target);
            const clickedInDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
            if (!clickedInContainer && !clickedInDropdown) {
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
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onChange({ target: { name: '', value: dateStr } });
        setIsOpen(false);
        setShowMonthYearPicker(false);
    };

    const goToToday = () => {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        onChange({ target: { name: '', value: dateStr } });
        setIsOpen(false);
        setShowMonthYearPicker(false);
    };

    const goToPrevMonth = () => {
        const newDate = new Date(currentSelected.getFullYear(), currentSelected.getMonth() - 1, currentSelected.getDate());
        const dateStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
        onChange({ target: { name: '', value: dateStr } });
    };

    const goToNextMonth = () => {
        const newDate = new Date(currentSelected.getFullYear(), currentSelected.getMonth() + 1, currentSelected.getDate());
        const dateStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
        onChange({ target: { name: '', value: dateStr } });
    };

    const goToPrevYear = () => {
        const newDate = new Date(currentSelected.getFullYear() - 1, currentSelected.getMonth(), currentSelected.getDate());
        const dateStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
        onChange({ target: { name: '', value: dateStr } });
    };

    const goToNextYear = () => {
        const newDate = new Date(currentSelected.getFullYear() + 1, currentSelected.getMonth(), currentSelected.getDate());
        const dateStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
        onChange({ target: { name: '', value: dateStr } });
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
        return selectedDate && day === currentSelected.getDate();
    };

    const days = getDaysInMonth(currentSelected.getFullYear(), currentSelected.getMonth());
    const years = Array.from({ length: 21 }, (_, i) => currentSelected.getFullYear() - 10 + i);

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const buttonRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX
            });
        }
    }, [isOpen]);

    const dropdownContent = isOpen && createPortal(
        <div 
            ref={dropdownRef}
            className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-[280px]"
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
        >
            {showMonthYearPicker ? (
                <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                        <button type="button" onClick={goToPrevYear} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <ChevronLeft className="w-4 h-4 text-gray-500" />
                        </button>
                        <span className="text-sm font-semibold text-gray-800">{currentSelected.getFullYear()}</span>
                        <button type="button" onClick={goToNextYear} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {monthNames.map((name, idx) => (
                            <button
                                type="button"
                                key={idx}
                                onClick={() => {
                                    const newDate = new Date(currentSelected.getFullYear(), idx, 1);
                                    const maxDay = new Date(idx + 1 === 12 ? currentSelected.getFullYear() + 1 : currentSelected.getFullYear(), (idx + 1) % 12, 0).getDate();
                                    const day = Math.min(currentSelected.getDate(), maxDay);
                                    const dateStr = `${newDate.getFullYear()}-${String(idx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    onChange({ target: { name: '', value: dateStr } });
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
                <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={goToPrevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                        </button>
                        <button 
                            type="button"
                            onClick={() => setShowMonthYearPicker(true)}
                            className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <span className="text-sm font-semibold text-gray-800">
                                {monthNames[currentSelected.getMonth()]}, {currentSelected.getFullYear()}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        <button type="button" onClick={goToNextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-0 mb-2">
                        {dayNames.map(day => (
                            <div key={day} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-1">{day}</div>
                        ))}
                    </div>

                            <div className="grid grid-cols-7 gap-0">
                                {days.map((dayObj, idx) => {
                                    const disabled = !dayObj.currentMonth || isPastDate(dayObj.day);
                                    return (
                                        <button
                                            type="button"
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

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <button 
                            type="button"
                            onClick={() => onChange({ target: { name: '', value: '' } })}
                            className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Clear
                        </button>
                        <button 
                            type="button"
                            onClick={goToToday}
                            className="px-4 py-2 text-xs font-medium text-white bg-[#6366f1] hover:bg-[#4f46e5] rounded-lg transition-colors shadow-sm"
                        >
                            Today
                        </button>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );

    return (
        <div ref={containerRef} className="relative">
            <button
                ref={buttonRef}
                type="button"
                onClick={() => { setIsOpen(!isOpen); setShowMonthYearPicker(false); }}
                className="w-full py-2.5 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all flex items-center justify-between"
            >
                <div className="flex items-center gap-1.5 min-w-0">
                    <CalendarDays className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className={`truncate ${selectedDate ? 'text-gray-700' : 'text-gray-400'}`}>
                        {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
                    </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownContent}
        </div>
    );
};

// Modern Select Component
const ModernSelect = ({ name, value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (optionValue) => {
        onChange({ target: { name, value: optionValue } });
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-2.5 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all flex items-center justify-between appearance-none cursor-pointer"
            >
                <span className="truncate">{selectedOption?.label || value}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl shadow-gray-200/80 border border-gray-200 py-1 w-full min-w-[120px] animate-fade-in">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                                value === option.value
                                    ? 'bg-[#6366f1] text-white'
                                    : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const getOrdinalNum = (n) => {
    return n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
};

const formatDateWithOrdinal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    const day = getOrdinalNum(d.getDate());
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
};

const formatDotDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
};

const OfferLetter = () => {
    const [formData, setFormData] = useState({
        title: 'Mr.',
        candidateName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        district: '',
        state: 'Gujarat',
        pin: '',
        mobile: '',
        email: '',
        role: '',
        location: '',
        managerName: '',
        managerRole: '',
        joiningDate: '',
        returnDate: '',
        companyName: "Agrocel Industries Pvt. Ltd.",
        documentCode: 'CF:HRM:F:017',
        signatoryName: '',
        signatoryRole: 'General Manager-HR',
        dateOfLetter: new Date().toISOString().split('T')[0],
    });

    const letterRef = useRef();

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'companyName') {
            const code = value === 'Solaris Chemtech Industries Ltd.'
                ? 'F-HR17/00/01/04/2021'
                : 'CF:HRM:F:017';
            setFormData(prev => ({
                ...prev,
                companyName: value,
                documentCode: code
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const firstName = formData.candidateName.split(' ')[0] || '[First Name]';
    const fullName = formData.candidateName || '[Candidate Name]';

    return (
        <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-theme(spacing.24))] gap-8 animate-fade-in pb-8">
            {/* Left Side: Controls - Dark Theme */}
            <div className="w-full lg:w-5/12 glass-card rounded-3xl border border-[var(--border-color)] flex flex-col overflow-hidden print:hidden relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative z-10">

                    {/* Company Details */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ml-1">Company Details</label>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 ml-1">Company Entity</label>
                                <ModernSelect
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'Agrocel Industries Pvt. Ltd.', label: 'Agrocel Industries Pvt. Ltd.' },
                                        { value: 'Solaris Chemtech Industries Ltd.', label: 'Solaris Chemtech Industries Ltd.' }
                                    ]}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 ml-1">Letter Date</label>
                                    <ModernDatePicker 
                                        selectedDate={formData.dateOfLetter} 
                                        onChange={(e) => handleInputChange({ target: { name: 'dateOfLetter', value: e.target.value } })}
                                        placeholder="Select letter date"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5"></div>

                    {/* Candidate Identity */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ml-1">Candidate Details</label>
                        <div className="grid grid-cols-12 gap-4 mb-4">
                            <div className="col-span-3">
                                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 ml-1">Title</label>
                                <ModernSelect
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'Mr.', label: 'Mr.' },
                                        { value: 'Ms.', label: 'Ms.' },
                                        { value: 'Mrs.', label: 'Mrs.' }
                                    ]}
                                />
                            </div>
                            <div className="col-span-9">
                                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 ml-1">Full Name</label>
                                <input type="text" name="candidateName" value={formData.candidateName} onChange={handleInputChange} placeholder="e.g. Poonam Raj Barmeda" className="input-field w-full py-2.5 px-4 text-sm" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 ml-1">Mobile No.</label>
                                <input type="text" name="mobile" value={formData.mobile} onChange={handleInputChange} className="input-field w-full py-2.5 px-4 text-sm" placeholder="e.g. 9978167819" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 ml-1">Email ID</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="input-field w-full py-2.5 px-4 text-sm" placeholder="e.g. candidate@email.com" />
                            </div>
                        </div>

                        {/* Address */}
                        <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 ml-1 mt-6">Residential Address</label>
                        <div className="space-y-4">
                            <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} placeholder="Line 1 (e.g. Ho. No. 183, Swaminarayan Nagar- 2)" className="input-field w-full py-2.5 px-4 text-sm" />
                            <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} placeholder="Line 2 (e.g. Near Ravalwadi Relocation)" className="input-field w-full py-2.5 px-4 text-sm" />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="City (e.g. Bhuj)" className="input-field w-full py-2.5 px-4 text-sm" />
                                <input type="text" name="district" value={formData.district} onChange={handleInputChange} placeholder="District (e.g. Kutch)" className="input-field w-full py-2.5 px-4 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" name="state" value={formData.state} onChange={handleInputChange} placeholder="State (e.g. Gujarat)" className="input-field w-full py-2.5 px-4 text-sm" />
                                <input type="text" name="pin" value={formData.pin} onChange={handleInputChange} placeholder="PIN Code" className="input-field w-full py-2.5 px-4 text-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5"></div>

                    {/* Role & Offer Details */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ml-1">Offer Specifics</label>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 ml-1">Role / Designation</label>
                                    <input type="text" name="role" value={formData.role} onChange={handleInputChange} className="input-field w-full py-2.5 px-4 text-sm" placeholder="e.g. Deputy Manager - Accounts and Finance" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 ml-1">Work Location</label>
                                    <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="input-field w-full py-2.5 px-4 text-sm" placeholder="e.g. Corporate Office Bhujodi" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 ml-1">Manager Name</label>
                                    <input type="text" name="managerName" value={formData.managerName} onChange={handleInputChange} className="input-field w-full py-2.5 px-4 text-sm" placeholder="e.g. Mr. Pritesh Solanki" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 ml-1">Manager Role</label>
                                    <input type="text" name="managerRole" value={formData.managerRole} onChange={handleInputChange} className="input-field w-full py-2.5 px-4 text-sm" placeholder="e.g. General Manager - Accounts and Finance" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 ml-1">Joining Date (Max)</label>
                                    <ModernDatePicker 
                                        selectedDate={formData.joiningDate} 
                                        onChange={(e) => handleInputChange({ target: { name: 'joiningDate', value: e.target.value } })}
                                        placeholder="Select joining date"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 ml-1">Return Signed Copy By</label>
                                    <ModernDatePicker 
                                        selectedDate={formData.returnDate} 
                                        onChange={(e) => handleInputChange({ target: { name: 'returnDate', value: e.target.value } })}
                                        placeholder="Select return date"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5"></div>

                    {/* Signatory Details */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ml-1">Signatory Details</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 ml-1">Signatory Name</label>
                                <input type="text" name="signatoryName" value={formData.signatoryName} onChange={handleInputChange} className="input-field w-full py-2.5 px-4 text-sm" placeholder="e.g. Ruchir R. Someshwar" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 ml-1">Signatory Role</label>
                                <input type="text" name="signatoryRole" value={formData.signatoryRole} onChange={handleInputChange} className="input-field w-full py-2.5 px-4 text-sm" placeholder="e.g. General Manager-HR" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/30 relative z-10">
                    <button
                        onClick={handlePrint}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold tracking-wide transition-colors flex items-center justify-center border border-slate-700 shadow-xl shadow-black/20"
                    >
                        <Printer className="w-5 h-5 mr-3" />
                        Print / Save as PDF
                    </button>
                </div>
            </div>

            {/* Right Side: Preview */}
            <div className="flex-1 bg-slate-200 rounded-3xl overflow-hidden flex flex-col relative print:bg-white print:overflow-visible shadow-inner">
                <div className="flex-1 overflow-y-auto p-4 md:p-12 flex justify-center custom-scrollbar print:p-0 print:overflow-visible">

                    {/* A4 Paper Container */}
                    <div
                        ref={letterRef}
                        className="bg-white w-[210mm] h-[297mm] overflow-hidden shadow-2xl relative flex flex-col print:shadow-none print:w-full font-sans text-black"
                        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                    >
                        {/* Print-safe Letterhead Background */}
                        <img
                            src={formData.companyName === 'Agrocel Industries Pvt. Ltd.' ? '/agrocel_letterhead.jpg' : '/solaris_letterhead.jpg'}
                            alt="Letterhead Background"
                            className="absolute inset-0 w-full h-full object-fill z-0 pointer-events-none"
                        />

                        {/* Page Content padding margins */}
                        <div className="px-[20mm] pt-[55mm] pb-[60mm] flex-1 text-[8.5pt] leading-[1.25] flex flex-col relative z-10">

                            {/* Header / Date / Doc Code */}
                            <div className="flex justify-end mb-3 relative">
                                <div className="text-right">
                                    <p className="whitespace-pre-wrap tracking-wide font-medium">
                                        {formData.documentCode}
                                    </p>
                                    <p className="font-bold mt-1 text-[8.5pt]">{formatDateWithOrdinal(formData.dateOfLetter)}</p>
                                </div>
                            </div>

                            {/* Recipient Details */}
                            <div className="mb-3 font-bold text-[8.5pt] leading-snug">
                                <p>To,</p>
                                <p>{formData.title} {fullName}</p>
                                {formData.addressLine1 && <p>{formData.addressLine1}</p>}
                                {formData.addressLine2 && <p>{formData.addressLine2}</p>}
                                <p>
                                    {formData.city}{formData.city && formData.district && ', '}
                                    {formData.district && `Dist: ${formData.district}`}{(formData.city || formData.district) && formData.state && ', '}
                                    {formData.state}.
                                </p>
                                {formData.pin && <p>Pin: {formData.pin}</p>}
                                {formData.mobile && <p>Mob: {formData.mobile}</p>}
                                {formData.email && (
                                    <p>
                                        Email: <span className="text-blue-600 underline font-normal">{formData.email}</span>
                                    </p>
                                )}
                            </div>

                            {/* Salutation */}
                            <div className="mb-3">
                                <p>Dear <b>{formData.title} {firstName}</b>,</p>
                            </div>

                            {/* Subject */}
                            <div className="mb-3 text-center font-bold">
                                <p className="underline underline-offset-2 decoration-1">
                                    Sub: - Offer letter for the post of {formData.role || '[Role]'} at {formData.location || '[Location]'} {formData.companyName === 'Solaris Chemtech Industries Ltd.' ? 'Location.' : ''}
                                </p>
                            </div>

                            {/* Body Paragraphs */}
                            <div className="space-y-2 text-justify" style={{ wordSpacing: '1px' }}>
                                <p>
                                    This refers to your application for employment and the subsequent discussions you had with us. We are pleased to inform you that you have met our selection criteria and send you this offer of employment with our organization as <b>{formData.role || '[Role]'}</b>. You will be based at <b>{formData.location || '[Location]'}</b>{formData.companyName === 'Solaris Chemtech Industries Ltd.' ? ' Location' : ''}. You will be reporting functionally to <b>{formData.managerName || '[Manager Name]'} - {formData.managerRole || '[Manager Role]'}</b>, initially for 6 months you will be on probation.
                                </p>

                                <p>
                                    <b>Annual Package:</b> You will be paid annual CTC discussed & mutually decided, you will be given a detailed appointment letter with specific terms and conditions of employment and annual breakup of CTC at the time of joining.
                                </p>

                                <div className="pl-6 space-y-1 my-2 text-justify">
                                    <p className="pl-4 -indent-4">1.&nbsp;&nbsp;&nbsp;&nbsp;<b>Joining:</b> Your joining date will be on or before <b>{formatDotDate(formData.joiningDate) || '[DD.MM.YYYY]'}</b>.</p>
                                    <p className="pl-4 -indent-4">2.&nbsp;&nbsp;&nbsp;&nbsp;<b>Medical checkup:</b> You are required to undergo for a pre-employment medical checkup as per attached. This offer is subject to your positive medical fitness certificate.</p>
                                </div>

                                <p>
                                    This offer is subject to our receiving appropriate response to the reference checks and for this purpose, we request you to provide us contact details of two of your professional references.
                                </p>

                                <p>
                                    As a part of our recruitment procedure, you are requested to furnish the testimonials along with acceptance of offer as per the list attached.
                                </p>

                                <p>
                                    Kindly sign the duplicate copy of this offer letter as an acknowledgement and return to us before <b>{formatDotDate(formData.returnDate) || '[DD.MM.YYYY]'}</b> and resignation accepted copy of current organization within 07 days of acceptance of this letter, failing which this offer shall stand withdrawn.
                                </p>

                                <p>
                                    Appointment Letter with all the other terms and conditions will be issued to you at the time of joining.
                                </p>

                                <p>
                                    We congratulate you and look forward to having you on board.
                                </p>
                            </div>

                            {/* Signatures / Footer */}
                            <div className="mt-auto flex justify-between font-bold" style={{ paddingTop: '10px' }}>
                                <div className="flex flex-col">
                                    <p>For {formData.companyName}</p>
                                    <div className="mt-8">
                                        <p>({formData.signatoryName || '[Signatory Name]'})</p>
                                        <p>{formData.signatoryRole || '[Signatory Role]'}</p>
                                        <p className="mt-2 flex items-end">
                                            Prepared By: H.R. Dept.: <span className="inline-block border-b border-black w-24 ml-2"></span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col text-center" style={{ marginRight: formData.companyName === 'Solaris Chemtech Industries Ltd.' ? '0' : '40px' }}>
                                    <p>All above agreed & accepted.</p>
                                    <div className="mt-8 relative">
                                        <p>({fullName})</p>
                                        <p>Candidate</p>
                                    </div>
                                </div>
                            </div>

                            {/* Empty space at bottom to push content correctly */}
                            <div className="h-0"></div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { margin: 0; size: A4 portrait; }
                    body { background: white; }
                    body * { visibility: hidden; }
                    
                    /* Hide scrollbars during print */
                    ::-webkit-scrollbar { display: none; }
                    
                    /* Override styles for printing */
                    .print\\:bg-white { background-color: white !important; }
                    .print\\:shadow-none { box-shadow: none !important; border: none !important; }
                    .print\\:overflow-visible { overflow: visible !important; }
                    .print\\:w-full { width: 100% !important; max-width: 100% !important; }
                    .print\\:h-auto { height: auto !important; max-height: none !important; }
                    .print\\:hidden { display: none !important; }
                    
                    /* Specifically show the letter content */
                    div:has(> .print\\:shadow-none), 
                    div:has(> .print\\:shadow-none) * {
                        visibility: visible;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    /* Position the letter exactly on the physical page */
                    div:has(> .print\\:shadow-none) {
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* Important: Reset the inner letter transform completely */
                    .transform { transform: none !important; }
                    .hover\\:scale-\\[1\\.01\\]:hover { transform: none !important; }
                }
            `}</style>
        </div>
    );
};

export default OfferLetter;
