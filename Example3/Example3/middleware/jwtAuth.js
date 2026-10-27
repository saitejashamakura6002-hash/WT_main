const jwt = require("jsonwebtoken");
const User = require("../models/User");

const requireJwtAuth = async (req, res, next) => {

    try {

        // 1. Get token from cookie
        const token = req.cookies.accessToken;

        if (!token) {
            return res.status(401).json({
                message: "Please login first"
            });
        }

        // 2. Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // 3. Find user using ID from token
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        // 4. Put user into request
        req.user = user;

        // 5. Continue to next middleware/route
        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });

    }
};

module.exports = requireJwtAuth;
