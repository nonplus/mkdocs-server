import * as express from "express";
import * as _ from "lodash";

import Settings from "../../../Settings";

const router = express.Router();

export default router;

router.use((req, res, next) => {
  req.breadcrumbs("Authentication", "/!config/auth");
  next();
});

router.get("/", (req, res) => {
  const authGoogle = Settings.get().auth.google;
  const body = _.extend({}, authGoogle, {
    domains: (authGoogle.domains || []).join(", ")
  });
  const viewData = _.extend({},
    body,
    {
      activeTab: "auth",
      authorizedOrigin: `${req.protocol}://${req.get("host")}`,
      callbackUrl: `${req.protocol}://${req.get("host")}/!auth/google/callback`,
      breadcrumbs: req.breadcrumbs,
    }
  );

  res.render("config/auth", viewData);
});

router.post("/", (req, res) => {
  switch (req.body.action) {
    case "update":
      if (Settings.get().auth.google) {
        break;
      }
      Settings.setAuth("google", {
        clientID: req.body.clientID,
        clientSecret: req.body.clientSecret,
        domains: _.map((req.body.domains || "").split(",")).map((domain: string) => _.trim(domain)).filter(_.identity),
        callbackUrl: req.body.callbackUrl
      });

      const viewData = _.extend({},
        req.body,
        {
          activeTab: "auth",
          authorizedOrigin: `${req.protocol}://${req.get("host")}`,
          callbackUrl: `${req.protocol}://${req.get("host")}/!auth/google/callback`,
          breadcrumbs: req.breadcrumbs,
          httpEquiv: {
            refresh: "2;url=/!config"
          },
          $alert: {
            success: "Authentication settings have been saved and the server is restarting."
          }
        }
      );

      res.render("config/auth", viewData);

      return;
  }

  res.redirect("/!config");
});
