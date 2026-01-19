import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Briefcase, Users, CheckCircle, Clock, AlertCircle, ChevronRight, X, Loader2, Sparkles, TrendingUp, Star, Mail, Eye, IndianRupee } from 'lucide-react';
import { WEBHOOK_URLS, GOOGLE_SHEETS_CONFIG } from '../config';
import { fetchSheetData } from '../utils/googleSheets';
import { getDocUrls } from '../utils/docHelper';
import { useNotification } from '../context/NotificationContext';

const generateLogID = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const RequirementIntake = () => {
    const [requirements, setRequirements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedRequirement, setSelectedRequirement] = useState(null);
    const [filter, setFilter] = useState('active');
    const [searchTerm, setSearchTerm] = useState('');
    const { triggerNotification } = useNotification();

    // Form State
    const [formData, setFormData] = useState({
        role: '',
        experience: '',
        salary: '',
        location: '',
        priority: 'Normal',
        total: 1
    });

    const [submitting, setSubmitting] = useState(false);
    const [polling, setPolling] = useState(false);
    const pollingRef = useRef(null);

    // Fetch Data from Google Sheets
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const reqData = await fetchSheetData(
                    GOOGLE_SHEETS_CONFIG.HR_WORKFLOW_ID,
                    GOOGLE_SHEETS_CONFIG.GIDS.REQUIREMENT_INTAKE
                );

                const logData = await fetchSheetData(
                    GOOGLE_SHEETS_CONFIG.HR_WORKFLOW_ID,
                    GOOGLE_SHEETS_CONFIG.GIDS.LOG
                );

                const processedRequirements = reqData.map((req, index) => {
                    const roleCandidates = logData.filter(candidate =>
                        (candidate.Role || '').toLowerCase() === (req.Role || '').toLowerCase()
                    ).map(c => ({
                        name: c['Name of the Candidate'] || c.Name,
                        email: c.Email,
                        score: c.Score,
                        status: c.Status || 'Pending',
                        cv: c.CV
                    }));

                    return {
                        id: index,
                        role: req.Role,
                        experience: req.Experience,
                        salary: req['Salary(Rs)'] || req.Salary,
                        priority: req.Urgency || 'Normal',
                        location: req.Location,
                        status: (req['Current Status of Requirement'] || '').includes('Intake') ? 'Open' : 'Closed',
                        total: parseInt(req['Total Requirement'] || req['Total No of Requirment'] || 5),
                        hired: parseInt(req['Currently Selected'] || 0),
                        candidates: roleCandidates
                    };
                });

                setRequirements(processedRequirements);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting || polling) return; // Prevent multiple submissions
        setSubmitting(true);

        // Auto-append "Years" to experience if missing
        let experience = formData.experience;
        if (experience && !experience.toLowerCase().includes('year')) {
            experience = `${experience} Years`;
        }

        const logId = generateLogID();

        const payload = {
            ...formData,
            experience,
            log_id: logId,
            timestamp: new Date().toISOString(),
            status: 'Open',
            hired: 0
        };

        try {
            // 1. Send Webhook (Fire and Forget regarding response body, just check 200 OK)
            const response = await fetch(WEBHOOK_URLS.REQUIREMENT_INTAKE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setSubmitting(false);
                setPolling(true); // Start UI polling state

                // 2. Start Polling
                let attempts = 0;
                const maxAttempts = 30; // 5 minutes (30 * 10s)
                const intervalTime = 10000; // 10 seconds

                const poll = async () => {
                    attempts++;
                    console.log(`Polling attempt ${attempts}/${maxAttempts} for Log ID: ${logId}`);

                    if (attempts > maxAttempts) {
                        setPolling(false);
                        alert('Polling timed out. Please check the dashboard later for the status.');
                        return;
                    }

                    try {
                        const sheetData = await fetchSheetData(
                            GOOGLE_SHEETS_CONFIG.HR_WORKFLOW_ID,
                            GOOGLE_SHEETS_CONFIG.GIDS.JD_APPROVAL // New GID
                        );

                        // Find row with matching Log ID
                        const match = sheetData.find(row => row['Log ID'] === logId);

                        if (match) {
                            console.log('JD Found!', match);
                            setPolling(false);

                            // Trigger Notification
                            triggerNotification({
                                JD_Poster: match['JD Poster'],
                                Text: match['JD Text'] || match['Role Name'], // Fallback
                                Accept_URL: match['Accept link'],
                                Reject_URL: match['Decline Link']
                            });

                            // Add to local list and close form
                            const newReq = {
                                id: Date.now(),
                                role: formData.role,
                                experience: experience,
                                salary: formData.salary,
                                priority: formData.priority,
                                location: formData.location,
                                status: 'Open',
                                total: parseInt(formData.total),
                                hired: 0,
                                candidates: []
                            };
                            setRequirements(prev => [newReq, ...prev]);
                            setShowForm(false);
                            setFormData({
                                role: '',
                                experience: '',
                                salary: '',
                                location: '',
                                priority: 'Normal',
                                total: 1
                            });

                        } else {
                            // Valid response but data not found yet, retry
                            pollingRef.current = setTimeout(poll, intervalTime);
                        }

                    } catch (err) {
                        console.error("Polling error:", err);
                        // Retry even on error (transient network issues)
                        pollingRef.current = setTimeout(poll, intervalTime);
                    }
                };

                poll(); // Start first poll

            } else {
                setSubmitting(false);
                alert('Failed to submit requirement to webhook. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting requirement:', error);
            setSubmitting(false);
            alert('An error occurred during submission.');
        }
    };

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) clearTimeout(pollingRef.current);
        };
    }, []);

    const filteredRequirements = requirements.filter(req => {
        const matchesFilter = filter === 'all' || (filter === 'active' && req.status === 'Open');
        const matchesSearch = (req.role || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Controls & List */}
            <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-[var(--border-color)] flex flex-col md:flex-row justify-between items-center gap-4 bg-[var(--bg-secondary)]/30">
                    <div className="flex items-center space-x-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                            <input
                                type="text"
                                placeholder="Search requirements..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 input-field"
                            />
                        </div>
                        <div className="flex bg-[var(--input-bg)] rounded-xl p-1 border border-[var(--border-color)]">
                            <button
                                onClick={() => setFilter('active')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'active' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                All
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowForm(true)}
                        className="btn-primary flex items-center space-x-2 w-full md:w-auto justify-center"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Requirement</span>
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRequirements.map(req => (
                                <div
                                    key={req.id}
                                    onClick={() => setSelectedRequirement(req)}
                                    className="group bg-[var(--bg-secondary)] hover:bg-[var(--glass-bg)] border border-[var(--border-color)] rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-blue-500/10 rounded-xl">
                                            <Briefcase className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${req.priority === 'Urgent' || req.priority === 'High' ? 'bg-rose-500/20 text-rose-400' : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {req.priority}
                                        </span>
                                    </div>

                                    <div className="mb-6">
                                        <h4 className="font-bold text-xl text-[var(--text-primary)] group-hover:text-purple-400 transition-colors mb-2">{req.role}</h4>

                                        <div className="flex justify-between items-center text-sm mb-2">
                                            <span className="text-[var(--text-secondary)]">Hiring Progress</span>
                                            <span className="text-blue-400 font-bold">{req.hired} / {req.total} Hired</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                                                style={{ width: `${(req.hired / req.total) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-[var(--text-secondary)] border-t border-[var(--border-color)] pt-4">
                                        <div className="flex items-center">
                                            <Users className="w-4 h-4 mr-2 text-[var(--text-secondary)]" />
                                            {req.location}
                                        </div>
                                        <div className="flex items-center">
                                            <IndianRupee className="w-4 h-4 mr-2 text-[var(--text-secondary)]" />
                                            {req.salary}
                                        </div>
                                        <div className="flex items-center">
                                            <Clock className="w-4 h-4 mr-2 text-[var(--text-secondary)]" />
                                            {req.experience}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Candidate Details Modal */}
            {selectedRequirement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedRequirement(null)}>
                    <div className="glass-card w-full max-w-5xl rounded-2xl border border-[var(--border-color)] overflow-hidden animate-scale-in flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/30">
                            <div>
                                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{selectedRequirement.role}</h2>
                                <p className="text-[var(--text-secondary)] text-sm">Candidate Applications & Status</p>
                            </div>
                            <button onClick={() => setSelectedRequirement(null)} className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            {selectedRequirement.candidates && selectedRequirement.candidates.length > 0 ? (
                                <table className="min-w-full divide-y divide-[var(--border-color)]">
                                    <thead className="bg-[var(--bg-secondary)]/30">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Candidate</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Score</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)] bg-transparent">
                                        {selectedRequirement.candidates.map((candidate, index) => {
                                            const { preview } = getDocUrls(candidate.cv);
                                            return (
                                                <tr key={index} className="hover:bg-[var(--bg-secondary)] transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
                                                                {(candidate.name || '?').charAt(0)}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-bold text-[var(--text-primary)]">{candidate.name}</div>
                                                                <div className="text-sm text-[var(--text-secondary)] flex items-center mt-0.5">
                                                                    <Mail className="w-3 h-3 mr-1" />
                                                                    {candidate.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center text-sm font-bold text-gray-300">
                                                            <Star className="w-4 h-4 text-amber-400 mr-1.5 fill-amber-400" />
                                                            {candidate.score || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${(candidate.status || '').toLowerCase().includes('select') ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                                            (candidate.status || '').toLowerCase().includes('shortlist') ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                                                (candidate.status || '').toLowerCase().includes('reject') ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                                                                    'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                                            }`}>
                                                            {candidate.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        {candidate.cv ? (
                                                            <div className="flex items-center space-x-3">
                                                                <button
                                                                    onClick={() => window.open(preview, '_blank')}
                                                                    className="text-purple-400 hover:text-purple-300 flex items-center hover:underline decoration-2 underline-offset-2"
                                                                >
                                                                    <Eye className="w-4 h-4 mr-1.5" />
                                                                    View CV
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500 text-xs">No CV</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No candidates found for this requirement yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* New Requirement Modal - Dark Theme */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card w-full max-w-2xl max-h-[95vh] rounded-xl border border-[var(--border-color)] overflow-hidden animate-scale-in flex flex-col relative">
                        {/* Top Gradient Border */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-purple-500"></div>

                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/30">
                            <div className="flex items-center space-x-3">
                                <h2 className="text-xl font-bold text-[var(--text-primary)]">New Requirement</h2>
                            </div>
                            <button onClick={() => setShowForm(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Role Title</label>
                                    <input
                                        type="text"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className="block w-full input-field"
                                        placeholder="e.g. Senior Frontend Developer"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Salary</label>
                                        <input
                                            type="text"
                                            name="salary"
                                            value={formData.salary}
                                            onChange={handleInputChange}
                                            className="block w-full input-field"
                                            placeholder="e.g. $120k - $150k"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Experience Range</label>
                                        <input
                                            type="text"
                                            name="experience"
                                            value={formData.experience}
                                            onChange={handleInputChange}
                                            className="block w-full input-field"
                                            placeholder="e.g. 3-5 Years"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Number of Requirements</label>
                                    <input
                                        type="number"
                                        name="total"
                                        value={formData.total}
                                        onChange={handleInputChange}
                                        min="1"
                                        className="block w-full input-field"
                                        placeholder="e.g. 5"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        className="block w-full input-field"
                                        placeholder="e.g. Remote / New York"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Urgency</label>
                                    <div className="relative">
                                        <select
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleInputChange}
                                            className="block w-full px-4 py-3 appearance-none cursor-pointer border border-[var(--border-color)] bg-[var(--input-bg)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                        >
                                            <option value="Normal" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Normal Priority</option>
                                            <option value="Urgent" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">Urgent Priority</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[var(--text-secondary)]">
                                            <ChevronRight className="h-5 w-5 rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-4 bg-[#00A3FF] hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] flex items-center justify-center"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Generating JD... (approx 45s)
                                            </>
                                        ) : polling ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Waiting for Approval...
                                            </>
                                        ) : (
                                            "Create Requirement"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequirementIntake;
