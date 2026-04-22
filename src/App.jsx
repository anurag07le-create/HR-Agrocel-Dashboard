import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import RequirementIntake from './components/RequirementIntake';
import JD from './components/JD';
import Log from './components/Log';
import ShortlistCandidate from './components/ShortlistCandidate';
import Interviews from './components/Interviews';
import InterviewFeedback from './components/InterviewFeedback';
import OfferLetter from './components/OfferLetter';
import LinkedInCallback from './components/LinkedInCallback';
import NotificationModal from './components/NotificationModal';
import Redirect from './components/Redirect';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SearchProvider, useSearch } from './context/SearchContext';
import { ToastProvider } from './context/ToastContext';
import { DataProvider, useData } from './context/DataContext';
import { LoadingProvider, useLoading } from './context/LoadingContext';
import { fetchSheetData } from './utils/googleSheets';
import { GOOGLE_SHEETS_CONFIG, WEBHOOK_URLS } from './config';



import logoLight from './assets/pucho_logo_new.png';
import mascot2 from './assets/mascot-2.png';
import { LayoutDashboard, FileText, Users, ClipboardList, MessageSquare, Briefcase, UserPlus, LogOut, Loader2, Bell, Sun, Moon, Menu, Search, X } from 'lucide-react';

const SIDEBAR_ITEMS = [
    { icon: FileText, label: "Requirements", to: "/" },
    { icon: Briefcase, label: "Job Descriptions", to: "/jd" },
    { icon: ClipboardList, label: "Candidate Log", to: "/log" },
    { icon: Users, label: "Shortlist", to: "/shortlist" },
    { icon: UserPlus, label: "Interviews", to: "/interviews" },
    { icon: MessageSquare, label: "Feedback", to: "/feedback" },
    { icon: FileText, label: "Offer Letter", to: "/offer-letter" },
];

// Sidebar Item Component
const SidebarItem = ({ icon: Icon, label, to, active, onClick }) => (
    <Link
        to={to}
        onClick={onClick}
        className={`flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all duration-200 group text-[13px] sm:text-[15px] ${active
            ? 'bg-[#F8F9FA] text-black font-bold shadow-sm'
            : 'text-[#1A1A1A] hover:bg-[#F8F9FA]/60 font-medium'
            }`}
    >
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${active ? 'text-black' : 'text-[#1A1A1A]'}`} />
        <span>{label}</span>
    </Link>
);

const Layout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const { hasNewNotification, notificationCount, openNotification, showModal, closeNotification, clearNotification, notificationData } = useNotification();
    const { theme } = useTheme();
    const { searchQuery, setSearchQuery } = useSearch();
    const [logoKey, setLogoKey] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden transition-colors duration-300">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-[240px] sm:w-[253px] bg-white border-r border-[#F1F3F5] flex flex-col h-full transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:relative lg:translate-x-0
            `}>
                <div className="h-16 sm:h-20 lg:h-24 flex items-center px-4 sm:px-6">
                    <img
                        key={logoKey}
                        src={logoLight}
                        alt="Pucho.ai"
                        className="h-6 sm:h-7 w-auto transition-all duration-300"
                    />
                </div>

                <nav className="flex-1 overflow-y-auto py-2 sm:py-4 px-3 sm:px-4 space-y-0.5 sm:space-y-1 custom-scrollbar">
                    {SIDEBAR_ITEMS.map((item, index) => {
                        if (item.adminOnly && user?.role !== 'admin') return null;
                        return (
                            <SidebarItem
                                key={index}
                                icon={item.icon}
                                label={item.label}
                                to={item.to}
                                active={isActive(item.to)}
                                onClick={() => setIsSidebarOpen(false)}
                            />
                        );
                    })}
                </nav>

                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 mb-4 sm:mb-[30px]">
                    <div className="flex items-center space-x-3 px-3 sm:px-4 py-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-[#F1F3F5] flex-shrink-0">
                            <img src={mascot2} alt="User" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-[#111834] truncate">Demo User</span>
                            <span className="text-[10px] sm:text-[11px] text-[#5D7285] truncate">demo@pucho.ai</span>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center justify-center space-x-2 px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[#FF4D4D] border border-[#F1F3F5] w-full transition-all hover:bg-red-50 font-bold text-sm"
                    >
                        <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header className="h-14 sm:h-16 lg:h-20 bg-[var(--glass-bg)] backdrop-blur-md flex items-center justify-between px-3 sm:px-6 mx-2 sm:mx-4 mt-2 sm:mt-4 rounded-xl sm:rounded-2xl border border-[var(--border-color)]/60 z-40 transition-all duration-300 shadow-lg shadow-black/5 sticky top-2 sm:top-4">
                    <div className="flex items-center min-w-0">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="mr-2 sm:mr-4 lg:hidden p-1.5 sm:p-2 -ml-1 sm:-ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-base sm:text-lg lg:text-xl font-bold text-[var(--text-primary)] truncate">
                                {location.pathname === '/' ? 'Requirements' :
                                    location.pathname === '/jd' ? 'Job Descriptions' :
                                        location.pathname === '/log' ? 'Candidate Log' :
                                            location.pathname === '/shortlist' ? 'Shortlist' :
                                                location.pathname === '/interviews' ? 'Interviews' :
                                                    location.pathname === '/feedback' ? 'Feedback' :
                                                        location.pathname === '/offer-letter' ? 'Offer Letter' :
                                                            `Hey, ${user?.username || 'User'}`}
                            </h1>
                            <p className="text-[9px] sm:text-[10px] lg:text-xs text-[var(--text-secondary)] font-medium truncate hidden sm:block">
                                {location.pathname === '/' ? 'Create and manage your hiring requirements' :
                                    location.pathname === '/jd' ? 'View and manage generated job descriptions' :
                                        location.pathname === '/log' ? 'Track candidate applications and status' :
                                            location.pathname === '/shortlist' ? 'Manage shortlisted candidates' :
                                                location.pathname === '/interviews' ? 'Schedule and track interviews' :
                                                    location.pathname === '/feedback' ? 'Track interview feedback' :
                                                        location.pathname === '/offer-letter' ? 'Manage offer letters' :
                                                            `Welcome back, ${user?.username || 'User'}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {/* Mobile Search Toggle */}
                        <button
                            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                            className="md:hidden p-1.5 sm:p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        
                        {/* Global Search Bar */}
                        <div className="relative hidden md:block w-48 lg:w-64 xl:w-80 group">
                            <div className={`
                                flex items-center bg-[var(--bg-secondary)]/50 backdrop-blur-sm border rounded-xl px-3 py-1.5 lg:py-2 transition-all duration-300
                                ${isSearchFocused ? 'border-indigo-500 shadow-lg shadow-indigo-500/10' : 'border-[var(--border-color)] hover:border-[var(--text-secondary)]'}
                            `}>
                                <Search className={`w-3.5 h-3.5 lg:w-4 lg:h-4 mr-2 ${isSearchFocused ? 'text-indigo-500' : 'text-[var(--text-secondary)]'}`} />
                                <input
                                    type="text"
                                    placeholder="Filter page..."
                                    className="bg-transparent border-none outline-none text-xs lg:text-sm w-full font-medium text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="text-[var(--text-secondary)] hover:text-red-400">
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={openNotification}
                            className="relative p-1.5 sm:p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                            {hasNewNotification && notificationCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] sm:min-w-[20px] sm:h-[20px] px-0.5 sm:px-1 bg-gradient-to-br from-red-500 to-rose-600 rounded-full border-[2px] border-[var(--glass-bg)] flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-white shadow-lg shadow-red-500/30">
                                    {notificationCount}
                                </span>
                            )}
                        </button>
                    </div>
                </header>
                
                {/* Mobile Search Bar */}
                {isMobileSearchOpen && (
                    <div className="md:hidden mx-2 sm:mx-4 mt-2">
                        <div className="flex items-center bg-[var(--bg-secondary)]/50 backdrop-blur-sm border border-[var(--border-color)] rounded-xl px-3 py-2">
                            <Search className="w-4 h-4 mr-2 text-[var(--text-secondary)]" />
                            <input
                                type="text"
                                placeholder="Filter page..."
                                className="bg-transparent border-none outline-none text-sm w-full font-medium text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            <button onClick={() => { setSearchQuery(''); setIsMobileSearchOpen(false); }} className="text-[var(--text-secondary)] hover:text-red-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 custom-scrollbar relative">
                    {/* Background Noise/Grid */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxmaWx0ZXIgaWQ9Im5vaXNlIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC42NSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNCIvPjwvc3ZnPg==')] opacity-10 pointer-events-none fixed"></div>
                    <div className="relative z-10">
                        {children}
                    </div>
                </main>
            </div>

            <NotificationModal
                isOpen={showModal}
                onClose={closeNotification}
                data={notificationData}
                onActionComplete={clearNotification}
            />
        </div>
    );
};

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading: authLoading } = useAuth();
    const { loading: dataLoading } = useData();

    if (authLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#F8F9FA] text-[#1A1A1A]">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-6" />
                <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent transform scale-105">
                    Authenticating...
                </h2>
                <p className="text-sm text-gray-500 mt-2 font-semibold tracking-wide">
                    Please wait while we log you in
                </p>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" />;

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/" />;
    }

    return (
        <>
            {dataLoading && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#F8F9FA]/80 backdrop-blur-sm text-[#1A1A1A] transition-all duration-300">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center border border-indigo-50">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-6" />
                        <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent transform scale-105">
                            Fetching Live Data
                        </h2>
                        <p className="text-sm text-gray-500 mt-2 font-semibold tracking-wide">
                            Connecting to Google Sheets...
                        </p>
                    </div>
                </div>
            )}
            <Layout>{children}</Layout>
        </>
    );
};

// ... (existing imports)

const App = () => {
    return (
        <ThemeProvider>
            <LoadingProvider>
                <ToastProvider>
                    <NotificationProvider>
                        <SearchProvider>
                            <DataProvider>
                                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                                    <Routes>
                                        <Route path="/login" element={<Login />} />
                                        <Route path="/redirect" element={<Redirect />} />
                                        <Route path="/linkedin/callback" element={<LinkedInCallback />} />

                                        <Route path="/" element={<ProtectedRoute><RequirementIntake /></ProtectedRoute>} />
                                        <Route path="/jd" element={<ProtectedRoute><JD /></ProtectedRoute>} />
                                        <Route path="/log" element={<ProtectedRoute><Log /></ProtectedRoute>} />
                                        <Route path="/shortlist" element={<ProtectedRoute><ShortlistCandidate /></ProtectedRoute>} />
                                        <Route path="/interviews" element={<ProtectedRoute><Interviews /></ProtectedRoute>} />
                                        <Route path="/feedback" element={<ProtectedRoute><InterviewFeedback /></ProtectedRoute>} />
                                        <Route path="/offer-letter" element={<ProtectedRoute><OfferLetter /></ProtectedRoute>} />

                                        <Route path="*" element={<Navigate to="/" />} />
                                    </Routes>
                                </Router>
                            </DataProvider>
                        </SearchProvider>
                    </NotificationProvider>
                </ToastProvider>
            </LoadingProvider>
        </ThemeProvider>
    );
};

export default App;
