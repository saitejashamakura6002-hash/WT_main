const express = require("express");
const router = express.Router();

const {
  createStudent,
  readStudent,
  getStudentById,
  updateStudent,
  deleteStudent
} = require("../controllers/studentController");

router.post("/student", createStudent);
router.get("/student", readStudent);
router.get("/student/:id", getStudentById);
router.put("/student/:id", updateStudent);
router.delete("/student/:id", deleteStudent);

module.exports = router;