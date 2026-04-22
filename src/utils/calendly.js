import { CALENDLY_CONFIG } from '../config';

const BASE_URL = 'https://api.calendly.com';

// ─── Calendly Cache ───
let eventsCache = null;
let eventsCacheTimestamp = 0;
const EVENTS_CACHE_TTL = 60000; // 1 minute - events don't change that often

const headers = {
    'Authorization': `Bearer ${CALENDLY_CONFIG.TOKEN}`,
    'Content-Type': 'application/json'
};

// Cache for user URI (never changes within a session)
let cachedUserUri = null;

const getUserUri = async () => {
    if (cachedUserUri) return cachedUserUri;
    
    const response = await fetch(`${BASE_URL}/users/me`, { headers });
    if (!response.ok) throw new Error('Failed to fetch user info');
    
    const data = await response.json();
    cachedUserUri = data.resource.uri;
    return cachedUserUri;
};

export const fetchScheduledEvents = async () => {
    // Return cached if fresh enough
    const now = Date.now();
    if (eventsCache && (now - eventsCacheTimestamp) < EVENTS_CACHE_TTL) {
        return eventsCache;
    }

    try {
        const userUri = await getUserUri();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const minStartTime = today.toISOString();

        const eventsResponse = await fetch(
            `${BASE_URL}/scheduled_events?user=${userUri}&status=active&sort=start_time:asc&min_start_time=${minStartTime}&count=100`,
            { headers }
        );

        if (!eventsResponse.ok) throw new Error('Failed to fetch events');

        const eventsData = await eventsResponse.json();
        const events = eventsData.collection;

        // Fetch invitees in parallel (max 5 concurrent to avoid rate limits)
        const BATCH_SIZE = 5;
        const eventsWithInvitees = [...events];

        for (let i = 0; i < events.length; i += BATCH_SIZE) {
            const batch = events.slice(i, i + BATCH_SIZE);
            const inviteeResults = await Promise.all(
                batch.map(async (event, batchIndex) => {
                    try {
                        const res = await fetch(event.uri + '/invitees', { headers });
                        if (res.ok) {
                            const invData = await res.json();
                            const invitee = invData.collection[0];
                            if (invitee) {
                                return {
                                    index: i + batchIndex,
                                    candidate_name: invitee.name,
                                    candidate_email: invitee.email
                                };
                            }
                        }
                        return { index: i + batchIndex };
                    } catch {
                        return { index: i + batchIndex };
                    }
                })
            );

            inviteeResults.forEach(result => {
                if (result.candidate_name) {
                    eventsWithInvitees[result.index] = {
                        ...eventsWithInvitees[result.index],
                        candidate_name: result.candidate_name,
                        candidate_email: result.candidate_email
                    };
                }
            });
        }

        // Update cache
        eventsCache = eventsWithInvitees;
        eventsCacheTimestamp = Date.now();

        return eventsWithInvitees;

    } catch (error) {
        console.error('Calendly API Error:', error);
        // Return stale cache on error
        if (eventsCache) return eventsCache;
        return [];
    }
};
