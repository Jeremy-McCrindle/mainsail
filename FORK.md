# This fork

`Jeremy-McCrindle/mainsail` is Mainsail with additions for one printer, jerrypi (a
Creality Ender 3 V3 SE on Klipper). Upstream's own files keep their meaning; this file covers
what the fork adds. Keep fork work in new files where possible, so upstream merges stay small.

## Branches

| Branch    | Holds                                                            | Takes pull requests from |
| --------- | ---------------------------------------------------------------- | ------------------------ |
| `main`    | Releases. Every merge publishes `v<upstream>-fork.<n>`.          | `staging` only           |
| `staging` | Finished work, tested together on the preview at `jerrypi:8081`. | `dev` only               |
| `dev`     | Work in progress, one feature at a time.                         | feature branches         |

A feature starts as a branch off `dev` (`feat/<name>`, `fix/<name>`) and merges into `dev`
by pull request. When it is done, a `dev` -> `staging` pull request takes it to the preview;
when everything on staging works together, a `staging` -> `main` pull request releases it.
Merge with merge commits (not squash or rebase), so the three branches share history and
promotions stay conflict-free.

Rulesets on all three branches require a pull request and the Fork CI checks, and block force
pushes and deletion. The `Promotion order` check enforces the source branch.

## Workflows

| Workflow                | Runs on                     | Does                                                                         |
| ----------------------- | --------------------------- | ---------------------------------------------------------------------------- |
| `fork-ci.yml`           | pull requests and pushes    | promotion order, lint and build, unit tests, Cypress                         |
| `fork-staging.yml`      | push to `staging`           | replaces the rolling `staging` pre-release (`v<upstream>-staging.<run>`)     |
| `fork-release.yml`      | push to `main`              | publishes release `v<upstream>-fork.<n>` with `mainsail.zip` and its SHA-256 |
| `fork-deploy-watch.yml` | jerrypi's deployment report | fails, so GitHub emails, when a deploy to jerrypi fails                      |

Upstream's workflows (`ci.yml`, `release.yml`, `publish_docker.yml`, the PR, stale and vouch
workflows) are disabled in the repository's Actions settings, not edited. After merging an
upstream release, disable any workflow it adds: `gh workflow disable <name> -R Jeremy-McCrindle/mainsail`.

## Deploys

jerrypi pulls; nothing pushes to it. The updater lives in the printer's memory repo
(`3d-printing`, `apps/mainsail-updater/`) and runs every 5 minutes as
`mainsail-updater@production` and `mainsail-updater@staging`:

- **Production** (`jerrypi:8080`, environment `jerrypi`): the release marked latest, deployed
  only while the printer is idle: not printing or paused, no heater on, and Klipper idle for
  its 10-minute idle timeout. To roll back, mark an older release as latest.
- **Staging** (`jerrypi:8081`, environment `jerrypi-staging`): the `staging` pre-release,
  deployed at once.

Each deploy shows in the repository's Environments as a Deployment, with statuses `queued`
(and why it waits), `in_progress`, then `success`, or `failure` with the reason. The Pi checks
the download's SHA-256, switches the site with one symlink rename, health-checks it, and rolls
back on failure. Its log lines carry `deployment=<id>`:

```
ssh jerrypi journalctl -u mainsail-updater@production -o cat | grep -F deployment=<id>
```

## Upstream releases

```bash
git fetch upstream --tags
git switch -c sync/upstream-<tag> dev
git merge <tag> -m "chore: merge Mainsail <tag>"
git push -u origin sync/upstream-<tag>   # then a pull request into dev
```

The release numbering follows `package.json`: after merging upstream v2.20.0, the next
release is `v2.20.0-fork.1`.
