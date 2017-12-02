import {Router} from "express";
import * as express from "express";
import * as _ from "lodash";
import * as passport from "passport";

import Settings from "../Settings";
import User from "../User";

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

  _.forEach(Settings.get().auth, (config, provider) => {
    const authRouter = express.Router();
    router.use(`/!auth/${provider}`, authRouter);
    require(`./${provider}`).configRoutes(authRouter, config);
  });

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

  const providers = _.keys(Settings.get().auth);
  if (providers.length === 1) {
    res.redirect(`/!auth/${providers[0]}`);
  } else {
    res.redirect("/");
  }
}

export function isAuthenticated(req: Express.Request) {
  return req.isAuthenticated() || !Settings.usesAuthentication;
}
