import * as express from "express";
import * as _ from "lodash";

import Project from "../../Project";
import projectRouter, {ProjectRequest} from "./project";

const router = express.Router();

export default router;

router.use((req, res, next) => {
  req.breadcrumbs("Projects", "/$config/projects");
  next();
});

router.get("/", (req, res) => {
  renderConfigProjects(req, res);
});

router.use("/new", (req, res, next) => {
  req.breadcrumbs("Register New Project", "/$config/projects/new");
  next();
});

router.get("/new", (req, res) => {
  res.render("config/new-project", {
    breadcrumbs: req.breadcrumbs
  });
});

router.post("/new", (req, res) => {
  const {repo, id, title} = req.body;
  console.log({repo, id, title});

  // TODO: Sanitize repo

  const existing = Project.resolve(id);

  if (existing) {
    res.render("config/new-project", {
      breadcrumbs: req.breadcrumbs,
      repo, id, title, $alert: {
        danger: `The "${id}" ID is already used by the "${existing.title}" project.`
      }
    });
  } else {
    Project.add({repo, id, title});
    goToConfigProjects(res);
    Project.resolve(id)
      .initialize();
  }
});

router.all("/:id*", (req: ProjectRequest, res, next) => {
  const project = Project.resolve(req.params.id);
  console.log("req.params", req.params);
  console.log("project", project);
  if (!project) {
    res.redirect("/$config/projects");
  } else {
    req.project = project;
    next();
  }
});

router.use("/:id", projectRouter);

function goToConfigProjects(res) {
  res.redirect("/$config/projects");
}

function renderConfigProjects(req, res, $alert?) {
  res.render("config/projects", {
    breadcrumbs: req.breadcrumbs,
    projects: _.sortBy(Project.allProjects(), (project) => (project.id || "").toLowerCase()),
    $alert
  });
}
