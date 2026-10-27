const express = require("express");

const {register,login,logout,getCurrentUser} = require("../controllers/authController");
// const requireSessionAuth=require("../middleware/sessionAuth");
const requireJwtAuth=require("../middleware/jwtAuth");

const router=express.Router();

router.post("/register",register);
router.post("/login",login);
router.get("/me",requireJwtAuth,getCurrentUser);
router.post("/logout",requireJwtAuth,logout);

module.exports = router;