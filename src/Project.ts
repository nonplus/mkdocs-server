import * as BPromise from "bluebird";
import {EventEmitter} from "events";
import * as _ from "lodash";
import * as path from "path";
import rimraf = require("rimraf");
import * as YAML from "yamljs";

import {DataDir} from "./config";
import db from "./db/projects";
import DeployKey from "./DeployKey";
import {git, spawnp} from "./utils";

enum ProjectActivity {
  cloningRepo = "cloning",
  updatingRepo = "updating",
  publishingDocs = "publishing",
  resettingProject = "resetting",
  deletingProject = "deleting"
}

enum ProjectStatus {
  new = "new",
  repoCloned = "cloned",
  docsPublished = "published"
}

export enum ProjectEvent {
  docsPublished = "published"
}

interface ProjectConfig {
  id: string;
  title: string;
  repo: string;
  branch: string;
  status: ProjectStatus | null;
  activity: ProjectActivity | null;
  error: {
    code?: number;
    message: string;
    log: string;
  } | null;
  mkdocsConfig: {
    site_name: string;
    site_url?: string;
    site_description?: string;
    site_author?: string;
    site_dir?: string;
  };
}

const reposDirectory = `${DataDir}/repos`;

export default class Project {

  public static readonly events = new EventEmitter();

  public static resolve(id: string): Project {
    const config: ProjectConfig = db
      .get("projects")
      .find({id})
      .value<ProjectConfig>();
    if (config) {
      return new Project(config);
    } else {
      return null;
    }
  }

  public static add(project: Partial<ProjectConfig>) {
    db
      .get("projects")
      .push(project)
      .write();
  }

  public static allProjects(): Project[] {
    return db
      .get("projects")
      .map((config: ProjectConfig) => new Project(config))
      .value<Project[]>();
  }

  public static publishedProjects(): Project[] {
    return db
      .get("projects")
      .filter({status: ProjectStatus.docsPublished})
      .map((config: ProjectConfig) => new Project(config))
      .value<Project[]>();
  }

  public id: string;
  public title: string;
  public repo: string;
  public branch: string;
  public status: ProjectStatus;
  public activity: ProjectActivity | null;
  public error: {
    code?: number;
    message: string;
    log: string;
  } | null;
  public mkdocsConfig: {
    site_name: string;
    site_url?: string;
    site_description?: string;
    site_author?: string;
    site_dir?: string;
  };

  constructor(config: ProjectConfig) {
    this.id = config.id;
    this.title = config.title;
    this.repo = config.repo;
    this.branch = config.branch;
    this.error = config.error;
    this.activity = config.activity || null;
    this.mkdocsConfig = config.mkdocsConfig;
    this.status = config.status || ProjectStatus.new;
  }

  get statusLabel(): string {
    switch (this.status) {
      case ProjectStatus.new:
        return "New";
      case ProjectStatus.repoCloned:
        return "Cloned";
      case ProjectStatus.docsPublished:
        return "Published";
      default:
        return `Unknown ${this.status}`;
    }
  }

  get siteDirectory(): string {
    return path.join(this.repoDirectory, this.mkdocsConfig ? this.mkdocsConfig.site_dir : "site");
  }

  get repoDirectory(): string {
    return path.join(reposDirectory, this.id);
  }

  get siteDescription(): string {
    return (this.mkdocsConfig ? this.mkdocsConfig.site_description : "") || "";
  }

  get activityLabel(): string {
    if (_.isNil(this.activity)) {
      return "";
    }

    switch (this.activity) {
      case ProjectActivity.cloningRepo:
        return "Cloning Repo...";
      case ProjectActivity.updatingRepo:
        return "Updating Repo...";
      case ProjectActivity.publishingDocs:
        return "Publishing...";
      case ProjectActivity.resettingProject:
        return "Resetting...";
      case ProjectActivity.deletingProject:
        return "Deleting...";
    }

    return `Unknown ${this.activity}...`;
  }

  public get deployKey(): DeployKey {
    return new DeployKey(this.id);
  }

  public async initialize() {
    await this.cloneRepo();
    await this.publishDocs();
  }

  public async resetProject() {
    this.update({
      status: ProjectStatus.new,
      activity: ProjectActivity.resettingProject,
      error: null
    });

    const repoDirectory = this.repoDirectory;

    try {
      await this.deleteRepo();
      this.update({
        mkdocsConfig: null,
        activity: null
      });
    } catch (err) {
      this.update({
        mkdocsConfig: null,
        activity: null,
        error: {
          message: `Failed deleting ${repoDirectory}`,
          log: err.toString()
        }
      });

      throw err;
    }
  }

  public async deleteProject() {
    const id = this.id;

    this.update({
      status: ProjectStatus.new,
      activity: ProjectActivity.deletingProject,
      error: null
    });

    const repoDirectory = this.repoDirectory;
    const deployKey = this.deployKey;

    return BPromise.all([
      this.deleteRepo(),
      deployKey.discard()
    ])
      .then(destroy, destroy);

    function destroy() {
      db.get("projects")
        .remove({id})
        .write();
    }
  }

  public async rebuild() {
    if (this.status === ProjectStatus.new) {
      await this.cloneRepo();
    } else {
      await this.updateRepo();
    }
    await this.publishDocs();
  }

  public async cloneRepo() {
    const dfd = BPromise.defer();

    this.update({activity: ProjectActivity.cloningRepo, error: null});

    try {
      const command = ["clone", "--depth=1"];

      if (this.branch) {
        command.push("--branch");
        command.push(this.branch);
      }
      command.push(this.repo);
      command.push(this.id);

      await git(this, command, {
        cwd: reposDirectory
      });
      this.refreshMkdDocsInfo();
      this.update({
        activity: null,
        status: ProjectStatus.repoCloned
      });
    } catch (err) {
      this.update({
        activity: null,
        error: {
          message: "Failed cloning repo",
          code: err.code,
          log: err.log
        }
      });

      throw err;
    }
  }

  public resolve() {
    return Project.resolve(this.id);
  }

  public update(options: Partial<ProjectConfig>) {
    console.log("update", JSON.stringify(options));
    db.get("projects").find({id: this.id})
      .assign(options)
      .write();
    _.extend(this, options);
  }

  public async updateRepo() {
    const dfd = BPromise.defer();

    this.update({activity: ProjectActivity.updatingRepo, error: null});

    try {
      await git(this, ["pull", "--depth=1", "-f", "-s", "recursive", "-X", "theirs"], {
        cwd: this.repoDirectory
      });
      this.refreshMkdDocsInfo();
      this.update({
        activity: null
      });
    } catch (err) {
      this.update({
        activity: null,
        error: {
          message: "Failed updating repo",
          code: err.code,
          log: err.log
        }
      });

      throw err;
    }
  }

  public async publishDocs() {
    const dfd = BPromise.defer();

    this.update({activity: ProjectActivity.publishingDocs, error: null});

    try {
      await spawnp("mkdocs", ["build"], {
        cwd: this.repoDirectory
      });
      this.update({
        activity: null,
        status: ProjectStatus.docsPublished
      });
      Project.events.emit(ProjectEvent.docsPublished, this);
    } catch (err) {
      this.update({
        activity: null,
        error: {
          message: "Failed publishing docs",
          code: err.code,
          log: err.log
        }
      });

      throw err;
    }

  }

  private async deleteRepo() {
    const rimrafp = BPromise.promisify(rimraf);
    return rimrafp(this.repoDirectory);
  }

  private refreshMkdDocsInfo() {
    try {
      const doc = YAML.load(`${this.repoDirectory}/mkdocs.yml`);
      const mkdocsConfig = _.pick(doc, "site_name", "site_url", "site_description", "site_author", "site_dir");
      if (!mkdocsConfig.site_dir) {
        mkdocsConfig.site_dir = "site";
      }
      db.get("projects")
        .find({id: this.id})
        .assign({mkdocsConfig, title: mkdocsConfig.site_name || this.title})
        .write();
    } catch (e) {
      console.log(e);
    }
  }

}
