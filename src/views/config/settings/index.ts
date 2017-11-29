import * as express from "express";
import * as _ from "lodash";

import Settings from "../../../Settings";

const router = express.Router();

export default router;

router.use((req, res, next) => {
  req.breadcrumbs("Settings", "/!config/settings");
  next();
});

router.get("/", (req, res) => {
  const admins = Settings.get().admins.join(", ");
  res.render("config/settings", {
    breadcrumbs: req.breadcrumbs,
    siteTitle: Settings.get().siteTitle,
    admins,
    user: req.user
  });
});

router.post("/", (req, res) => {
  switch (req.body.action) {
    case "update":
      console.log("update settings", req.body);
      let admins: string[] = [];
      if (_.trim(req.body.admins)) {
        admins = String(_.trim(req.body.admins)).split(",");
        if (req.user) {
          admins.unshift(req.user.email);
        }
      }
      Settings.update({
        siteTitle: req.body.siteTitle,
        admins
      });
      break;
  }

  res.redirect("/!config");
});
