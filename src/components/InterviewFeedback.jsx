import React, { useState } from 'react';
import { Send, User, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { WEBHOOK_URLS } from '../config';

const InterviewFeedback = () => {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        candidateName: '',
        email: '',
        round: 'First Round',
        status: 'Selected',
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
        setSubmitting(true);
        try {
            const response = await fetch(WEBHOOK_URLS.INTERVIEW_FEEDBACK, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                alert('Feedback submitted successfully!');
                setFormData({ candidateName: '', email: '', round: 'First Round', status: 'Selected', feedback: '' });
            } else {
                alert('Failed to submit feedback. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('An error occurred. Please check console.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center space-y-4">
                <div className="inline-flex p-4 rounded-full bg-purple-500/20 shadow-xl shadow-purple-500/20 mb-4 animate-float border border-purple-500/30">
                    <MessageSquare className="w-10 h-10 text-purple-400" />
                </div>
                <h1 className="text-4xl font-bold text-[var(--text-primary)] tracking-tight">Interview Feedback</h1>
                <p className="text-lg text-[var(--text-secondary)] max-w-lg mx-auto">Submit your detailed evaluation and decision for the candidate.</p>
            </div>

            <div className="glass-card rounded-3xl p-6 md:p-10 relative overflow-hidden border border-[var(--border-color)]">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"></div>

                <form onSubmit={handleSubmit} className="space-y-8">
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
                                required
                                className="input-field w-full pl-12 bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-gray-500 focus:border-purple-500"
                                placeholder="Enter full name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Candidate Email</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                className="input-field w-full pl-12 bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-gray-500 focus:border-purple-500"
                                placeholder="candidate@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Interview Round</label>
                        <div className="relative group">
                            <select
                                name="round"
                                value={formData.round}
                                onChange={handleInputChange}
                                className="input-field w-full pl-4 pr-10 appearance-none cursor-pointer bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-primary)] focus:border-purple-500"
                            >
                                <option value="First Round" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">First Round</option>
                                <option value="Second Round" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Second Round</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Decision Status</label>
                        <div className="relative group">
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="input-field w-full pl-4 pr-10 appearance-none cursor-pointer bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-primary)] focus:border-purple-500"
                            >
                                <option value="Selected" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Selected</option>
                                <option value="Rejected" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Rejected</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 ml-1">Feedback & Comments</label>
                        <div className="relative group">
                            <div className="absolute top-4 left-4 pointer-events-none">
                                <MessageSquare className="h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                            </div>
                            <textarea
                                name="feedback"
                                value={formData.feedback}
                                onChange={handleInputChange}
                                required
                                rows={6}
                                className="input-field w-full pl-12 resize-none bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-gray-500 focus:border-purple-500"
                                placeholder="Provide detailed feedback about the candidate's performance, strengths, and areas for improvement..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full btn-primary flex items-center justify-center py-4 text-lg shadow-xl shadow-purple-500/20 bg-purple-600 hover:bg-purple-700 text-white border-none"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                Submitting Evaluation...
                            </>
                        ) : (
                            <>
                                <Send className="w-6 h-6 mr-3" />
                                Submit Feedback
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InterviewFeedback;
