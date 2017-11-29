import {Router} from "express";
import * as passport from "passport";
import {Strategy as GoogleStrategy} from "passport-google-oauth2";

import Settings from "../Settings";
import User from "../User";

function routeAuthGoogle(router: Router, auth) {
  const config = {
    clientID: auth.google.clientID,
    clientSecret: auth.google.clientSecret,
    callbackURL: auth.google.callbackUrl,
    passReqToCallback: true
  };

  passport.use(new GoogleStrategy(config,
    (request, accessToken, refreshToken, profile, done) => {
      done(null, {
        provider: profile.provider,
        id: profile.id,
        email: profile.email,
        name: profile.displayName
      });
    }
  ));

  router.get("/!auth/google", passport.authenticate("google", {
    hd: auth.google.hostedDomain,
    scope: ["profile", "email"]
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
    const existingUser = User.resolve(user.id);
    if (!existingUser) {
      User.add(user);
    } else {
      existingUser.update(user);
    }
    done(null, user.id);
  });

  passport.deserializeUser((id: string, done) => {
    const user = User.resolve(id);
    done(null, user);
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
  if (req.session) {
    req.session.returnTo = req.originalUrl;
  }
  res.redirect("/!auth/google");
}

export function isAuthenticated(req: Express.Request) {
  return req.isAuthenticated() || !Settings.usesAuthentication;
}
