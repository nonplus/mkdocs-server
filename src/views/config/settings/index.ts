import * as express from "express";

import Settings from "../../../Settings";

const router = express.Router();

export default router;

router.use((req, res, next) => {
  req.breadcrumbs("Settings", "/$config/settings");
  next();
});

router.get("/", (req, res) => {
  res.render("config/settings", {
    breadcrumbs: req.breadcrumbs,
    siteTitle: Settings.get().siteTitle
  });
});

router.post("/", (req, res) => {
  switch (req.body.action) {
    case "update":
      console.log("update settings", req.body);
      Settings.update({
        siteTitle: req.body.siteTitle
      });
      break;
  }

  res.redirect("/$config");
});
