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
  const viewData = _.extend({},
    Settings.get().auth.google,
    {
      authorizedOrigin: `${req.protocol}://${req.get("host")}`,
      callbackUrl: `${req.protocol}://${req.get("host")}/!auth/google/callback`,
      breadcrumbs: req.breadcrumbs
    }
  );

  res.render("config/auth", viewData);
});

router.post("/", (req, res) => {
  switch (req.body.action) {
    case "update":
      Settings.setAuth("google", {
        clientID: req.body.clientID,
        clientSecret: req.body.clientSecret,
        hostedDomain: req.body.hostedDomain
      });
      break;
  }

  res.redirect("/!config");
});
