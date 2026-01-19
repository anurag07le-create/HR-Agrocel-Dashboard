import { LINKEDIN_CONFIG } from '../config';

export const getLinkedInAuthUrl = () => {
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('linkedin_oauth_state', state);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: LINKEDIN_CONFIG.CLIENT_ID,
        redirect_uri: LINKEDIN_CONFIG.REDIRECT_URI,
        state: state,
        scope: LINKEDIN_CONFIG.SCOPE,
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
};

// Helper to proxy requests to avoid CORS issues in development
// Using Vite proxy configured in vite.config.js
const OAUTH_PROXY = '/api/linkedin/oauth';
const API_PROXY = '/api/linkedin/api';

export const exchangeCodeForToken = async (code) => {
    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: LINKEDIN_CONFIG.REDIRECT_URI,
        client_id: LINKEDIN_CONFIG.CLIENT_ID,
        client_secret: LINKEDIN_CONFIG.CLIENT_SECRET,
    });

    try {
        // Use local proxy for token exchange
        const response = await fetch(`${OAUTH_PROXY}/accessToken`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error_description || 'Failed to exchange code for token');
        }

        const data = await response.json();
        return data; // contains access_token, expires_in
    } catch (error) {
        console.error('Error exchanging token:', error);
        throw error;
    }
};

export const getUserProfile = async (accessToken) => {
    try {
        // Use local proxy for profile fetch
        const response = await fetch(`${API_PROXY}/userinfo`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }

        return await response.json(); // contains sub (URN), name, picture
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }
};

export const registerUpload = async (accessToken, personUrn) => {
    const body = {
        registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: `urn:li:person:${personUrn}`,
            serviceRelationships: [
                {
                    relationshipType: "OWNER",
                    identifier: "urn:li:userGeneratedContent"
                }
            ]
        }
    };

    // Use local proxy for upload registration
    const response = await fetch(`${API_PROXY}/assets?action=registerUpload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error('Failed to register upload');
    return await response.json();
};

export const uploadImage = async (uploadUrl, imageBlob) => {
    // Proxy the upload URL through our local server to avoid CORS
    // The uploadUrl typically starts with https://www.linkedin.com/dms-uploads/...
    // We will replace https://www.linkedin.com with /linkedin-upload

    let proxiedUrl = uploadUrl;
    if (uploadUrl.includes('https://www.linkedin.com')) {
        proxiedUrl = uploadUrl.replace('https://www.linkedin.com', '/linkedin-upload');
    }

    const response = await fetch(proxiedUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/octet-stream'
        },
        body: imageBlob
    });

    if (!response.ok) throw new Error('Failed to upload image binary');
    return true;
};

export const createPost = async (accessToken, personUrn, text, assetUrn = null) => {
    const body = {
        author: `urn:li:person:${personUrn}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
            "com.linkedin.ugc.ShareContent": {
                shareCommentary: {
                    text: text
                },
                shareMediaCategory: assetUrn ? "IMAGE" : "NONE",
                media: assetUrn ? [
                    {
                        status: "READY",
                        description: {
                            text: "Job Description"
                        },
                        media: assetUrn,
                        title: {
                            text: "We are hiring!"
                        }
                    }
                ] : []
            }
        },
        visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    };

    // Use local proxy for creating post
    const response = await fetch(`${API_PROXY}/ugcPosts`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to create post');
    }
    return await response.json();
};
