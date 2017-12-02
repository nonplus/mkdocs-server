import {Router} from "express";
import * as _ from "lodash";
import * as passport from "passport";
import {Strategy} from "passport-slack";
import {IAuthProvider, IAuthProviderInfo} from "../passport";

export interface IAuthSlack {
  clientID: string;
  clientSecret: string;
  domains?: string[];
  callbackUrl: string;
}

const info: IAuthProviderInfo = {
  label: "Slack",
  help: "https://api.slack.com/docs/oauth",
  domains: "Teams",
  inputs: [{
    id: "clientID",
    required: true,
    label: "Client ID",
    placeholder: "OAuth2 Client ID for your registered Slack application"
  }, {
    id: "clientSecret",
    required: true,
    label: "Client Secret",
    placeholder: "OAuth2 Client Secret for your registered Slack application",
    protected: true
  }, {
    id: "domains",
    label: "Limit to Teams",
    placeholder: "my-team, another-team",
    type: "string[]",
    editable: true
  }]
};

function configRoutes(router: Router, auth: IAuthSlack) {
  const config = {
    clientID: auth.clientID,
    clientSecret: auth.clientSecret,
    callbackURL: auth.callbackUrl,
    passReqToCallback: true
  };

  passport.use(new Strategy(config,
    (request, accessToken, refreshToken, profile, done) => {
      if (_.isEmpty(auth.domains) && !_.includes(auth.domains, profile.team.domain)) {
        console.warn(`Invalid domain [${profile.team.domain}], [${auth.domains}]`);
        done(new Error("Invalid domain"));
      } else {
        done(null, {
          provider: profile.provider,
          id: `slack:${profile.id}`,
          email: profile.user.email,
          name: profile.user.name
        });
      }
    }
  ));

  router.get("/", passport.authenticate("slack", {
    scope: ["identity.basic", "identity.team", "identity.email"],
    failureRedirect: "/"
  } as any));

  router.get("/callback",
    passport.authenticate("slack"),
    (req, res) => {
      res.redirect(req.session.returnTo || "/");
      delete req.session.returnTo;
    });

}

const authProvider: IAuthProvider = {
  info, configRoutes
};

export default authProvider;
