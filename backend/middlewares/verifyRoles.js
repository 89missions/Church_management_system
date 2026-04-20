const verifyRoles = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized. No user data." });
            }

            const userPositions = req.user.positions || [];
            
            const rolesToCheck = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
            
            const hasRole = rolesToCheck.some(role => userPositions.includes(role));

            if (!hasRole) {
                return res.status(403).json({ message: "Not allowed" });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    };
};

module.exports = verifyRoles;