import * as BPromise from "bluebird";
import {spawn, SpawnOptions} from "child_process";

/**
 * spawn command that returns a promise
 * @param {string} command
 * @param {string[]} args
 * @param {"child_process".SpawnOptions} options
 * @returns {Promise<Bluebird<any>>}
 */
export async function spawnp(command: string, args?: string[], options?: SpawnOptions) {
  const dfd = BPromise.defer();

  const childProcess = spawn(command, args, options);

  const log = [];

  childProcess.stdout.on("data", (data) => {
    log.push(data);
    console.log(`stdout: ${data}`);
  });

  childProcess.stderr.on("data", (data) => {
    log.push(data);
    console.log(`stderr: ${data}`);
  });

  childProcess.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
    if (code) {
      const error: any = new Error();
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
