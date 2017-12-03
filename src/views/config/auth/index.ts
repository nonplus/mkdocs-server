import * as express from "express";
import * as _ from "lodash";

import {authProviders} from "../../../auth/passport";
import Project from "../../../Project";
import Settings from "../../../Settings";
import {ProjectRequest} from "../projects/project";

const router = express.Router();

export default router;

router.use((req, res, next) => {
  req.breadcrumbs("Authentication", "/!config/auth");
  next();
});

router.get("/", (req, res) => {
  const authSettings = Settings.get().auth;
  res.render("config/auth", {
    activeTab: "auth",
    breadcrumbs: req.breadcrumbs,
    authProviders: _.map(authProviders, authProvider => ({
      auth: authProvider,
      config: authSettings[authProvider.provider] || {}
    }))
  });
});

const authRouter = express.Router();

router.all("/:provider*", (req: ProjectRequest, res, next) => {
  const authProvider = authProviders[req.params.provider];
  if (!authProvider) {
    res.redirect("/!config/auth");
  } else {
    req.authProvider = authProvider;
    req.breadcrumbs(authProvider.info.label, `/!config/auth/${authProvider.provider}`);
    next();
  }
});

router.use("/:provider", authRouter);

authRouter.get("/", (req, res) => {
  renderConfig(req, res, {});
});

authRouter.post("/", (req, res) => {
  const authProvider = req.authProvider;

  switch (req.body.action) {
    case "update":

      const configOriginal = Settings.get().auth[authProvider.provider] || {};
      const config = _.extend({}, configOriginal);

      // Store callbackUrl
      if (!configOriginal.callbackUrl) {
        config.callbackUrl = req.body.callbackUrl;
      }

      _.forEach(authProvider.info.inputs, (input, key) => {
        const inputId = input.id;
        const inputVal = req.body[inputId];
        if (!configOriginal[inputId] || (!input.protected || input.editable)) {
          if (input.type === "string[]") {
            config[inputId] = _
              .map((inputVal || "")
                .split(","))
              .map((chunk: string) => _.trim(chunk))
              .filter(_.identity);
          } else {
            config[inputId] = inputVal;
          }
        }
      });

      Settings.setAuth(authProvider.provider, config);

      renderConfig(req, res, {
        httpEquiv: {
          refresh: "2;url=/!config/auth"
        },
        $alert: {
          success: "Authentication settings have been saved and the server is restarting."
        }
      });

      return;

    case "discard":
      Settings.setAuth(authProvider.provider, {});
      renderConfig(req, res, {
        httpEquiv: {
          refresh: "2;url=/!config/auth"
        },
        $alert: {
          success: "Authentication settings have been discarded and the server is restarting."
        }
      });
      return;
  }

  res.redirect("/!config/auth");
});

function renderConfig(req, res, viewData) {
  const authProvider = req.authProvider;
  const configOriginal = Settings.get().auth[authProvider.provider] || {};
  const config = _.extend({}, configOriginal);

  _.forEach(authProvider.info.inputs, (input, key) => {
    if (input.type === "string[]") {
      config[input.id] = _.join(config[input.id] || [], ", ");
    }
  });

  viewData = _.extend({
    activeTab: "auth",
    breadcrumbs: req.breadcrumbs,
    authProvider,
    config,
    configOriginal,
    callbackUrl: `${req.protocol}://${req.get("host")}/!auth/${authProvider.provider}/callback`
  }, viewData);

  res.render("config/auth/config", viewData);
}
