// api/alive.js
export default function handler(req, res) {
    // Set CORS headers for direct API requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS for CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Return health check response
    return res.status(200).json({
        status: "OK",
        message: "Server is Alive!"
    });
}
