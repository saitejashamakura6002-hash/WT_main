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