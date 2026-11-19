# Mainsail AI Guidelines

Mainsail is a Vue 2.7 + TypeScript web interface for Klipper 3D printer firmware, using Vuetify 2, Vuex 3, and Vite.

> **CRITICAL:** Use **Vue Class Components** with decorators (`@Component`, `@Prop`, `@Watch`).
> Do NOT use Vue 3 `<script setup>` or Options API syntax.

> **This is a fork** (`Jeremy-McCrindle/mainsail`). Read [agent_docs/FORK_WORKFLOW.md](agent_docs/FORK_WORKFLOW.md)
> first: it sets the branch flow, the public-repo rule and how to test without the real printer,
> and it overrides upstream's Git workflow below.

## Commands

- `npm run serve` - Dev server (port 8080)
- `npm run build` - Production build
- `npm run lint:fix` - Fix linting
- `npm run format` - Format code
- `npm run test:unit` - Unit tests (Vitest)
- `npm run test:ui` - E2E tests (Cypress)

## Guidelines

| Topic                             | File                                                         |
| --------------------------------- | ------------------------------------------------------------ |
| Project structure & store modules | [agent_docs/ARCHITECTURE.md](agent_docs/ARCHITECTURE.md)     |
| Vue Class Components & TypeScript | [agent_docs/VUE_TYPESCRIPT.md](agent_docs/VUE_TYPESCRIPT.md) |
| Formatting, naming, patterns      | [agent_docs/CODE_STYLE.md](agent_docs/CODE_STYLE.md)         |
| Vuetify, icons, i18n              | [agent_docs/UI_I18N.md](agent_docs/UI_I18N.md)               |
| Code review checklist             | [agent_docs/CODE_REVIEW.md](agent_docs/CODE_REVIEW.md)       |
| Git workflow & PRs                | [agent_docs/CONTRIBUTING.md](agent_docs/CONTRIBUTING.md)     |
| Fork workflow (overrides above)   | [agent_docs/FORK_WORKFLOW.md](agent_docs/FORK_WORKFLOW.md)   |
