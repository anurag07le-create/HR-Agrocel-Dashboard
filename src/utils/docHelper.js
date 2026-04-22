export const getDocUrls = (url) => {
    if (!url || typeof url !== 'string' || url.trim() === '' || url.toLowerCase() === 'n/a' || url.toLowerCase() === 'undefined' || url.toLowerCase() === 'null') {
        return { preview: null, download: null };
    }

    // Clean URL: remove all whitespace/newlines
    url = url.replace(/\s/g, '');

    // If it's already a preview/embedded URL, return it as is
    if (url.includes('embedded=true') || url.includes('/preview')) {
        return { preview: url, download: url.replace('/preview', '/view'), id: '' };
    }

    let id = '';
    const idMatch = url.match(/id=([^&]+)/);
    const fileMatch = url.match(/\/d\/([^/?]+)/);

    if (idMatch) {
        id = idMatch[1];
    } else if (fileMatch) {
        id = fileMatch[1];
    }

    if (!id) {
        // Fallback: If it's a direct link to a file (pdf, docx, etc.)
        if (url.startsWith('http')) {
            return {
                preview: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`,
                download: url,
                id: ''
            };
        }
        return { preview: null, download: null };
    }

    // Download URL
    const download = `https://drive.google.com/uc?export=download&id=${id}`;
    // Preview URL - Using native Google Drive preview
    const preview = `https://drive.google.com/file/d/${id}/preview`;

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
