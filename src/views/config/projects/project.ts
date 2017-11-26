import * as express from "express";
import Project from "../../../Project";

export interface ProjectRequest extends express.Request {
  project: Project;
}

const router = express.Router();

export default router;

router.use((req: ProjectRequest, res, next) => {
  const project = req.project;
  req.breadcrumbs(project.title, `/!config/projects/${project.id}`);
  next();
});

router.get("/", (req: ProjectRequest, res) => {
  const project = req.project;
  res.render("config/projects/project", {
    breadcrumbs: req.breadcrumbs,
    project
  });
});

router.post("/", (req: ProjectRequest, res) => {
  const project = req.project;
  switch (req.body.action) {
    case "update":
      project.update({
        repo: req.body.repo
      });
    // Fall through
    case "reset":
      project.resetProject();
      goToConfigProjects(res);
      return;
    case "delete":
      project.deleteProject();
      goToConfigProjects(res);
      return;
  }

  res.render("config/projects/project", {
    breadcrumbs: req.breadcrumbs,
    project
  });
});

router.post("/rebuild", (req: ProjectRequest, res) => {
  const project = req.project;

  project.rebuild()
    .then(() => console.log("Rebuild finished!"), (err) => console.error("Rebuild failed", err));

  goToConfigProjects(res);
});

function goToConfigProjects(res) {
  res.redirect("/!config/projects");
}
