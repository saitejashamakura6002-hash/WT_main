Login
  ↓
bcrypt.compare()
  ↓
Generate JWT
  ↓
Store JWT in HttpOnly Cookie
  ↓
Client sends cookie automatically
  ↓
JWT Middleware verifies token
  ↓
req.user
  ↓
Role Middleware
  ↓
Controller
  ↓
MongoDB

**Updated Folder Structure will be**

src/
│
├── config/
│   └── db.js
│
├── models/
│   ├── Student.js
│   └── User.js
│
├── controllers/
│   ├── studentController.js
│   └── authController.js
│
├── routes/
│   ├── studentRoutes.js
│   └── authRoutes.js
│
├── middleware/
│   ├── jwtAuth.js
│   └── roleMiddleware.js
│
├── services/
│   └── tokenService.js
│
└── server.js

**1. Install JWT**
Install:
npm install jsonwebtoken

**2. You can remove these later if you are completely switching away from sessions:**

npm uninstall express-session connect-mongo

**3. Update .env**

PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/student_management
JWT_SECRET=this_should_be_a_long_random_secret
JWT_EXPIRES_IN=15m
NODE_ENV=development

**4. Create Token Service**

**Create services/tokenService.js**

const jwt = require("jsonwebtoken");
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN
        || "15m"
    }
  );
};
module.exports = {
  generateToken
};

**5. Modify Login Controller**

**Open: controllers/authController.js**

Your registration logic using bcrypt can remain unchanged.

**Import:**
const bcrypt = require("bcrypt");
const User =
  require("../models/User");
const {
  generateToken
} =
require("../services/tokenService");

**Now change login().**
const login = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    const user =
      await User.findOne({
        email
      });

    if (!user) {
      return res
        .status(401)
        .json({
          message:
            "Invalid email or password"
        });
    }

    if (!user.active) {
      return res
        .status(403)
        .json({
          message:
            "Account is inactive"
        });
    }

    const passwordMatched =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatched) {
      return res
        .status(401)
        .json({
          message:
            "Invalid email or password"
        });
    }

    const token =
      generateToken(user);
    res.cookie(
      "accessToken",
      token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV
          === "production",
        sameSite: "lax",
        maxAge:
          15 * 60 * 1000
      }
    );

    res.status(200).json({
      message:
        "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

**6. Create JWT Authentication Middleware**

Create: middleware/jwtAuth.js

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

        // 4. Check whether account is active
        if (!user.active) {
            return res.status(403).json({
                message: "Account is inactive"
            });
        }

        // 5. Put user into request
        req.user = user;

        // 6. Continue to next middleware/route
        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });

    }
};

module.exports = requireJwtAuth;

**7. Change Student Routes**

Earlier you had:

const requireSessionAuth =
  require(
    "../middleware/sessionAuth"
  );

Remove it.

**Import:**
const requireJwtAuth =
  require(
    "../middleware/jwtAuth"
  );

const allowRoles =
  require(
    "../middleware/roleMiddleware"
  );

Your studentRoutes.js becomes:
const express =
  require("express");

const {

  createStudent,

  getStudents,

  getStudentById,

  updateStudent,

  deleteStudent

} =
require(
  "../controllers/studentController"
);


const requireJwtAuth =
  require(
    "../middleware/jwtAuth"
  );


const allowRoles =
  require(
    "../middleware/roleMiddleware"
  );


const router =
  express.Router();


// ADMIN ONLY
router.post(
  "/",
  requireJwtAuth,
  allowRoles("admin"),
  createStudent
);


// ADMIN ONLY
router.get(
  "/",
  requireJwtAuth,
  allowRoles("admin"),
  getStudents
);


// ADMIN ONLY
router.get(
  "/:id",
  requireJwtAuth,
  allowRoles("admin"),
  getStudentById
);


// ADMIN ONLY
router.put(
  "/:id",
  requireJwtAuth,
  allowRoles("admin"),
  updateStudent
);


// ADMIN ONLY
router.delete(
  "/:id",
  requireJwtAuth,
  allowRoles("admin"),
  deleteStudent
);


module.exports = router;

**Notice that these functions did not change:**
createStudent
getStudents
getStudentById
updateStudent
deleteStudent

Only authentication middleware changed.

**8. Add Current User Endpoint**

It is useful to verify which JWT user is currently authenticated.
**In authController.js:**

const getCurrentUser =
  async (req, res) => {

    res.status(200).json({

      user: {

        id:
          req.user._id,

        name:
          req.user.name,

        email:
          req.user.email,

        role:
          req.user.role

      }

    });

  };

Export:
module.exports = {
  register,
  login,
  logout,
  getCurrentUser
};

**9. Update Auth Router : routes/authRoutes.js**

const express =
  require("express");

const {

  register,

  login,

  logout,

  getCurrentUser

} =
require(
  "../controllers/authController"
);


const requireJwtAuth =
  require(
    "../middleware/jwtAuth"
  );


const router =
  express.Router();


router.post(
  "/register",
  register
);


router.post(
  "/login",
  login
);


router.post(
  "/logout",
  logout
);


router.get(
  "/me",
  requireJwtAuth,
  getCurrentUser
);


module.exports = router;

**Now you have:**
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

**10. JWT Logout**

JWT itself is stateless, so for this basic version logout means clearing the cookie.

**Add to authController.js:**

const logout = async (req, res) => {

  res.clearCookie(
    "accessToken",
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV
        === "production",

      sameSite: "lax"
    }
  );


  res.status(200).json({
    message:
      "Logout successful"
  });

};

**The browser no longer has the token, so subsequent protected requests fail.**

**11. Update server.js**

Previously you had session middleware.

**Remove:**
const sessionMiddleware =
  require("./config/session");

**and:**
app.use(
  sessionMiddleware
);

Keep cookie parser.

**Your server.js becomes:**

const express =
  require("express");

const cookieParser =
  require("cookie-parser");

const authRoutes =
  require("./routes/authRoutes");

const studentRoutes =
  require("./routes/studentRoutes");


const app =
  express();


app.use(
  express.json()
);


app.use(
  cookieParser()
);


app.use(
  "/api/auth",
  authRoutes
);


app.use(
  "/api/students",
  studentRoutes
);

Very clean.

**Test the Complete JWT Flow**

First register: POST /api/auth/register

{
  "name": "Ravi",
  "email": "ravi@gmail.com",
  "password": "ravi123"
}

Then login: POST /api/auth/login

{
  "email": "ravi@gmail.com",
  "password": "ravi123"
}

The response should create: accessToken cookie

Then test: GET /api/auth/me

The cookie is automatically sent by Thunder Client/Postman if cookie handling is enabled.

For a normal user: GET /api/students

should return: 403 Access denied

For an admin: GET /api/students

should work.

**Session Version vs JWT Version The only major replacement is:**

**BEFORE**

Login
 ↓
req.session.user
 ↓
Session stored in MongoDB
 ↓
connect.sid Cookie
 ↓
requireSessionAuth
 ↓
req.user

becomes:

**AFTER**

Login
 ↓
Generate JWT
 ↓
accessToken Cookie
 ↓
requireJwtAuth
 ↓
Verify JWT
 ↓
Find User
 ↓
req.user

Everything after req.user is almost unchanged:
req.user
   ↓
allowRoles("admin")
   ↓
studentController
   ↓
Student Model
   ↓
MongoDB
