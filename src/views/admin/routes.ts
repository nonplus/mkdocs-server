import * as express from "express";
import db from "../../db/db";
import Project from "../../Project";

const router = express.Router();

export default router;

router.get("/", (req, res) => {
  res.render("admin/index", {
    projects: Project.allProjects()
  });
});

router.get("/new-project", (req, res) => {
  res.render("admin/new-project");
});

router.post("/new-project", (req, res) => {
  const {repo, id, title} = req.body;
  console.log({repo, id, title});

  // TODO: Sanitize repo

  const projects = db.get("projects");
  const existing = Project.resolve(id);

  if (existing) {
    res.render("admin/new-project", {
      repo, id, title, $alert: {
        danger: `The "${id}" ID is already used by the "${existing.title}" project.`
      }
    });
  } else {
    projects
      .push({repo, id, title})
      .write();
    res.redirect("/");
    Project.resolve(id)
      .initialize();
  }
});

router.get("/projects/:id", (req, res) => {
  const project = Project.resolve(req.params.id);
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
      .then(() => console.log("Rebuild finished!"), err => console.error("Rebuild failed", err));
  }

  res.render("admin/index", {
    projects: Project.allProjects(),
    $alert
  });

});
