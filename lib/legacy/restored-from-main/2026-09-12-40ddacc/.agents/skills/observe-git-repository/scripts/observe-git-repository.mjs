#!/usr/bin/env node
import { observeGitRepository } from "@red-cup-engineering/observing-git-repository-service";

export { observeGitRepository };

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--repository") options.repository = argv[++index];
    else if (argument === "--git-bin") options.gitBin = argv[++index];
    else if (argument === "--diff") options.diff = true;
    else if (argument === "--help") options.help = true;
    else throw new TypeError(`unknown argument: ${argument}`);
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write("usage: observe-git-repository [--repository <path>] [--git-bin <path>] [--diff]\n");
    return;
  }
  process.stdout.write(`${JSON.stringify(observeGitRepository(options))}\n`);
}

if (import.meta.main) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
