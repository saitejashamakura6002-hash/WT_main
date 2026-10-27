const express = require("express");

const {register,login,logout} = require("../controllers/authController");
const requireSessionAuth=require("../middleware/sessionAuth");

const router=express.Router();

router.post("/register",register);
router.post("/login",login);
router.post("/logout",requireSessionAuth,logout);
module.exports = router;