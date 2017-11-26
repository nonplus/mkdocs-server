import * as express from "express";
import * as _ from "lodash";

import Project from "../../Project";
import Settings from "../../Settings";
import projectRouter, {ProjectRequest} from "./project";

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
