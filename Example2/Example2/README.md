student-management-backend/
│
├── config/
│   ├── db.js
│   └── session.js
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
│   ├── sessionAuth.js
│   └── roleMiddleware.js
│
├── app.js
└── server.js

**Stage 10 — Add User Model**
**Now introduce authentication.**
**Install:**

npm install bcrypt

**Create:**
**src/models/User.js**

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
        type: String
      },

      role: {
        type: String,
        enum: [
          "admin",
          "user"
        ],
        default: "user"
      }
  );

module.exports =
  mongoose.model(
    "User",
    userSchema
  );

The important relationship is:
User
  |
  └── student
        ↓
    Student document

**==================================================================================================**

**Stage 11 — Registration with bcrypt**
**First install:**

npm install bcrypt

**Now create a new controller:**
src/controllers/authController.js

**Do not put registration code in server.js or User.js.**

**src/controllers/authController.js**

const bcrypt = require("bcrypt");
const User = require("../models/User");
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
        message: "Email already registered"
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
      await User.create({ name, email,password:hashedPassword,role: "user"});

    res.status(201).json({

      message:
        "User registered successfully",

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


module.exports = {
  register
};

**So the flow is:**
POST /register
      ↓
authRoutes.js
      ↓
register()
      ↓
bcrypt.hash()
      ↓
User.create()
      ↓
MongoDB
**==================================================================================================**
**Stage 12 — Create Auth Router**
**Create:**
src/routes/authRoutes.js

const express = require("express");

const {
  register
} = require(
  "../controllers/authController"
);

const router =
  express.Router();


router.post(
  "/register",
  register
);


module.exports = router;

**Now your auth route is:**
POST /api/auth/register
**==================================================================================================**
**Stage 13 — Connect Auth Router in app.js**
**Your app.js currently probably looks approximately like:**
const express =
  require("express");

const studentRoutes =
  require("./routes/studentRoutes");

const app =
  express();

app.use(
  express.json()
);

app.use(
  "/api/students",
  studentRoutes
);

module.exports = app;

**Now add authRoutes.**
**Updated src/app.js**
const express =
  require("express");

const studentRoutes =
  require("./routes/studentRoutes");

const authRoutes =
  require("./routes/authRoutes");
const app =   express();
app.use(  express.json());

app.use(  "/api/auth",  authRoutes);

app.use(  "/api/students",  studentRoutes);
module.exports = app;

**Now:**
POST /api/auth/register

will call:
authRoutes
   ↓
register
**==================================================================================================**

**Stage 14 — Test Registration**
**Using Postman/Thunder Client:**
POST http://localhost:3000/api/auth/register

Body:
{
  "name": "Ravi",
  "email": "ravi@gmail.com",
  "password": "ravi123"
}

MongoDB should contain something like:
{
  "_id": "...",
  "name": "Ravi",
  "email": "ravi@gmail.com",
  "password": "$2b$12$...",
  "role": "user"
}

**Notice that this should not be stored:**
ravi123

bcrypt stores a hash instead.
**==================================================================================================**
**Stage 15 — Add Login**
**Do not create another controller file.**
**Add login to:**
src/controllers/authController.js

**Below register, add:**
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

      return res.status(401).json({
        message:
          "Invalid email or password"
      });

    }


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

**At the bottom change:**
module.exports = {
  register,
  login
};
**==================================================================================================**
**Stage 16 — Add Login Route**
**Go to:**
src/routes/authRoutes.js

**Change:**
const {
  register,
  login
} = require(
  "../controllers/authController"
);

**Then add:**
router.post(
  "/login",
  login
);

**Complete router:**
const express =
  require("express");

const {
  register,
  login
} = require(
  "../controllers/authController"
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


module.exports = router;

**Now:**
POST /api/auth/register

POST /api/auth/login

both work.
At this point login verifies the password, but it does not yet remember the logged-in user.
That is what Session does next.

**Stage 17 — Add Session and Cookie**
**Install:**
npm install express-session connect-mongo cookie-parser

**Create:**
src/config/session.js

src/config/session.js

const session =
  require("express-session");

const MongoStore =
  require("connect-mongo");


const sessionMiddleware =
  session({

    secret:
      process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,


    store:
      MongoStore.create({

        mongoUrl:
          process.env.MONGO_URI

      }),


    cookie: {

      httpOnly: true,

      secure: false,

      sameSite: "lax",

      maxAge:
        30 * 60 * 1000

    }

  });


module.exports =
  sessionMiddleware;

**Add to .env:**
PORT=3000

MONGO_URI=mongodb://127.0.0.1:27017/student_management

SESSION_SECRET="abc12345"

**==================================================================================================**

**Stage 18 — Register Session in app.js**
**Update:**
src/app.js

**Add imports:**
const cookieParser =
  require("cookie-parser");

const sessionMiddleware =
  require("./config/session");

**Then middleware order should be:**
app.use(
  express.json()
);

app.use(
  cookieParser()
);

app.use(
  sessionMiddleware
);

**So complete app.js now becomes:**
const express =
  require("express");

const cookieParser =
  require("cookie-parser");

const sessionMiddleware =
  require("./config/session");

const studentRoutes =
  require("./routes/studentRoutes");

const authRoutes =
  require("./routes/authRoutes");


const app =
  express();


app.use(
  express.json()
);


app.use(
  cookieParser()
);


app.use(
  sessionMiddleware
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

**==================================================================================================**

**Stage 19 — Save User into Session During Login**
**Now return to:**
src/controllers/authController.js

**Inside login(), after password validation, add:**

req.session.user = {

  id: user._id,

  email: user.email,

  role: user.role

};

**So this part becomes:**
if (!passwordMatched) {

  return res.status(401).json({
    message:
      "Invalid email or password"
  });

}


req.session.user = {

  id: user._id,

  email: user.email,

  role: user.role

};


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

**Now the flow is:**
Login
  ↓
bcrypt.compare()
  ↓
Correct password
  ↓
Create Session
  ↓
Session stored in MongoDB
  ↓
Session ID returned in Cookie

**==================================================================================================**

**Stage 20 — Create Authentication Middleware**
**Create folder/file:**
**src/middleware/sessionAuth.js**

const requireSessionAuth =
  (req, res, next) => {

    if (
      !req.session ||
      !req.session.user
    ) {

      return res
        .status(401)
        .json({

          message:
            "Please login first"

        });

    }


    req.user =
      req.session.user;


    next();
  };


module.exports =
  requireSessionAuth;

**This middleware checks:**
Does user have a valid session?

**==================================================================================================**

**Stage 21 — Protect Student Routes**
**Now open:**
src/routes/studentRoutes.js

**Import:**
const requireSessionAuth =
  require(
    "../middleware/sessionAuth"
  );

**Suppose you currently have:**
router.get(
  "/",
  getStudents
);

**Change to:**
router.get(
  "/",
  requireSessionAuth,
  getStudents
);

**Now:**
GET /api/students

requires login.
Flow:
GET /api/students
       ↓
requireSessionAuth
       ↓
Logged in?
   /          \
 no            yes
 ↓              ↓
401        getStudents()

**==================================================================================================**

**Stage 22 — Add RBAC**
**Create:**
**src/middleware/roleMiddleware.js**

const allowRoles =
  (...roles) => {

    return (
      req,
      res,
      next
    ) => {

      if (
        !roles.includes(
          req.user.role
        )
      ) {

        return res
          .status(403)
          .json({

            message:
              "Access denied"

          });

      }


      next();
    };

  };


module.exports =
  allowRoles;

**==================================================================================================**

**Stage 23 — Admin vs User Permissions**
**Open:**
src/routes/studentRoutes.js

**Import:**
const requireSessionAuth =
  require(
    "../middleware/sessionAuth"
  );

const allowRoles =
  require(
    "../middleware/roleMiddleware"
  );

**Then configure routes.**
**Admin creates students**
router.post(
  "/",

  requireSessionAuth,

  allowRoles("admin"),

  createStudent
);

**Admin sees all students**
router.get(
  "/",

  requireSessionAuth,

  allowRoles("admin"),

  getStudents
);

**Admin sees student by ID**
router.get(
  "/:id",

  requireSessionAuth,

  allowRoles("admin"),

  getStudentById
);

**Admin updates**
router.put(
  "/:id",

  requireSessionAuth,

  allowRoles("admin"),

  updateStudent
);

**Admin deletes**
router.delete(
  "/:id",

  requireSessionAuth,

  allowRoles("admin"),

  deleteStudent
);

**Complete route flow:**
Request
   ↓
Session Authentication
   ↓
Role Check
   ↓
Controller
   ↓
Student Model
   ↓
MongoDB
**==================================================================================================**


**Stage 24 — How to Create an Admin**
**Currently registration forces:**
**role: "user"**

**That is intentional.**
Do not allow someone to register like:
{
  "role": "admin"
}

because anyone could become an administrator.
For teaching, after creating a user, change one user directly in MongoDB:
role: "admin"

Later we can build a proper admin-management endpoint.

**==================================================================================================**
**Stage 25 — Logout**
**Add this to:**
**src/controllers/authController.js**

const logout = async (
  req,
  res
) => {

  req.session.destroy(
    error => {

      if (error) {

        return res
          .status(500)
          .json({

            message:
              "Logout failed"

          });

      }


      res.clearCookie(
        "connect.sid"
      );


      res.status(200)
        .json({

          message:
            "Logout successful"

        });

    }
  );

};

Export:
module.exports = {
  register,
  login,
  logout
};

**Then in:**
**authRoutes.js**

**add:**
router.post(
  "/logout",
  requireSessionAuth,
  logout
);

**At This Point Stop**

Before introducing JWT, make sure these work:

POST /api/auth/register
       ↓
user stored with bcrypt password

POST /api/auth/login
       ↓
session created

Cookie
       ↓
stored in browser/Postman

GET /api/students
       ↓
session checked

Admin
       ↓
allowed

User
       ↓
forbidden

POST /api/auth/logout
       ↓
session destroyed

Your structure should now be:
src/
│
├── config/
│   ├── db.js
│   └── session.js
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
│   ├── sessionAuth.js
│   └── roleMiddleware.js
│
├── app.js
└── server.js