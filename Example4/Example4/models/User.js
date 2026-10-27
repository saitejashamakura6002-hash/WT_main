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