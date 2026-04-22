const https = require('https');
const url = 'https://docs.google.com/spreadsheets/d/1XWpGz-VdMof3Xo7Q1Z6O5Y9S558v_i_J8iW3A2g5M4c/edit';
function get(u) {
    https.get(u, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            get(res.headers.location);
            return;
        }
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            const matches = data.match(/\[\"[^\"]+\",\d+\]/g) || [];
            console.log('Found sheet info:');
            const unique = [...new Set(matches)];
            unique.forEach(m => console.log(m));
        });
    });
}
get(url);
