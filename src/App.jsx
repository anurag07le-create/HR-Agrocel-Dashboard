import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
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
import { fetchSheetData } from './utils/googleSheets';
import { GOOGLE_SHEETS_CONFIG, WEBHOOK_URLS } from './config';



import logoDark from './assets/pucho-logo.png';
import logoLight from './assets/pucho-logo-light.png';
import { LayoutDashboard, FileText, Users, ClipboardList, MessageSquare, Briefcase, UserPlus, LogOut, Loader2, Bell, Sun, Moon, Menu } from 'lucide-react';

// Sidebar Item Component
const SidebarItem = ({ icon: Icon, label, to, active }) => (
    <Link
        to={to}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
            }`}
    >
        <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-[var(--text-secondary)] group-hover:text-purple-400'}`} />
        <span className="font-medium">{label}</span>
    </Link>
);

const Layout = ({ children }) => {
    const location = useLocation();
    const { logout, user } = useAuth();
    const { hasNewNotification, openNotification, showModal, closeNotification, notificationData } = useNotification();
    const { theme, toggleTheme } = useTheme();
    const [logoKey, setLogoKey] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        setLogoKey(prev => prev + 1);
    }, [theme]);

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
                fixed inset-y-0 left-0 z-50 w-64 glass-sidebar flex flex-col h-full transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:relative lg:translate-x-0
            `}>
                <div className="p-6 flex items-center justify-center border-b border-[var(--border-color)]">
                    <div className="h-9 flex items-center justify-center">
                        <img
                            key={logoKey}
                            src={theme === 'dark' ? logoDark : logoLight}
                            alt="Pucho.ai"
                            className={`${theme === 'dark' ? 'h-9' : 'h-6'} w-auto animate-pulse-once transition-all duration-300`}
                        />
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
                    {user?.role === 'admin' && (
                        <SidebarItem icon={LayoutDashboard} label="Admin Panel" to="/admin" active={isActive('/admin')} />
                    )}
                    <SidebarItem icon={FileText} label="Requirements" to="/" active={isActive('/')} />
                    <SidebarItem icon={Briefcase} label="Job Descriptions" to="/jd" active={isActive('/jd')} />
                    <SidebarItem icon={ClipboardList} label="Candidate Log" to="/log" active={isActive('/log')} />
                    <SidebarItem icon={Users} label="Shortlist" to="/shortlist" active={isActive('/shortlist')} />
                    <SidebarItem icon={UserPlus} label="Interviews" to="/interviews" active={isActive('/interviews')} />
                    <SidebarItem icon={MessageSquare} label="Feedback" to="/feedback" active={isActive('/feedback')} />
                    <SidebarItem icon={FileText} label="Offer Letter" to="/offer-letter" active={isActive('/offer-letter')} />
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={logout}
                        className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header className="h-16 border-b border-[var(--border-color)] bg-[var(--glass-bg)] backdrop-blur-md flex items-center justify-between px-4 lg:px-6 z-10 transition-colors duration-300">
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="mr-4 lg:hidden p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg lg:text-xl font-bold text-[var(--text-primary)] truncate">
                            Hey, {user?.username || 'User'} 👋
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="text-sm font-medium text-[var(--text-secondary)]">{user?.username || 'User'}</span>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                        </button>
                        <button
                            onClick={openNotification}
                            className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <Bell className="w-6 h-6" />
                            {hasNewNotification && (
                                <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0F0F0F] animate-pulse"></span>
                            )}
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                    {/* Background Noise/Grid */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none fixed"></div>
                    <div className="relative z-10">
                        {children}
                    </div>
                </main>
            </div>

            <NotificationModal
                isOpen={showModal}
                onClose={closeNotification}
                data={notificationData}
                onActionComplete={closeNotification}
            />
        </div>
    );
};

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="flex items-center justify-center h-screen bg-[#0F0F0F] text-white"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

    if (!user) return <Navigate to="/login" />;

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/" />;
    }

    return <Layout>{children}</Layout>;
};

const App = () => {
    return (
        <ThemeProvider>
            <NotificationProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/redirect" element={<Redirect />} />
                        <Route path="/linkedin/callback" element={<LinkedInCallback />} />

                        <Route path="/" element={<ProtectedRoute><RequirementIntake /></ProtectedRoute>} />
                        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />
                        <Route path="/jd" element={<ProtectedRoute><JD /></ProtectedRoute>} />
                        <Route path="/log" element={<ProtectedRoute><Log /></ProtectedRoute>} />
                        <Route path="/shortlist" element={<ProtectedRoute><ShortlistCandidate /></ProtectedRoute>} />
                        <Route path="/interviews" element={<ProtectedRoute><Interviews /></ProtectedRoute>} />
                        <Route path="/feedback" element={<ProtectedRoute><InterviewFeedback /></ProtectedRoute>} />
                        <Route path="/offer-letter" element={<ProtectedRoute><OfferLetter /></ProtectedRoute>} />

                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Router>
            </NotificationProvider>
        </ThemeProvider>
    );
};

export default App;
