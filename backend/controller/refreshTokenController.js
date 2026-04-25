const jwt = require('jsonwebtoken');

const refreshAccessToken = (req, res) => {
    try {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            return res.status(401).json({ 
                success: false, 
                message: "Refresh token required" 
            });
        }

        // Verify the refresh token
        let decoded;
        try {
            decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
        } catch (err) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid or expired refresh token" 
            });
        }

        // Generate new access token
        const access_token = jwt.sign(
            {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                positions: decoded.positions
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            success: true,
            access_token: access_token
        });

    } catch (error) {
        console.error('Error refreshing token:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

module.exports = { refreshAccessToken };