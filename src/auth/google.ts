import {Router} from "express";
import * as passport from "passport";
import {Strategy} from "passport-google-oauth2";

export interface IAuthGoogle {
  clientID: string;
  clientSecret: string;
  hostedDomain: string;
  callbackUrl: string;
}

export function configRoutes(router: Router, auth: IAuthGoogle) {
  const config = {
    clientID: auth.clientID,
    clientSecret: auth.clientSecret,
    callbackURL: auth.callbackUrl,
    passReqToCallback: true
  };

  passport.use(new Strategy(config,
    (request, accessToken, refreshToken, profile, done) => {
      if (profile._json.domain !== auth.hostedDomain) {
        console.warn(`Invalid domain [${profile._json.domain}]`);
        done(new Error("Invalid host domain"));
      } else {
        done(null, {
          provider: profile.provider,
          id: profile.id,
          email: profile.email,
          name: profile.displayName
        });
      }
    }
  ));

  router.get("/", passport.authenticate("google", {
    hd: auth.hostedDomain,
    scope: ["profile", "email"]
  } as any));

  router.get("/callback",
    passport.authenticate("google"),
    (req, res) => {
      res.redirect(req.session.returnTo || "/");
      delete req.session.returnTo;
    });

}
