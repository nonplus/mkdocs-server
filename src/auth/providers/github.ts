import {Router} from "express";
import * as _ from "lodash";
import * as passport from "passport";
import {Strategy} from "passport-github";
import {IAuthProvider, IAuthProviderInfo} from "../passport";

export interface IAuthGithub {
  clientID: string;
  clientSecret: string;
  domains?: string[];
  callbackUrl: string;
}

const info: IAuthProviderInfo = {
  label: "GitHub",
  help: "https://developer.github.com/apps/building-integrations/setting-up-and-registering-oauth-apps/",
  domains: "Domains",
  inputs: [{
    id: "clientID",
    required: true,
    label: "Client ID",
    placeholder: "OAuth2 Client ID for your registered GitHub application"
  }, {
    id: "clientSecret",
    required: true,
    protected: true,
    label: "Client Secret",
    placeholder: "OAuth2 Client Secret for your registered GitHub application"
  }]
};

function configRoutes(router: Router, auth: IAuthGithub) {
  const config = {
    clientID: auth.clientID,
    clientSecret: auth.clientSecret,
    callbackURL: auth.callbackUrl,
    passReqToCallback: true
  };

  passport.use(new Strategy(config,
    (request, accessToken, refreshToken, profile, done) => {
      done(null, {
        provider: profile.provider,
        id: `github:${profile.id}`,
        email: profile._json.email,
        name: profile.displayName
      });
    }
  ));

  router.get("/", passport.authenticate("github", {
    scope: ["read:user", "user:email"],
    failureRedirect: "/"
  } as any));

  router.get("/callback",
    passport.authenticate("github"),
    (req, res) => {
      res.redirect(req.session.returnTo || "/");
      delete req.session.returnTo;
    });

}

const authProvider: IAuthProvider = {
  info, configRoutes
};

export default authProvider;
