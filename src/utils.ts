import * as BPromise from "bluebird";
import {spawn, SpawnOptions} from "child_process";
import * as _ from "lodash";
import * as path from "path";
import {BinDir, DataDir} from "./config";
import DeployKey from "./DeployKey";
import Project from "./Project";
import Settings from "./Settings";

/**
 * spawn command that returns a promise
 * @param {string} command
 * @param {string[]} args
 * @param {"child_process".SpawnOptions} options
 * @returns {Promise<Bluebird<any>>}
 */
export async function spawnp(command: string, args?: string[], options?: SpawnOptions) {
  const dfd = BPromise.defer<{ log: string; }>();

  const childProcess = spawn(command, args, options);

  const log = [];

  childProcess.stdout.on("data", data => {
    log.push(data);
    console.log(`stdout: ${data}`);
  });

  childProcess.stderr.on("data", data => {
    log.push(data);
    console.log(`stderr: ${data}`);
  });

  childProcess.on("close", code => {
    console.log(`child process exited with code ${code}`);
    if (code) {
      const error: any = new Error(`${command} exited with ${code}`);
      error.code = code;
      error.log = log.join("");
      dfd.reject(error);
    } else {
      dfd.resolve({
        log: log.join()
      });
    }
  });

  return dfd.promise;
}

export async function git(project: Project, args?: string[], options?: SpawnOptions) {
  const deployKey = new DeployKey(project.id);

  if (deployKey.exists) {

    // Add host to known_hosts

    // git@bitbucket.org:nonplus/mkdocs-test.git
    // ssh://login@server.com:12345/absolute/path/to/repository
    const match = project.repo.match(/\@([^\:\/]+)/);
    const host = (match || [])[1];

    await spawnp(path.join(BinDir, "ssh-trust-host"), [host]);

    options = _.extend({}, options, {
      env: _.extend({}, options.env, {
        SSH_PASS_PHRASE: Settings.get().sshPassPhrase
      })
    });

    const gitArgs = (args || []).map( arg => _.includes(arg, " ") ? `"${arg}"` : arg).join(" ");
    const bashCommand = `${path.join(BinDir, "ssh-git")} ${deployKey.privateFile} ${gitArgs}`;
    return await spawnp("ssh-agent", ["bash", "-c", bashCommand], options);
  } else {
    await spawnp("git", args, options);
  }
}
