import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Loader2, Lock, User, ArrowRight, Sparkles, AlertCircle, Sun, Moon } from 'lucide-react';
import logoDark from '../assets/pucho-logo.png';
import logoLight from '../assets/pucho-logo-light.png';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [logoKey, setLogoKey] = useState(0);

    // Trigger logo animation on theme change
    useEffect(() => {
        setLogoKey(prev => prev + 1);
    }, [theme]);

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Simulate a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));

        const result = await login(username, password);

        if (!result.success) {
            setError(result.message);
            setLoading(false);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden relative font-sans transition-colors duration-300">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#232323_1px,transparent_1px),linear-gradient(to_bottom,#232323_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

                {/* Glowing Orbs */}
                <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-purple-600/30 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-blue-600/20 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>

            {/* Theme Toggle - Moved outside background container for clickability */}
            <button
                onClick={toggleTheme}
                className="absolute top-6 right-6 p-2 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all z-50 shadow-lg cursor-pointer"
                title="Toggle Theme"
            >
                {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>

            <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center relative z-10 p-6 lg:p-12">

                {/* Left Side - Branding */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center items-start space-y-8 mb-12 lg:mb-0 lg:pr-12">
                    <div className="animate-fade-in-up">
                        <div className="h-20 lg:h-24 flex items-center mb-6 transition-all duration-300">
                            <img
                                key={logoKey}
                                src={theme === 'dark' ? logoDark : logoLight}
                                alt="Pucho.ai"
                                className={`${theme === 'dark' ? 'h-20 lg:h-24' : 'h-12 lg:h-14'} w-auto object-contain animate-pulse-once transition-all duration-300`}
                            />
                        </div>

                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-[var(--text-primary)] tracking-wide">Pucho.ai's HR Dashboard</h2>
                            <p className="text-sm text-purple-400 font-medium uppercase tracking-wider mt-1">Built on Pucho.ai</p>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
                            Build. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Automate.</span> <br />
                            Scale.
                        </h1>
                        <p className="mt-6 text-xl text-[var(--text-secondary)] max-w-lg leading-relaxed">
                            From words to working intelligence. Access your HR command center to manage workflows that think.
                        </p>
                    </div>

                    <div className="flex items-center space-x-4 text-sm font-medium text-[var(--text-secondary)] animate-fade-in-up delay-200">
                        <div className="flex items-center px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] backdrop-blur-sm">
                            <Sparkles className="w-4 h-4 text-purple-400 mr-2" />
                            <span>AI-Powered Intelligence</span>
                        </div>
                        <div className="flex items-center px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] backdrop-blur-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                            <span>System Operational</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full lg:w-[450px] animate-fade-in-up delay-300">
                    <div className="glass-card backdrop-blur-xl border border-[var(--border-color)] rounded-3xl p-8 lg:p-10 shadow-2xl shadow-purple-900/20 bg-[var(--card-bg)]">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Welcome Back</h2>
                            <p className="text-[var(--text-secondary)] text-sm">Enter your credentials to access the dashboard.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-400 animate-shake">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm font-medium">{error}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Username</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-[var(--text-secondary)] group-focus-within:text-purple-500 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="block w-full pl-11 pr-4 py-3.5 input-field bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-primary)]"
                                            placeholder="Enter your username"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-[var(--text-secondary)] group-focus-within:text-purple-500 transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full pl-11 pr-4 py-3.5 input-field bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-primary)]"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary py-3.5 rounded-xl text-white font-bold text-lg shadow-lg shadow-purple-500/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        <span>Authenticating...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <span>Sign In</span>
                                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
