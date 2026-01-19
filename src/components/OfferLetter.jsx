import React, { useState, useRef } from 'react';
import { Printer, Download, RefreshCw, Type, Calendar, DollarSign, User, Building, Briefcase, FileText, Sparkles, Upload } from 'lucide-react';
import defaultLogo from '../assets/enkindle_logo.png';

const OfferLetter = () => {
    const [formData, setFormData] = useState({
        candidateName: '',
        role: '',
        companyName: "Let's Enkindle",
        joiningDate: '',
        salary: '',
        signatoryName: 'Rosa Maria Aguado',
        signatoryRole: 'Head of Creative Operations',
        dateOfLetter: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        logo: defaultLogo
    });

    const letterRef = useRef();
    const fileInputRef = useRef(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const logoUrl = URL.createObjectURL(file);
            setFormData(prev => ({
                ...prev,
                logo: logoUrl
            }));
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-theme(spacing.24))] gap-8 animate-fade-in pb-8">
            {/* Left Side: Controls - Dark Theme */}
            <div className="w-full lg:w-5/12 glass-card rounded-3xl border border-[var(--border-color)] flex flex-col overflow-hidden print:hidden relative group">
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

                <div className="p-8 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/30 relative z-10">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg shadow-lg shadow-purple-500/20">
                            <Type className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                            Letter Details
                        </h2>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm ml-12">Customize the offer letter content</p>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar relative z-10">
                    <div className="space-y-8">
                        <div>
                            <label className="block text-xs font-bold text-purple-400 uppercase tracking-wider mb-4 ml-1">Candidate Info</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Candidate Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            name="candidateName"
                                            value={formData.candidateName}
                                            onChange={handleInputChange}
                                            className="input-field pl-12 w-full"
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Role Title</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Briefcase className="h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            name="role"
                                            value={formData.role}
                                            onChange={handleInputChange}
                                            className="input-field pl-12 w-full"
                                            placeholder="e.g. Senior Designer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-white/10"></div>

                        <div>
                            <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 ml-1">Offer Details</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Joining Date</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Calendar className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                                        </div>
                                        <input
                                            type="date"
                                            name="joiningDate"
                                            value={formData.joiningDate}
                                            onChange={handleInputChange}
                                            className="input-field pl-12 w-full"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Salary</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <DollarSign className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            name="salary"
                                            value={formData.salary}
                                            onChange={handleInputChange}
                                            className="input-field pl-12 w-full"
                                            placeholder="e.g. $120,000"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-white/10"></div>

                        <div>
                            <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4 ml-1">Company Details</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Company Logo</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden shrink-0">
                                            {formData.logo ? (
                                                <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-contain" />
                                            ) : (
                                                <Building className="w-6 h-6 text-gray-500" />
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleLogoUpload}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <button
                                            onClick={triggerFileInput}
                                            className="flex-1 btn-secondary py-3 text-sm flex items-center justify-center border border-[var(--border-color)] text-[var(--text-secondary)]"
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            Upload
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Company Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Building className="h-5 w-5 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            name="companyName"
                                            value={formData.companyName}
                                            onChange={handleInputChange}
                                            className="input-field pl-12 w-full"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Signatory Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            name="signatoryName"
                                            value={formData.signatoryName}
                                            onChange={handleInputChange}
                                            className="input-field pl-12 w-full"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Signatory Role</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Briefcase className="h-5 w-5 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            name="signatoryRole"
                                            value={formData.signatoryRole}
                                            onChange={handleInputChange}
                                            className="input-field pl-12 w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/30 relative z-10">
                    <button
                        onClick={handlePrint}
                        className="w-full btn-primary flex items-center justify-center py-4 text-lg shadow-xl shadow-purple-500/20 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 border-none text-white font-bold tracking-wide"
                    >
                        <Printer className="w-5 h-5 mr-3" />
                        Print / Save as PDF
                    </button>
                </div>
            </div>

            {/* Right Side: Preview */}
            <div className="flex-1 bg-[var(--bg-secondary)] rounded-3xl overflow-hidden flex flex-col relative print:bg-white print:overflow-visible border border-[var(--border-color)] shadow-2xl">
                {/* Background Grid for Preview Area */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none print:hidden"></div>
                <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none print:hidden"></div>

                <div className="flex-1 overflow-x-auto overflow-y-auto p-4 md:p-12 flex justify-center custom-scrollbar print:p-0 print:overflow-visible relative z-10 w-full">
                    {/* A4 Paper */}
                    <div
                        ref={letterRef}
                        className="bg-white w-[210mm] min-h-[297mm] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative flex flex-col print:shadow-none print:w-full print:h-auto transform transition-transform duration-500 hover:scale-[1.01]"
                    >
                        {/* Header Graphic */}
                        <div className="absolute top-0 left-0 w-full h-32 overflow-hidden pointer-events-none">
                            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                                <path d="M0 0 L100 0 L100 20 L0 100 Z" fill="#f3e8ff" /> {/* Light Purple */}
                                <path d="M0 0 L70 0 L0 40 Z" fill="#9333ea" opacity="0.1" />
                                <path d="M0 0 L40 0 L0 25 Z" fill="#9333ea" opacity="0.2" />
                            </svg>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-5 rounded-bl-full opacity-50 transform translate-x-10 -translate-y-10"></div>
                        </div>

                        {/* Content Container */}
                        <div className="relative z-10 p-16 flex-1 flex flex-col">
                            {/* Logo Section */}
                            <div className="flex justify-center mb-12">
                                <div className="flex items-center gap-4">
                                    {/* Dynamic Logo */}
                                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg transform rotate-3 overflow-hidden">
                                        {formData.logo ? (
                                            <img src={formData.logo} alt="Company Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <Building className="w-8 h-8 text-purple-600" />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">{formData.companyName}</h1>
                                        <div className="h-1 w-20 bg-purple-600 mt-1 rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <div className="text-center mb-12">
                                <h2 className="text-2xl font-bold text-purple-700 uppercase tracking-widest border-b-2 border-purple-100 inline-block pb-2">
                                    Job Offer Letter
                                </h2>
                            </div>

                            {/* Meta Data */}
                            <div className="flex justify-between mb-8 text-slate-600">
                                <div>
                                    <p className="font-bold text-slate-900">To:</p>
                                    <p className="text-lg font-medium">{formData.candidateName || '[Candidate Name]'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-900">Date:</p>
                                    <p className="font-medium">{formData.dateOfLetter}</p>
                                </div>
                            </div>

                            {/* Subject */}
                            <div className="mb-8">
                                <p className="font-bold text-slate-900">Subject: <span className="font-normal">Employment Opportunity at {formData.companyName}</span></p>
                            </div>

                            {/* Body */}
                            <div className="space-y-6 text-slate-700 leading-relaxed text-justify">
                                <p>Dear <span className="font-bold text-slate-900">{formData.candidateName || '[Candidate Name]'}</span>,</p>

                                <p>
                                    We are excited to offer you the role of <span className="font-bold text-purple-700">{formData.role || '[Role Name]'}</span> at {formData.companyName}.
                                </p>

                                <p>
                                    Your ability to combine fresh ideas with strategic thinking will be invaluable as we continue to expand our creative reach and deliver impactful solutions to our clients.
                                </p>

                                <p>
                                    Your journey with us is set to begin on <span className="font-bold text-slate-900">{formData.joiningDate || '[Date of Joining]'}</span>, at our Creative Hub Office. In this role, you will be part of a passionate team dedicated to innovation, collaboration, and excellence in design.
                                </p>

                                {formData.salary && (
                                    <p>
                                        Your starting salary will be <span className="font-bold text-slate-900">{formData.salary}</span> per annum, along with other benefits provided in alignment with your experience and industry standards.
                                    </p>
                                )}

                                <p>
                                    We look forward to the unique perspective and vision you will bring to our projects. Please confirm your acceptance of this offer by signing and returning a copy of this letter within 3 days.
                                </p>
                            </div>

                            {/* Signature */}
                            <div className="mt-16 mb-8">
                                <p className="text-slate-600 mb-8">With great anticipation,</p>

                                <div className="mb-4">
                                    {/* Signature Font Style */}
                                    <div className="font-handwriting text-4xl text-slate-900 transform -rotate-2 inline-block">
                                        {formData.signatoryName.split(' ')[0]}
                                    </div>
                                </div>

                                <div>
                                    <p className="font-bold text-slate-900">{formData.signatoryName}</p>
                                    <p className="text-slate-500 text-sm">{formData.signatoryRole}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Graphic */}
                        <div className="absolute bottom-0 right-0 w-full h-24 overflow-hidden pointer-events-none">
                            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                                <path d="M0 100 L100 100 L100 0 Z" fill="#f3e8ff" />
                                <path d="M50 100 L100 100 L100 50 Z" fill="#9333ea" opacity="0.1" />
                            </svg>
                            <div className="absolute bottom-4 left-8 flex gap-6 text-xs text-slate-400">
                                <div className="flex items-center">
                                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                                    123-456-7890
                                </div>
                                <div className="flex items-center">
                                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                                    contact@{formData.companyName.toLowerCase().replace(/\s+/g, '')}.com
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { margin: 0; }
                    body * { visibility: hidden; }
                    .print\\:bg-white { background-color: white !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:overflow-visible { overflow: visible !important; }
                    .print\\:w-full { width: 100% !important; }
                    .print\\:h-auto { height: auto !important; }
                    .print\\:hidden { display: none !important; }
                    
                    /* Target the letter container specifically */
                    div:has(> .print\\:shadow-none), 
                    div:has(> .print\\:shadow-none) * {
                        visibility: visible;
                    }
                    
                    /* Ensure the letter takes up the full page */
                    div:has(> .print\\:shadow-none) {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                }
                
                /* Add a handwriting font if possible, or fallback to cursive */
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&display=swap');
                .font-handwriting {
                    font-family: 'Dancing Script', cursive;
                }
            `}</style>
        </div >
    );
};

export default OfferLetter;
