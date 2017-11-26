import {Router} from "express";
import * as passport from "passport";
import {Strategy as GoogleStrategy} from "passport-google-oauth2";

import Settings from "../Settings";

function routeAuthGoogle(router: Router, auth) {
  const config = {
    clientID: auth.google.clientID,
    clientSecret: auth.google.clientSecret,
    callbackURL: "http://localhost:3000/!auth/google/callback",
    passReqToCallback: true
  };

  passport.use(new GoogleStrategy(config,
    (request, accessToken, refreshToken, profile, done) => {
      done(null, {id: profile.id, displayName: profile.displayName});
    }
  ));

  router.get("/!auth/google", passport.authenticate("google", {
    hd: auth.google.hostedDomain,
    scope: ["profile"]
  } as any));

  router.get("/!auth/google/callback",
    passport.authenticate("google"),
    (req, res) => {
      res.redirect(req.session.returnTo || "/");
      delete req.session.returnTo;
    });
}

export function authRoutes(router: Router, auth) {
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    done(null, {id});
  });

  router.use(passport.initialize());
  router.use(passport.session());

  routeAuthGoogle(router, auth);

  router.get("/!auth/logout", (req, res) => {
    if (req.logout) {
      req.logout();
    }
    res.redirect("/");
  });

}

export function ensureAuthenticated(req: Express.Request, res, next) {

  // if user is authenticated in the session, carry on
  if (isAuthenticated(req)) {
    return next();
  }

  // if they aren't redirect them to the home page
  req.session.returnTo = req.originalUrl;
  res.redirect("/!auth/google");
}

export function isAuthenticated(req: Express.Request) {
  return req.isAuthenticated() || !Settings.usesAuthentication;
}
