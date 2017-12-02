import * as express from "express";
import * as _ from "lodash";
import DeployKey from "../../../DeployKey";
import Project from "../../../Project";
import Settings from "../../../Settings";
import {AlertMessages} from "../../includes/AlertMessages";

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
  renderProject(req, res);
});

router.post("/", (req: ProjectRequest, res) => {
  const project = req.project;
  switch (req.body.action) {
    case "update":
      project.update({
        repo: req.body.repo,
        branch: req.body.branch || "",
        publishToken: req.body.publishToken
      });
    // Fall through
    case "reset":
      project
        .resetProject()
        .then(_.noop);
      goToConfigProjects(res);
      return;
    case "delete":
      project
        .deleteProject()
        .then(_.noop);
      goToConfigProjects(res);
      return;
    case "deployKey":
      const $alert: AlertMessages = {};
      const siteTitle = Settings.get().siteTitle;
      const comment = `MkDocs Server (${req.hostname})`;
      project.deployKey.generate(comment)
        .catch( err => $alert.danger = err.toString())
        .then(() => renderProject(req, res, {$alert}));
      return;
  }

  renderProject(req, res);
});

router.post("/rebuild", (req: ProjectRequest, res) => {
  const project = req.project;

  project
    .rebuild()
    .then(() => console.log("Rebuild finished!"), err => console.error("Rebuild failed", err));

  goToConfigProjects(res);
});

function goToConfigProjects(res) {
  res.redirect("/!config/projects");
}

function renderProject(req: ProjectRequest, res, data?: any) {
  const project = req.project;
  const deployKey = project.deployKey;
  res.render("config/projects/project", _.extend({
    projectPublishUrl: `${req.protocol}://${req.get("host")}/!publish/${project.id}`,
    activeTab: "projects",
    breadcrumbs: req.breadcrumbs,
    project,
    deployKey: deployKey.exists ? deployKey.publicKey : ""
  }, data));
}
