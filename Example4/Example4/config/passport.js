const passport =
  require("passport");

const GoogleStrategy =
  require(
    "passport-google-oauth20"
  ).Strategy;

const User =
  require("../models/User");


passport.use(

  new GoogleStrategy(

    {

      clientID:
        process.env
          .GOOGLE_CLIENT_ID,

      clientSecret:
        process.env
          .GOOGLE_CLIENT_SECRET,

      callbackURL:
        process.env
          .GOOGLE_CALLBACK_URL

    },


    async (
      accessToken,
      refreshToken,
      profile,
      done
    ) => {

      try {


        // First check Google ID
        let user =
          await User.findOne({
            googleId:
              profile.id
          });


        if (user) {

          return done(
            null,
            user
          );

        }


        const email =
          profile.emails?.[0]
            ?.value;


        if (!email) {

          return done(
            new Error(
              "Google email not available"
            ),
            null
          );

        }


        // Check whether local account
        // already exists
        user =
          await User.findOne({
            email
          });


        if (user) {

          user.googleId =
            profile.id;

          user.provider =
            "google";

          await user.save();

        } else {

          user =
            await User.create({

              name:
                profile.displayName,

              email,

              googleId:
                profile.id,

              provider:
                "google",

              role:
                "user"

            });

        }


        return done(
          null,
          user
        );


      } catch (error) {

        return done(
          error,
          null
        );

      }

    }

  )

);


module.exports =
  passport;
