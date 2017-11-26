import * as express from "express";
import * as _ from "lodash";

import Project from "../../Project";
import Settings from "../../Settings";

const router = express.Router();

export default router;

router.get("/", (req, res) => {
  res.render("projects/index", {
    siteTitle: Settings.get().siteTitle,
    projects: _.sortBy(Project.publishedProjects(), (project) => (project.title || "").toLowerCase())
  });
});
