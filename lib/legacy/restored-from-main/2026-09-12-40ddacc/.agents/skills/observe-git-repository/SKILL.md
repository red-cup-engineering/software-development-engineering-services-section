---
name: observe-git-repository
description: Observes the current state of one Git repository without changing it.
---

Reports one Git repository's root, branch, HEAD, and working-tree status without mutating it.

## Operation

export function observeGitRepository({ repository = process.cwd(), gitBin = defaultGit } = {})

### Parameters

- request (@param {string} [request.repository] A path inside the repository to observe.
 * @param {string} [request.gitBin] The Git executable to invoke.
 * ): The repository observation request.

### Returns

object: The repository root, branch, HEAD, clean disposition, and porcelain status.

## Canonical operation

Execute this operation from its owning package so Node resolves the package's declared dependencies:

```sh
cd lib/emsenn/services/561-group/services/engineering-services-section/services/computer-engineering-services-section/services/computer-code-engineering-services-section/services/computer-code-development-services-section/services/version-control-services-section/services/git-services-section/services/observing-git-repository-service
node scripts/observe-git-repository.mjs
```
