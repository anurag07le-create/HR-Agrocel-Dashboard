import React, { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, ExternalLink, X, Loader2, Eye, Download, Share2, Linkedin, Send, CheckCircle } from 'lucide-react';
import { fetchSheetData } from '../utils/googleSheets';
import { GOOGLE_SHEETS_CONFIG } from '../config';
import { getDocUrls, shareDoc } from '../utils/docHelper';
import { getLinkedInAuthUrl, registerUpload, uploadImage, createPost } from '../utils/linkedin';

const JD = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    // LinkedIn State
    const [showLinkedInModal, setShowLinkedInModal] = useState(false);
    const [linkedInPostData, setLinkedInPostData] = useState({ text: '', image: null, role: '' });
    const [postingToLinkedIn, setPostingToLinkedIn] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await fetchSheetData(
                    GOOGLE_SHEETS_CONFIG.HR_WORKFLOW_ID,
                    GOOGLE_SHEETS_CONFIG.GIDS.JD
                );
                setData(result);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleLinkedInClick = async (item) => {
        // Open Modal with loading state
        setShowLinkedInModal(true);
        setLinkedInPostData({
            text: 'Loading Job Description...',
            image: item['JOB DESCRIPTION IMAGE'],
            role: item.ROLE
        });

        try {
            const { download, id } = getDocUrls(item['JOB DESCRIPTION']);
            let textUrl = '';
            let finalText = '';

            // If we have an ID, try the Google Docs export endpoint first (no proxy needed for public docs)
            if (id) {
                textUrl = `https://docs.google.com/document/d/${id}/export?format=txt`;
                try {
                    const response = await fetch(textUrl);
                    if (response.ok) {
                        const text = await response.text();
                        if (!text.includes('<!DOCTYPE html>') && !text.includes('<html')) {
                            finalText = text;
                        }
                    }
                } catch (e) {
                    console.warn('Google Docs export failed, trying proxy...', e);
                }
            }

            // Fallback: If export failed or no ID, try proxying the download URL
            if (!finalText) {
                const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(download)}`;
                console.log('Fetching JD text from proxy:', proxiedUrl);

                const response = await fetch(proxiedUrl);
                if (response.ok) {
                    finalText = await response.text();
                } else {
                    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
                }
            }

            // Check for HTML error pages again
            if (finalText.includes('<!DOCTYPE html>') || finalText.includes('<html')) {
                throw new Error('Drive returned HTML (Likely Private File or Auth Issue)');
            }

            // Truncate text if it exceeds LinkedIn's 3000 character limit
            if (finalText.length > 2800) {
                finalText = finalText.substring(0, 2800) + '...\n\n(Text truncated due to LinkedIn limit. See full doc link below.)';
            }

            setLinkedInPostData(prev => ({
                ...prev,
                text: finalText
            }));
        } catch (error) {
            console.error('Error fetching JD text:', error);
            // Show the error in the text area so the user knows what went wrong
            const { download } = getDocUrls(item['JOB DESCRIPTION']);

            setLinkedInPostData(prev => ({
                ...prev,
                text: `[Error loading text from Drive: ${error.message}]\n\nPlease ensure the file is PUBLIC ("Anyone with the link").\n\nDefaulting to link:\nWe are hiring for a ${item.ROLE}!\nView details: ${download}`
            }));
        }
    };

    const handlePostToLinkedIn = async () => {
        setPostingToLinkedIn(true);
        try {
            // Webhook URL
            const webhookUrl = 'https://studio.pucho.ai/api/v1/webhooks/g4DpmHs0gEchPVfNyFaD7';

            // Prepare payload
            const payload = {
                text: linkedInPostData.text,
                image: linkedInPostData.image,
                role: linkedInPostData.role
            };

            // Send to webhook
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
            }

            // Close the form modal and show success modal
            setShowLinkedInModal(false);
            setShowSuccessModal(true);

            // Auto close success modal after 3 seconds
            setTimeout(() => {
                setShowSuccessModal(false);
            }, 3000);

        } catch (error) {
            console.error('Error sending to webhook:', error);
            alert(`Failed to send: ${error.message}`);
        } finally {
            setPostingToLinkedIn(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Job Descriptions</h1>
                <p className="text-[var(--text-secondary)] mt-1">View and manage job description documents</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.map((item, index) => {
                    const { preview, download } = getDocUrls(item['JOB DESCRIPTION']);

                    return (
                        <div key={index} className="glass-card p-4 md:p-6 rounded-2xl hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group flex flex-col border border-[var(--border-color)]">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                                    <FileText className="w-6 h-6 text-purple-400" />
                                </div>
                                <div className="flex space-x-2">
                                    {item['JOB DESCRIPTION'] && (
                                        <>
                                            <button
                                                onClick={() => window.open(download, '_blank')}
                                                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full transition-colors"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => shareDoc(item.ROLE || 'Job Description', download)}
                                                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full transition-colors"
                                                title="Share"
                                            >
                                                <Share2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleLinkedInClick(item)}
                                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-full transition-colors"
                                        title="Post to LinkedIn"
                                    >
                                        <Linkedin className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                                {item.ROLE || 'Untitled Role'}
                            </h3>

                            <p className="text-[var(--text-secondary)] text-sm mb-6 flex-1">
                                Document ID: <span className="font-mono text-[var(--text-secondary)] opacity-70">{index + 1001}</span>
                            </p>

                            <div className="flex gap-3 mt-auto">
                                {item['JOB DESCRIPTION'] && (
                                    <button
                                        onClick={() => setSelectedDoc({ url: preview, title: item.ROLE })}
                                        className="flex-1 btn-primary bg-[var(--card-bg)] text-purple-300 border border-[var(--border-color)] hover:bg-[var(--bg-hover)] shadow-none flex items-center justify-center text-sm py-2"
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Doc
                                    </button>
                                )}
                                {item['JOB DESCRIPTION IMAGE'] && (
                                    <button
                                        onClick={() => setSelectedImage(item['JOB DESCRIPTION IMAGE'])}
                                        className="flex-1 btn-primary text-sm py-2 flex items-center justify-center"
                                    >
                                        <ImageIcon className="w-4 h-4 mr-2" />
                                        Preview
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* LinkedIn Post Modal */}
            {showLinkedInModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in border border-[var(--border-color)]">
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/30">
                            <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center">
                                <Linkedin className="w-6 h-6 text-[#0077b5] mr-2" />
                                Post to LinkedIn
                            </h3>
                            <button onClick={() => setShowLinkedInModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Post Text</label>
                                <textarea
                                    value={linkedInPostData.text}
                                    onChange={(e) => setLinkedInPostData({ ...linkedInPostData, text: e.target.value })}
                                    rows={5}
                                    className="w-full p-3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-[var(--text-primary)] placeholder-gray-500"
                                />
                            </div>
                            {linkedInPostData.image && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Image Preview</label>
                                    <div className="relative h-48 rounded-xl overflow-hidden border border-white/10 bg-black/20">
                                        <img src={linkedInPostData.image} alt="Post" className="w-full h-full object-contain" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-[var(--bg-secondary)]/30 border-t border-[var(--border-color)] flex justify-end gap-3">
                            <button
                                onClick={() => setShowLinkedInModal(false)}
                                className="px-4 py-2 text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePostToLinkedIn}
                                disabled={postingToLinkedIn}
                                className="btn-primary flex items-center px-6 py-2 bg-[#0077b5] hover:bg-[#006097]"
                            >
                                {postingToLinkedIn ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Posting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Post Now
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-12 right-0 p-2 text-white hover:text-purple-400 transition-colors"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <div className="bg-[var(--bg-secondary)] rounded-lg overflow-hidden shadow-2xl border border-[var(--border-color)]">
                            <img
                                src={selectedImage}
                                alt="JD Preview"
                                className="w-full h-full object-contain max-h-[85vh]"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Document Preview Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedDoc(null)}>
                    <div className="relative w-full max-w-5xl h-[85vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="absolute -top-12 left-0 right-0 flex justify-between items-center text-white px-2">
                            <h3 className="font-bold text-lg truncate flex-1 mr-4">{selectedDoc.title}</h3>
                            <button
                                onClick={() => setSelectedDoc(null)}
                                className="p-2 hover:text-purple-400 transition-colors"
                            >
                                <X className="w-8 h-8" />
                            </button>
                        </div>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full h-full">
                            <iframe
                                src={selectedDoc.url}
                                title="Document Preview"
                                className="w-full h-full border-none"
                                allow="autoplay"
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-scale-in">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-12 h-12 text-green-500 animate-bounce" />
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Success!</h3>
                        <p className="text-[var(--text-secondary)] text-center">JD Posted Successfully</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JD;
