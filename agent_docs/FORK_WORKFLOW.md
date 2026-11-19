# Fork workflow

How a change is made in this fork, start to finish. [FORK.md](../FORK.md) describes the
branches, workflows and deploys; this page is the working loop for an agent or a person.
Where it disagrees with [CONTRIBUTING.md](CONTRIBUTING.md), this page wins: that one is
upstream's process for upstream pull requests.

## This repository is public

Write nothing here that is personal or private: no names beyond the GitHub account, no email
addresses, IP addresses, Tailscale names, tokens, or notes about the owner's home or habits.
Commit messages, pull requests, issues, test fixtures and screenshots are public too. Facts
about the project (Mainsail, Klipper, the printer model, how the fork is built and deployed)
belong here. Personal context and the printer's own config live in the owner's private memory
repository, outside this one.

## Rules

- **Keep fork work in new files.** Touch upstream files only to hook new work in, so upstream
  merges stay small. Name new components and store modules so they read as fork additions.
- **Never test against the real printer.** The Mainsail UI sends G-code: a click can move
  axes or heat the nozzle. Develop, preview and test against the fake Moonraker (below).
- **Branches:** feature branch off `dev` -> pull request into `dev` -> `staging` -> `main`.
  A merge to `main` is a release that installs itself on the printer; it needs the owner's
  approval. Merge commits, not squash, for `dev` -> `staging` -> `main`.
- **Commits and pull request titles:** Conventional Commits (`feat:`, `fix:`, `test:` …).
  No DCO sign-off is needed in the fork.
- **Dependabot pull requests** wait for the owner's review; never merge one unasked.

## The loop

1. **Spec.** Each feature starts as a GitHub issue: what it does, for whom, and how we will
   know it works (acceptance checks a test or a screenshot can show).
2. **Plan.** Explore the code (`ARCHITECTURE.md`), write a short plan in the issue or the
   pull request, and get the owner's agreement before building anything large.
3. **Build test-first.** A failing test first: Vitest for logic (`tests/`), Cypress against
   the fake Moonraker for behaviour (`cypress/e2e/`). Then the code, until both pass.
4. **Verify in a browser.** Run the preview below, use the feature as a person would, and
   attach before and after screenshots to the pull request. Note anything that looks off,
   even outside the change, as a follow-up issue.
5. **Review.** A second agent, which has not seen the implementation's reasoning, reviews
   the diff against the spec and `CODE_REVIEW.md`. Fix what it finds before merging to `dev`.
6. **Promote.** `dev` -> `staging` (the preview site serves it within 5 minutes); the owner
   checks it there; `staging` -> `main` with the owner's approval.
7. **Watch.** The deploy shows under the repository's Environments. A failed deploy, a
   stalled updater or a new upstream release reaches the owner by email or as an issue.

## Preview a feature

The fake Moonraker answers Mainsail's websocket and HTTP calls with a simulated idle printer
and records what the UI sends, so nothing physical can happen.

```bash
npm ci
npm run fake-moonraker     # terminal 1: the fake on http://localhost:7125
npm run serve:fake         # terminal 2: dev server on http://localhost:8080, pointed at the fake
```

Open `http://localhost:8080` in a browser tool, exercise the feature and take screenshots.
`npm run test` builds, starts the fake and the preview server, and runs Cypress headless;
`npm run test:ui` opens Cypress interactively.

## Before opening a pull request

```bash
npm run lint && npm run format:check && npm run test:unit && npm run test
```

The pull request says what changed, links the issue, and has a test plan and the screenshots.
Fork CI must pass: Promotion order, Build, Unit tests, E2E tests.
