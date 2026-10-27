const express = require("express");
const router = express.Router();
const requireSessionAuth = require("../middleware/sessionAuth");
const allowRoles = require("../middleware/roleMiddleware");

const {
    createStudent,
    readStudent,
    getStudentById,
    updateStudent,
    deleteStudent
} = require("../controllers/studentController");


router.post("/student",requireSessionAuth, allowRoles("admin","user"),createStudent);
router.get("/student",requireSessionAuth,allowRoles("user"),readStudent);
router.get("/student/:id",requireSessionAuth,allowRoles("admin"),getStudentById);
router.put("/student/:id",requireSessionAuth,allowRoles("admin"),updateStudent);
router.delete("/student/:id",requireSessionAuth,allowRoles("admin"),deleteStudent);

module.exports = router;