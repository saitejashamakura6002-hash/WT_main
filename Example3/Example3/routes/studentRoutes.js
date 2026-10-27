const express = require("express");
const router = express.Router();
//const requireSessionAuth = require("../middleware/sessionAuth");
const requireJwtAuth =  require("../middleware/jwtAuth");
const allowRoles = require("../middleware/roleMiddleware");

const {
    createStudent,
    readStudent,
    getStudentById,
    updateStudent,
    deleteStudent
} = require("../controllers/studentController");


router.post("/student",requireJwtAuth, allowRoles("admin","user"),createStudent);
router.get("/student",requireJwtAuth,allowRoles("user"),readStudent);
router.get("/student/:id",requireJwtAuth,allowRoles("admin"),getStudentById);
router.put("/student/:id",requireJwtAuth,allowRoles("admin"),updateStudent);
router.delete("/student/:id",requireJwtAuth,allowRoles("admin"),deleteStudent);

module.exports = router;