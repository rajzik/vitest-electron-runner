# React example

A studio task board built with React. Add tasks, mark them done, filter the list,
and delete finished work. State resets when the page reloads.

From the repository root, after [setup](../../README.md#setup):

```sh
pnpm --filter @examples/react dev
pnpm --filter @examples/react test
pnpm --filter @examples/react build
pnpm --filter @examples/react preview
```

Open the URL printed by the dev or preview server. Tests build the local core
library and run in its hidden Electron renderer pool using Vitest 5. They use
DOM Testing Library rather than a Playwright browser provider.
See [the examples guide](../README.md) for configuration and coverage.
