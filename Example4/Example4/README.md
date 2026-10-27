**Stage 32 — Install Google OAuth Packages**
**Install:**

npm install passport passport-google-oauth20

Your JWT packages should already include:
npm install jsonwebtoken cookie-parser

**================================================================================================**
**Stage 33 — Update Folder Structure**
**Add:**
src/
│
├── config/
│   ├── db.js
│   └── passport.js          ← NEW
│
├── models/
│   ├── Student.js
│   └── User.js
│
├── controllers/
│   ├── studentController.js
│   └── authController.js
│
├── middleware/
│   ├── jwtAuth.js
│   └── roleMiddleware.js
│
├── services/
│   └── tokenService.js
│
├── routes/
│   ├── studentRoutes.js
│   └── authRoutes.js
│
├── app.js
└── server.js

**We do not change:**
Student.js
studentController.js
roleMiddleware.js
student CRUD logic

**================================================================================================**

**Stage 34 — Add Google Credentials**
Update .env:
PORT=3000

MONGO_URI=mongodb://127.0.0.1:27017/student_management

JWT_SECRET="Hello1234"
JWT_EXPIRES_IN=15m

GOOGLE_CLIENT_ID=your_google_client_id

GOOGLE_CLIENT_SECRET=your_google_client_secret

GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

NODE_ENV=development

In Google Cloud Console, configure the authorized redirect URI as:
http://localhost:3000/api/auth/google/callback

The callback URL must match exactly.

**================================================================================================**

**Stage 35 — Modify User.js**

**Your existing local users have:**
email
password
role

**Google users do not need a local password.**
**Update:**
models/User.js

Example:
const mongoose = require("mongoose");

const userSchema =
  new mongoose.Schema(
    {

      name: {
        type: String,
        required: true
      },

      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
      },

      password: {

        type: String,

        required: function () {

          return (
            this.provider === "local"
          );

        }

      },

      role: {

        type: String,

        enum: [
          "admin",
          "user"
        ],

        default: "user"
      },

      provider: {

        type: String,

        enum: [
          "local",
          "google"
        ],

        default: "local"
      },

      googleId: {

        type: String,

        unique: true,

        sparse: true

      },

      active: {

        type: Boolean,

        default: true

      }

    },

    {
      timestamps: true
    }

  );


module.exports =
  mongoose.model(
    "User",
    userSchema
  );

**Important:**
sparse: true

allows local users to have no googleId.


**================================================================================================**

**Stage 36 — Create Passport Configuration**
**Create:**
**src/config/passport.js**

const passport =
  require("passport");

const GoogleStrategy =
  require(
    "passport-google-oauth20"
  ).Strategy;

const User =
  require("../models/User");


passport.use(

  new GoogleStrategy(

    {

      clientID:
        process.env
          .GOOGLE_CLIENT_ID,

      clientSecret:
        process.env
          .GOOGLE_CLIENT_SECRET,

      callbackURL:
        process.env
          .GOOGLE_CALLBACK_URL

    },


    async (
      accessToken,
      refreshToken,
      profile,
      done
    ) => {

      try {


        // First check Google ID
        let user =
          await User.findOne({
            googleId:
              profile.id
          });


        if (user) {

          return done(
            null,
            user
          );

        }


        const email =
          profile.emails?.[0]
            ?.value;


        if (!email) {

          return done(
            new Error(
              "Google email not available"
            ),
            null
          );

        }


        // Check whether local account
        // already exists
        user =
          await User.findOne({
            email
          });


        if (user) {

          user.googleId =
            profile.id;

          user.provider =
            "google";

          await user.save();

        } else {

          user =
            await User.create({

              name:
                profile.displayName,

              email,

              googleId:
                profile.id,

              provider:
                "google",

              role:
                "user"

            });

        }


        return done(
          null,
          user
        );


      } catch (error) {

        return done(
          error,
          null
        );

      }

    }

  )

);


module.exports =
  passport;

The important logic is:
Google authenticates user
       ↓
Get Google profile
       ↓
Find googleId
       ↓
If not found
       ↓
Find same email
       ↓
Link account OR create user
       ↓
Return application User

**================================================================================================**

**Stage 37 — Initialize Passport**
**Open:**
**src/app.js**

**Import:**
const passport =
  require("./config/passport");

**Then:**
app.use(
  express.json()
);

app.use(
  cookieParser()
);

app.use(
  passport.initialize()
);

**Complete important part:**
const express =
  require("express");

const cookieParser =
  require("cookie-parser");

const passport =
  require("./config/passport");

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
  passport.initialize()
);


app.use(
  "/api/auth",
  authRoutes
);


app.use(
  "/api/students",
  studentRoutes
);


module.exports = app;

**Notice:**
passport.session()

**is not needed.**
**Why?**
Because after Google authentication, we are going to issue our own JWT.

**================================================================================================**

**Stage 38 — Add Google Login Route**
**Open:**
**routes/authRoutes.js**

**Import:**
const passport =
  require("passport");

Add:
router.get(

  "/google",

  passport.authenticate(

    "google",

    {

      scope: [
        "profile",
        "email"
      ]

    }

  )

);

**The URL becomes:**
GET /api/auth/google

**When opened in a browser:**
Your Backend
     ↓
Google Login
     ↓
Google Consent

**================================================================================================**

**Stage 39 — Add Google Callback Route**
In the same file:
router.get(

  "/google/callback",

  passport.authenticate(

    "google",

    {

      session: false,

      failureRedirect:
        "/api/auth/google/failure"

    }

  ),

  googleCallback

);

**So import googleCallback:**
const {

  register,

  login,

  logout,

  getCurrentUser,

  googleCallback

} =
require(
  "../controllers/authController"
);

**================================================================================================**

**Stage 40 — Create googleCallback**
**Open:**
**controllers/authController.js**

**Replace the entire authController.js with the below code**
const bcrypt = require("bcrypt");
const User = require("../models/User");

const {
  generateToken
} = require("../services/tokenServices");


// ----------------------------------------------------
// REGISTER
// ----------------------------------------------------

const register = async (req, res) => {

  try {

    const {
      name,
      email,
      password
    } = req.body;


    // Check whether user already exists
    const existingUser =
      await User.findOne({
        email
      });


    if (existingUser) {

      return res.status(409).json({

        message:
          "Email already registered"

      });

    }


    // Hash password
    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );


    // Store user in MongoDB
    const user =
      await User.create({

        name,

        email,

        password:
          hashedPassword,

        // Public registration should
        // not allow admin creation
        role: "user",

        provider: "local"

      });


    res.status(201).json({

      message:
        "User registered successfully",

      user: {

        id:
          user._id,

        name:
          user.name,

        email:
          user.email,

        role:
          user.role

      }

    });


  } catch (error) {

    res.status(500).json({

      message:
        error.message

    });

  }

};


// ----------------------------------------------------
// LOGIN
// ----------------------------------------------------

const login = async (req, res) => {

  try {

    const {
      email,
      password
    } = req.body;


    // Find user
    const user =
      await User.findOne({
        email
      });


    // IMPORTANT:
    // Check user BEFORE accessing user.password
    if (!user || !user.password) {

      return res.status(401).json({

        message:
          "Invalid email or password"

      });

    }


    // Check account status
    if (!user.active) {

      return res.status(403).json({

        message:
          "Account is inactive"

      });

    }


    // Compare password
    const passwordMatched =
      await bcrypt.compare(

        password,

        user.password

      );


    if (!passwordMatched) {

      return res.status(401).json({

        message:
          "Invalid email or password"

      });

    }


    // Generate JWT
    const token =
      generateToken(user);


    // Store JWT in HttpOnly cookie
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

        id:
          user._id,

        name:
          user.name,

        email:
          user.email,

        role:
          user.role

      }

    });


  } catch (error) {

    res.status(500).json({

      message:
        error.message

    });

  }

};


// ----------------------------------------------------
// GOOGLE CALLBACK
// ----------------------------------------------------

const googleCallback =
  async (req, res) => {

    try {

      const user =
        req.user;


      if (!user) {

        return res.status(401).json({

          message:
            "Google authentication failed"

        });

      }


      if (!user.active) {

        return res.status(403).json({

          message:
            "Account is inactive"

        });

      }


      // Same JWT used for normal login
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
          "Google login successful",

        user: {

          id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          role:
            user.role,

          provider:
            user.provider

        }

      });


    } catch (error) {

      res.status(500).json({

        message:
          error.message

      });

    }

  };


// ----------------------------------------------------
// GET CURRENT USER
// ----------------------------------------------------

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
          req.user.role,

        provider:
          req.user.provider

      }

    });

  };


// ----------------------------------------------------
// LOGOUT
// ----------------------------------------------------

const logout =
  async (req, res) => {

    // JWT version:
    // No req.session.destroy()

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


// ----------------------------------------------------
// EXPORTS
// ----------------------------------------------------

module.exports = {

  register,

  login,

  logout,

  getCurrentUser,

  googleCallback

};

**================================================================================================**

**Stage 41 — Add Failure Route**
**Inside authRoutes.js:**

router.get(
  "/google/failure",
  (req, res) => {

    res
      .status(401)
      .json({

        message:
          "Google authentication failed"

      });

  }
);

**Final authRoutes.js**
**It will approximately become:**
const express =
  require("express");

const passport =
  require("passport");

const {

  register,

  login,

  logout,

  getCurrentUser,

  googleCallback

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


router.get(

  "/google",

  passport.authenticate(

    "google",

    {
      scope: [
        "profile",
        "email"
      ]
    }

  )

);


router.get(

  "/google/callback",

  passport.authenticate(

    "google",

    {
      session: false,

      failureRedirect:
        "/api/auth/google/failure"
    }

  ),

  googleCallback

);


router.get(
  "/google/failure",
  (req, res) => {

    res
      .status(401)
      .json({

        message:
          "Google authentication failed"

      });

  }
);


module.exports =
  router;

What Happens During Google Login
The complete flow is:
GET /api/auth/google
        ↓
Passport
        ↓
Google
        ↓
User signs in
        ↓
Google redirects to
/api/auth/google/callback
        ↓
Passport verifies Google identity
        ↓
Find/Create User in MongoDB
        ↓
req.user
        ↓
googleCallback()
        ↓
generateToken(user)
        ↓
JWT
        ↓
HttpOnly accessToken Cookie

After this, Google users and normal users enter exactly the same system.
Local Login vs Google Login
Local
Email + Password
       ↓
bcrypt.compare()
       ↓
User
       ↓
generateToken()

Google
Google Identity
       ↓
Passport
       ↓
User
       ↓
generateToken()

Both converge here:
                    User
                     ↓
              generateToken()
                     ↓
                   JWT
                     ↓
             HttpOnly Cookie
                     ↓
                jwtAuth
                     ↓
                 req.user
                     ↓
                 RBAC

That convergence is the most important architecture concept.
RBAC Does Not Change
Your existing:
allowRoles("admin")

continues working.
For example:
router.delete(
  "/:id",

  requireJwtAuth,

  allowRoles("admin"),

  deleteStudent
);

It does not matter whether the user logged in using:
password

or:
Google

The role still comes from your MongoDB user record.
Never Let Google Decide Admin Role
New Google users should always get:
role: "user"

Never do something like:
role:
  profile.role

Google authentication proves identity.
Your application determines authorization.
Google
   ↓
Who is this user?

Your MongoDB
   ↓
What can this user do?

Final Route Map
Method	Endpoint	Purpose
POST	/api/auth/register	Local registration
POST	/api/auth/login	Local password login
GET	/api/auth/google	Start Google authentication
GET	/api/auth/google/callback	Google callback
GET	/api/auth/me	Current JWT user
POST	/api/auth/logout	Clear JWT cookie
POST	/api/students	Admin creates
GET	/api/students	Role-controlled read
GET	/api/students/:id	Role-controlled read
PUT	/api/students/:id	Admin updates
DELETE	/api/students/:id	Admin deletes


Your original guide's Student CRUD controller can remain intact because those CRUD functions are already isolated behind the router/controller/model structure.     Student_Management_Backend_Stag…
Final architecture
                    Authentication
                   /              \
                  /                \
          Local Login           Google Login
              ↓                     ↓
          bcrypt                OAuth/OIDC
              \                     /
               \                   /
                    User
                     ↓
                Generate JWT
                     ↓
             HttpOnly Cookie
                     ↓
               JWT Middleware
                     ↓
                  req.user
                     ↓
               Role Middleware
                     ↓
            Student Controller
                     ↓
               Mongoose Model
                     ↓
                  MongoDB