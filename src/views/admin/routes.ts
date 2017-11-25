import * as express from "express";
import * as _ from "lodash";
import db from "../../db/db";
import Project from "../../Project";

const router = express.Router();

export default router;

router.get("/", (req, res) => {
  renderAdminHome(res);
});

router.get("/new-project", (req, res) => {
  res.render("admin/new-project");
});

router.post("/new-project", (req, res) => {
  const {repo, id, title} = req.body;
  console.log({repo, id, title});

  // TODO: Sanitize repo

  const existing = Project.resolve(id);

  if (existing) {
    res.render("admin/new-project", {
      repo, id, title, $alert: {
        danger: `The "${id}" ID is already used by the "${existing.title}" project.`
      }
    });
  } else {
    Project.add({repo, id, title});
    goToAdminHome(res);
    Project.resolve(id)
      .initialize();
  }
});

router.get("/projects/:id", (req, res) => {
  const project = Project.resolve(req.params.id);
  res.render("admin/project", { project });
});

router.post("/projects/:id", (req, res) => {
  const project = Project.resolve(req.params.id);
  switch (req.body.action) {
    case "update":
      console.log("update repo", req.body.repo);
      project.update({
        repo: req.body.repo
      });
      // Fall through
    case "reset":
      project.resetProject();
      goToAdminHome(res);
      return;
    case "delete":
      project.deleteProject();
      goToAdminHome(res);
      return;
  }

  res.render("admin/project", { project });
});

router.post("/rebuild/:id", (req, res) => {
  const id = req.params.id;
  const project = Project.resolve(id);
  let $alert;

  if (!project) {
    $alert = {danger: `The project "${id}" does not exist.`};
  } else {
    $alert = {info: `Rebuilding "${id}"...`};
    project.rebuild()
      .then(() => console.log("Rebuild finished!"), (err) => console.error("Rebuild failed", err));
  }

  renderAdminHome(res, $alert);
});

function goToAdminHome(res) {
  res.redirect("/$config");
}

function renderAdminHome(res, $alert?) {
  res.render("admin/index", {
    projects: _.sortBy(Project.allProjects(), (project) => (project.id || "").toLowerCase()),
    $alert
  });
}
