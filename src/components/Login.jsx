import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import { useTheme } from '../context/ThemeContext';

// Icons & Assets (Adapted to use Lucide & Existing Assets)
import { User, Lock, ArrowUpRight, Sparkles, Activity, Eye, EyeOff } from 'lucide-react';
import logoNew from '../assets/agrocel_logo.png'; // New logo from user
import logoLight from '../assets/pucho-logo.png'; // Keeping existing as backup/variant
import logoDark from '../assets/pucho-logo-light.png';
// Removed theme icons and unused hook to resolve ReferenceError and clean up.
import mascot1 from '../assets/mascot-1.png'; // Green Beanie Girl
import mascot2 from '../assets/mascot-2.png'; // Beard Guy
import mascot3 from '../assets/mascot-3.png'; // Red Cap Boy
import mascot4 from '../assets/mascot-4.png'; // Glasses Guy

// Floating Mascot Component (Individual Images) with Gaze Tracking
const Mascot = ({ imageSrc, delay, x, y, size = "w-16 h-16", cursorColor = "text-blue-500", cursorRotation = "0deg" }) => {
    return (
        <div
            className={`absolute ${x} ${y} z-20 animate-float transition-all duration-300 hover:scale-110 hover:rotate-6 cursor-pointer pointer-events-auto`}
            style={{
                animationDelay: `${delay}s`
            }}
        >
            <div className={`${size} rounded-full overflow-hidden shadow-lg relative bg-white/50 backdrop-blur-sm border border-white/40`}>
                <img
                    src={imageSrc}
                    alt="User"
                    className="w-full h-full object-cover"
                />
            </div>
            <div
                className={`absolute -bottom-3 -right-3 ${cursorColor} drop-shadow-md`}
                style={{ transform: `rotate(${cursorRotation})` }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.5 3.5L10.5 20.5L13.5 13.5L20.5 10.5L3.5 3.5Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    );
};

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    // Theme toggle removed - enforcing light theme only
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState(''); // Changed email to username to match AuthContext
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(username, password);

        if (result.success) {
            navigate('/admin'); // Or '/' based on previous logic, user code used /admin
        } else {
            setError(result.message || 'Login failed');
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-[#FAFAFF] relative flex items-center justify-center p-4 lg:p-8 overflow-hidden font-space text-gray-900">
            {/* Full Screen Grid Pattern - Base */}
            <div className="absolute inset-0 z-0 opacity-100 pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)`,
                    backgroundSize: '64px 64px',
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0) 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0) 100%)'
                }}>
            </div>

            {/* Interactive Grid Spotlight (Purple Glow) */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-50"
                style={{
                    background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139, 92, 246, 0.15), transparent 40%)`
                }}>
            </div>

            {/* Ambient Gradients - Left & Right */}
            <div className="absolute top-0 left-0 w-[500px] lg:w-[800px] h-[500px] lg:h-[800px] bg-purple-600/30 rounded-full blur-[80px] lg:blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-[500px] lg:w-[800px] h-[500px] lg:h-[800px] bg-blue-600/30 rounded-full blur-[80px] lg:blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>

            {/* Floating Mascots - Using Dicebear Avatars as Placeholders */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full hidden lg:block">
                {/* Top Left - Green Beanie Girl */}
                <Mascot
                    imageSrc={mascot1}
                    x="top-[calc(12%+0.5rem)] left-[calc(2%+2rem)] md:top-[calc(1%+(2rem))] md:left-[calc(2%+(-1rem))]"
                    delay={0}
                    size="w-20 h-20"
                    cursorColor="text-blue-500"
                    cursorRotation="-10deg"
                />

                {/* Top Center-Right - Beard Guy */}
                <Mascot
                    imageSrc={mascot2}
                    x="top-[10%] right-[15%] md:top-[4%] md:right-[2%]"
                    delay={1.5}
                    size="w-20 h-20"
                    cursorColor="text-purple-500"
                    cursorRotation="15deg"
                />

                {/* Bottom Center-Left - Red Cap Boy */}
                <Mascot
                    imageSrc={mascot3}
                    x="bottom-[15%] left-[12%] md:bottom-[8%] md:left-[1%]"
                    delay={0.8}
                    size="w-20 h-20"
                    cursorColor="text-yellow-500"
                    cursorRotation="-5deg"
                />

                {/* Bottom Right - Glasses Guy */}
                <Mascot
                    imageSrc={mascot4}
                    x="bottom-[10%] right-[8%] md:bottom-[2%] md:right-[2%]"
                    delay={2.2}
                    size="w-20 h-20"
                    cursorColor="text-green-500"
                    cursorRotation="10deg"
                />
            </div>



            <div className="w-full max-w-7xl mx-auto grid md:grid-cols-2 gap-6 md:gap-12 lg:gap-24 relative z-10 items-center h-full md:h-auto content-center">

                {/* Left Side: Marketing Content */}
                <div className="text-center md:text-left space-y-4 md:space-y-8 md:pl-8 lg:pl-16">
                    {/* Desktop/Tablet Logo */}


                    <div className="space-y-2 md:space-y-4 lg:space-y-6">
                        <div className="space-y-1 md:space-y-2">
                            <div className="font-semibold text-[#111834] text-sm md:text-base lg:text-lg">Agrocel HR Dashboard</div>
                            <div className="text-[10px] md:text-[11px] lg:text-xs font-bold text-purple-600 tracking-wider uppercase drop-shadow-sm">BUILT ON PUCHO.AI</div>
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-[80px] font-bold text-[#111834] leading-[1.1] md:leading-[1] lg:leading-[0.95] tracking-tight">
                            Build.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600">Automate.</span><br />
                            Scale.
                        </h1>

                        <p className="text-[#111834] text-xs md:text-sm lg:text-base leading-relaxed max-w-md mx-auto md:mx-0 opacity-70 hidden md:block">
                            Transform your workforce data into actionable intelligence. Access your HR command center to manage your team with real-time insights.
                        </p>
                    </div>

                    {/* Badges */}
                    <div className="hidden md:flex flex-wrap justify-center md:justify-start gap-2 md:gap-3 lg:gap-4 pt-2 md:pt-3 lg:pt-4">
                        <div className="flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 bg-purple-50 border border-purple-100 rounded-full text-[10px] lg:text-xs font-bold text-purple-700">
                            <Sparkles className="w-4 h-4" />
                            AI-Powered Intelligence
                        </div>
                        <div className="flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 bg-green-50 border border-green-100 rounded-full text-[10px] lg:text-xs font-bold text-green-700">
                            <Activity className="w-4 h-4" />
                            System Operational
                        </div>
                    </div>
                </div>

                {/* Right Side: Floating Login Card with Glassmorphism */}
                <div className="flex flex-col items-center justify-center md:justify-end w-full">
                    <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 lg:p-12 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-sm md:max-w-md border border-white/50 relative overflow-hidden group">
                        {/* Logo in top right */}
                        <div className="absolute top-6 right-6 z-20">
                            <img src={logoNew} alt="Agrocel" className="h-12 lg:h-16 object-contain mix-blend-darken transition-all duration-300 hover:scale-110" />
                        </div>
                        <div className="space-y-2 mb-6 md:mb-8">
                            <h2 className="text-2xl font-bold text-[#111834]">Welcome Back</h2>
                            <p className="text-gray-400 text-sm">Enter your credentials to access the dashboard.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <Input
                                label="Username"
                                type="text"
                                icon={User}
                                placeholder="Your Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />

                            <Input
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                icon={Lock}
                                placeholder="Your Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                suffix={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-1 hover:bg-gray-200 rounded-md transition-colors text-gray-400 hover:text-purple-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                }
                            />

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full relative h-[52px] flex items-center justify-center gap-3 rounded-full transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] font-space font-bold text-white overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
                                style={{
                                    background: 'linear-gradient(180deg, #5833EF 0%, #3A10CE 100%)',
                                    boxShadow: '0px 4.4px 8.8px rgba(58, 16, 206, 0.3)',
                                }}
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                <span className="relative flex items-center justify-center gap-2 text-base md:text-lg tracking-wide">
                                    {loading ? 'Signing in...' : 'Automate now'}
                                    {!loading && <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                                </span>
                            </button>
                        </form>
                    </div>

                    {/* Mobile Only: Description and Badges moved below form */}
                    <div className="block md:hidden text-center mt-8 space-y-4">
                        <p className="text-[#111834] text-xs leading-relaxed max-w-xs mx-auto opacity-70">
                            Transform your Tally data into actionable intelligence. Access your financial command center to manage your business with real-time insights.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-full text-[10px] font-medium text-purple-700">
                                <Sparkles className="w-4 h-4" />
                                AI-Powered Intelligence
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full text-[10px] font-medium text-green-700">
                                <Activity className="w-4 h-4" />
                                System Operational
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;
