export const getDocUrls = (url) => {
    if (!url) return { preview: '', download: '' };

    // Clean URL: remove all whitespace/newlines which might come from bad CSV data
    url = url.replace(/\s/g, '');

    let id = '';
    // Match id=... until & or end of string
    const idMatch = url.match(/id=([^&]+)/);
    // Match /d/... until / or ? or end of string
    const fileMatch = url.match(/\/d\/([^/?]+)/);

    if (idMatch) {
        id = idMatch[1];
    } else if (fileMatch) {
        id = fileMatch[1];
    }

    if (!id) {
        // Fallback: If we can't extract ID, try using Google Docs Viewer with the original URL
        // This might work for some non-Drive URLs or weird formats
        return {
            preview: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`,
            download: url,
            id: ''
        };
    }

    // Download URL
    const download = `https://drive.google.com/uc?export=download&id=${id}`;

    // Preview URL - Using Google Docs Viewer which is more reliable for embedding
    const preview = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(download)}`;

    return { preview, download, id };
};

export const shareDoc = async (title, url) => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: `Check out this document: ${title}`,
                url: url
            });
        } catch (err) {
            console.error('Error sharing:', err);
        }
    } else {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
    }
};
