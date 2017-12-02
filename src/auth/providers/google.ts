import {Router} from "express";
import * as _ from "lodash";
import * as passport from "passport";
import {Strategy} from "passport-google-oauth2";
import {IAuthProvider, IAuthProviderInfo} from "../passport";

export interface IAuthGoogle {
  clientID: string;
  clientSecret: string;
  domains?: string[];
  callbackUrl: string;
}

const info: IAuthProviderInfo = {
  label: "Google",
  help: "https://developers.google.com/identity/protocols/OAuth2",
  domains: "Domains",
  inputs: [{
    id: "clientID",
    required: true,
    label: "Client ID",
    placeholder: "OAuth2 Client ID for your registered Google application"
  }, {
    id: "clientSecret",
    required: true,
    protected: true,
    label: "Client Secret",
    placeholder: "OAuth2 Client Secret for your registered Google application"
  }, {
    id: "domains",
    editable: true,
    label: "Limit to Domains",
    placeholder: "my-gsuite-domain.com, another-domain.com",
    type: "string[]"
  }]
};

function configRoutes(router: Router, auth: IAuthGoogle) {
  const config = {
    clientID: auth.clientID,
    clientSecret: auth.clientSecret,
    callbackURL: auth.callbackUrl,
    passReqToCallback: true
  };

  passport.use(new Strategy(config,
    (request, accessToken, refreshToken, profile, done) => {
      if (_.isEmpty(auth.domains) && !_.includes(auth.domains, profile._json.domain)) {
        console.warn(`Invalid domain [${profile._json.domain}], [${auth.domains}]`);
        done(new Error("Invalid domain"));
      } else {
        done(null, {
          provider: profile.provider,
          id: `google:${profile.id}`,
          email: profile.email,
          name: profile.displayName
        });
      }
    }
  ));

  router.get("/", passport.authenticate("google", {
    hd: _.first(auth.domains),
    scope: ["profile", "email"],
    failureRedirect: "/"
  } as any));

  router.get("/callback",
    passport.authenticate("google"),
    (req, res) => {
      res.redirect(req.session.returnTo || "/");
      delete req.session.returnTo;
    });

}

const authProvider: IAuthProvider = {
  info, configRoutes
};

export default authProvider;
