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

          secure:false,          

          sameSite: "lax",

          maxAge:
            15 * 60 * 1000

        }
      );


      res.status(200).json({

        message:
          "Google login successful",
          token,

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