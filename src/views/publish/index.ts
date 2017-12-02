import * as express from "express";
import Project from "../../Project";
import {ProjectRequest} from "../config/projects/project";

const router = express.Router();

export default router;

router.post("/:id", (req: ProjectRequest, res, next) => {
  const project = Project.resolve(req.params.id);
  const publishToken = req.query.token;
  if (!project) {
    res.sendStatus(404);
  } else if (!publishToken || publishToken !== project.publishToken) {
    res.sendStatus(403);
  } else {
    project.rebuild()
      .then(() => res.json({
        message: `Project ${project.title} published.`
      }))
      .catch(next);
  }
});
