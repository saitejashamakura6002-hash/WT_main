**Stage 1 — Initialize the Project**

mkdir student-management-backend
cd student-management-backend

npm init -y

**Install the first dependencies:**

npm install express mongoose dotenv

**Development dependency:**

npm install -D nodemon

**Update package.json:**

{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
**=========================================================================================**
**Stage 2 — Create the Basic Application Structure**

src/
├── config/
│   └── db.js
├── models/
│   └── Student.js
├── controllers/
│   └── studentController.js
├── routes/
│   └── studentRoutes.js
├── app.js
└── server.js
**============================================================================================**
**Stage 3 — MongoDB Connection**

**.env**

PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/student_management

**src/config/db.js**

const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
**================================================================================================**
**Stage 4 — Create Student Model**
**src/models/Student.js**
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    rollNo: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    department: {
      type: String,
      required: true
    },

    year: {
      type: Number,
      min: 1,
      max: 4
    },

    cgpa: {
      type: Number,
      min: 0,
      max: 10
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
  mongoose.model("Student", studentSchema);

**Students now learn:**
Schema
Model
Validation
default
unique
timestamps
**================================================================================================**

**Stage 5 — Student Controller**
**studentController.js**
**Start with CREATE:**
const Student =
  require("../models/Student");

const createStudent =
  async (req, res) => {

    const student =
      await Student.create(req.body);

    res.status(201).json({
      success: true,
      data: student
    });
  };

module.exports = {
  createStudent
};

**================================================================================================**

**Stage 6 — Student Router**
**studentRoutes.js**

const express = require("express");

const {
  createStudent
} = require(
  "../controllers/studentController"
);

const router = express.Router();

router.post("/", createStudent);

module.exports = router;

**================================================================================================**

**Stage 7 — app.js**

const express = require("express");
const studentRoutes =
  require("./routes/studentRoutes");
const app = express();

app.use(express.json());

app.use(
  "/api/students",
  studentRoutes
);
module.exports = app;
**================================================================================================**
Stage 8 — server.js
require("dotenv").config();

const app = require("./app");

const connectDB =
  require("./config/db");

const PORT =
  process.env.PORT || 3000;

const startServer = async () => {

  await connectDB();

  app.listen(PORT, () => {
    console.log(
      `Server running on port ${PORT}`
    );
  });
};

startServer();
**================================================================================================**

**Notice the separation:**
server.js
   ↓
Start infrastructure

app.js
   ↓
Configure Express

routes
   ↓
Map endpoints

controllers
   ↓
Business logic

models
   ↓
MongoDB

**================================================================================================**
**Stage 9 — Complete Student CRUD**
**Add these controller functions:**
**createStudent
getStudents
getStudentById
updateStudent
deleteStudent

**Routes:**
router.post("/", createStudent);

router.get("/", getStudents);

router.get("/:id", getStudentById);

router.put("/:id", updateStudent);

router.delete("/:id", deleteStudent);

**So the API becomes:**
Method	Endpoint	Function
POST	/api/students	Create
GET	/api/students	Read all
GET	/api/students/:id	Read one
PUT	/api/students/:id	Update
DELETE	/api/students/:id	Delete


At this stage there is no authentication.
First make CRUD work correctly.