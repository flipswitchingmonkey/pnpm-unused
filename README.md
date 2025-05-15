# pnpm unused package finder

Simple script to check for missing or unused packages in the `pnpm-workspace.yaml` file. Make sure to run `pnpm install` first so that the lock files are up to date.

Usage:

```bash
bun run scripts/unused-packages --root .
```

or

```bash
pnpm run unused
```

The script will output packages that are missing from the workspace or are used in different versions across your packages. This repo contains a sample setup to try it out. Just `pnpm install` and then run the command. The actual script is in `./scripts/unused-packages.ts`. Also, I'm using `bun` to execute the file. To use something like `tsx` or whatever, you need to replace `Bun.argv`.

Note 1: Due to the way I loop over the packages coming from the `pnpm-workspace.yaml`'s `packages:` section, you need to spell each package out rather than use `- apps/*`.

Note 2: I've created this as a little helper to keep my `pnpm-workspace.yaml` up to date and I hope that it will become useless at some point in time when `pnpm` will offer something similar to `pnpm outdated -r` for this. Until then, here we are. Consider this a quick hack.

```bash
bun run scripts/unused-packages.ts --root .
🚫 Unused, but in workspace catalog:
┌───┬──────────────────────┬─────────┐
│   │ package              │ version │
├───┼──────────────────────┼─────────┤
│ 0 │ @axe-core/playwright │ 4.10.1  │
│ 1 │ @types/lodash-es     │ 4.17.12 │
└───┴──────────────────────┴─────────┘

🚫 Used in project, but not in catalog:
┌───┬────────────┬─────────┬──────────────────┬───────────┬─────────────────┬─────────────────┐
│   │ name       │ version │ workspaceVersion │ project   │ projectPath     │ section         │
├───┼────────────┼─────────┼──────────────────┼───────────┼─────────────────┼─────────────────┤
│ 0 │ typescript │ 5.8.3   │ n/a              │ some-code │ ./apps/frontend │ devDependencies │
└───┴────────────┴─────────┴──────────────────┴───────────┴─────────────────┴─────────────────┘
🚫 Used in project with a version, and also in catalog:
┌───┬────────────────────┬─────────┬──────────────────┬───────────┬─────────────────┬─────────────────┐
│   │ name               │ version │ workspaceVersion │ project   │ projectPath     │ section         │
├───┼────────────────────┼─────────┼──────────────────┼───────────┼─────────────────┼─────────────────┤
│ 0 │ @aws-sdk/client-s3 │ 3.810.0 │ 3.808.0          │ some-code │ ./apps/frontend │ devDependencies │
└───┴────────────────────┴─────────┴──────────────────┴───────────┴─────────────────┴─────────────────┘
```
