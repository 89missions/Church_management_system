const jwt = require('jsonwebtoken');

const verifyJWT = async (req, res, next) => {
    try {
        // Get the token from the Authorization header
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (!authHeader) {
            return res.status(401).json({ message: "Authorization header missing." });
        }

        // Check if the token is a Bearer token
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: "Token missing from Authorization header." });
        }

        // Verify the token
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: "Invalid or expired token." });
            }

            // Attach the decoded token to the request object
            req.user = decoded;
            next();
        });
    } catch (error) {
        console.error("Error verifying JWT:", error.message);
        return res.status(500).json({ message: "Internal Server Error." });
    }
};

module.exports = verifyJWT;