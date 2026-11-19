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

| Workflow                | Runs on                     | Does                                                                           |
| ----------------------- | --------------------------- | ------------------------------------------------------------------------------ |
| `fork-ci.yml`           | pull requests and pushes    | promotion order, lint and build, unit tests, Cypress                           |
| `fork-staging.yml`      | push to `staging`           | replaces the rolling `staging-build` pre-release (`v<upstream>-staging.<run>`) |
| `fork-release.yml`      | push to `main`              | publishes release `v<upstream>-fork.<n>` with `mainsail.zip` and its SHA-256   |
| `fork-deploy-watch.yml` | jerrypi's deployment report | fails, so GitHub emails, when a deploy to jerrypi fails                        |

Upstream's workflows (`ci.yml`, `release.yml`, `publish_docker.yml`, the PR, stale and vouch
workflows) are disabled in the repository's Actions settings, not edited. After merging an
upstream release, disable any workflow it adds: `gh workflow disable <name> -R Jeremy-McCrindle/mainsail`.

## Fake Moonraker

`cypress/fake-moonraker/` is a small Node server that answers Mainsail's websocket JSON-RPC
and HTTP calls as an idle Ender 3 V3 SE would, and records every request. Use it for E2E
tests and for previews; never point a development build at the real printer, because the UI
sends G-code that moves hardware.

| Command                  | Does                                                                    |
| ------------------------ | ----------------------------------------------------------------------- |
| `npm run fake-moonraker` | starts the fake on `127.0.0.1:7125`                                     |
| `npm run serve:fake`     | dev server on port 8080, forwarding Moonraker's paths to the fake       |
| `npm run test`           | builds if `dist/` is stale, starts the fake and a preview, runs Cypress |

The dev and preview servers use `cypress/fake-moonraker/vite.config.ts`, which adds a proxy
for `/websocket`, `/server`, `/printer`, `/machine`, `/access`, `/api` and `/_fake`, so
Mainsail connects on its own origin and `config.json` stays as it is. The fake's control
endpoints:

- `GET /_fake/requests[?method=printer.gcode.script]`: every request received, oldest first.
- `POST /_fake/reset`: back to a freshly booted idle printer, with an empty request log.
- `GET /_fake/health`: readiness probe.

G-code is never executed: the fake answers `ok` and echoes
`// fake moonraker received: <script>` to the console. Unknown methods get a JSON-RPC
"method not found" error and a `[fake-moonraker] unknown method` log line. The fixtures in
`cypress/fake-moonraker/fixtures/` are synthetic; keep them free of real hostnames, addresses,
paths and keys, because this repository is public.

## Deploys

jerrypi pulls; nothing pushes to it. The updater lives in the printer's memory repo
(`3d-printing`, `apps/mainsail-updater/`) and runs every 5 minutes as
`mainsail-updater@production` and `mainsail-updater@staging`:

- **Production** (`jerrypi:8080`, environment `jerrypi`): the release marked latest, deployed
  only while the printer is idle: not printing or paused, no heater on, and Klipper idle for
  its 10-minute idle timeout. To roll back, mark an older release as latest.
- **Staging** (`jerrypi:8081`, environment `jerrypi-staging`): the `staging-build` pre-release,
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

## Alerts

Every alert reaches the owner as a GitHub email, from a failed workflow run or from an issue
a workflow opens; nothing else is involved.

| Alert                                               | Arrives as                                                             | Clears                           |
| --------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------- |
| A deploy failed                                     | a failed **Deploy watch** run, job `Report a failed deploy`            | a newer release deploys          |
| No release found for 60 minutes (`no-release`)      | a failed **Deploy watch** run, job `Report a health problem`           | `success` on the same Deployment |
| Runs failing for 60 minutes (`run-error`)           | the same                                                               | the same                         |
| A deploy queued for 48 hours (`queued`)             | the same                                                               | the same                         |
| The token expires within 14 days (`token-expiring`) | the same                                                               | the same                         |
| No heartbeat from a channel for 26 hours            | an issue `Updater heartbeat missing: <channel>`, label `updater-alert` | Fork watch closes it             |
| A newer upstream Mainsail release                   | an issue `Upstream Mainsail <tag> is out`, label `upstream-sync`       | Fork watch closes it             |

- **Deploys** report on their own Deployment in `jerrypi` or `jerrypi-staging`; a `failure`
  fails Deploy watch.
- **Health problems** come from the updater, which checks each channel after every run and
  reports a problem once, as `failure` on a Deployment named `health: <channel> <problem>`
  in environment `jerrypi-health`. The run's summary says what the problem means and gives
  the journal command. When the problem clears, the same Deployment gets `success`.
- **Heartbeats**: each channel posts `success` once a day on its own long-lived Deployment
  in `jerrypi-health`. Heartbeats and recoveries skip Deploy watch. **Fork watch**
  (`fork-watch.yml`, every 3 hours and by hand) opens the issue when one is over 26 hours old, which
  covers the updater not running at all: the Pi down, the timer stopped, the token rejected.
- **Upstream releases**: Fork watch also compares `mainsail-crew/mainsail`'s latest release
  with `package.json` and opens the issue, with the merge steps above, until the merge lands.

GitHub disables scheduled workflows in a public repository after 60 days without activity,
and may start them disabled in a fork. Check with `gh workflow list -R Jeremy-McCrindle/mainsail`
and enable Fork watch if it shows disabled.
