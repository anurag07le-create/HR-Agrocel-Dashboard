import { CALENDLY_CONFIG } from '../config';

const BASE_URL = 'https://api.calendly.com';

export const fetchScheduledEvents = async () => {
    try {
        // 1. Get Current User URI
        const userResponse = await fetch(`${BASE_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${CALENDLY_CONFIG.TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!userResponse.ok) {
            throw new Error('Failed to fetch user info');
        }

        const userData = await userResponse.json();
        const userUri = userData.resource.uri;

        // 2. Fetch Scheduled Events
        // Add min_start_time to filter past events, but include all of today's events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const minStartTime = today.toISOString();

        const eventsResponse = await fetch(`${BASE_URL}/scheduled_events?user=${userUri}&status=active&sort=start_time:asc&min_start_time=${minStartTime}`, {
            headers: {
                'Authorization': `Bearer ${CALENDLY_CONFIG.TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!eventsResponse.ok) {
            throw new Error('Failed to fetch events');
        }

        const eventsData = await eventsResponse.json();
        const events = eventsData.collection;

        // 3. Fetch Invitee Details for each event to get the candidate name
        const eventsWithInvitees = await Promise.all(events.map(async (event) => {
            try {
                const inviteesResponse = await fetch(event.uri + '/invitees', {
                    headers: {
                        'Authorization': `Bearer ${CALENDLY_CONFIG.TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (inviteesResponse.ok) {
                    const inviteesData = await inviteesResponse.json();
                    const invitee = inviteesData.collection[0]; // Assuming single invitee for 1-on-1
                    if (invitee) {
                        return { ...event, candidate_name: invitee.name, candidate_email: invitee.email };
                    }
                }
                return event;
            } catch (err) {
                console.error(`Failed to fetch invitee for event ${event.uri}`, err);
                return event;
            }
        }));

        return eventsWithInvitees;

    } catch (error) {
        console.error('Calendly API Error:', error);
        return [];
    }
};
