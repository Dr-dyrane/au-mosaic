# Git playbook

This is the git law for every agent in this repo. Do not be timid. Be
precise.

## First read

Before any sync, reset, recovery, commit, or push:

```bash
git status --short --branch
git fetch origin
git log --oneline --decorate --left-right HEAD...origin/main
```

Then read the newest entry in `docs/AGENT-HANDSHAKE.md`. If another
hand has an open claim on the files you need, pause or choose a
different lane.

## Clean tree

If the tree is clean and local `main` is behind `origin/main`, sync it
directly:

```bash
git reset --hard origin/main
```

This is safe when `git status --short` is empty. It is not a moral
crisis. It is just making the local tree match the deploy.

## Dirty tree

If files are dirty, sort them first:

- Yours: verify, stage exact files, commit, then pull or push.
- Someone else's: leave them alone and work around them.
- Already shipped upstream: confirm with `git diff origin/main -- path`,
  then reset only when the owner has asked to sync.

Never use `git add -A`. Stage named files only:

```bash
git add docs/GIT.md AGENTS.md CODEX.md
```

## Hard reset

`git reset --hard origin/main` is allowed when one of these is true:

- The tree is clean and behind origin.
- The owner asked to sync local to deploy.
- Dirty files are proven to be the same work already on origin.

It is not allowed when another hand has uncommitted work that is not on
origin.

## Stale locks

If git reports `.git/index.lock`, check for live writers first:

```bash
ps -ax -o pid,command | rg '[g]it|[d]rizzle|[n]px'
lsof .git/index.lock 2>/dev/null || true
```

Only remove the lock when no git process owns it and no schema or build
tool is mid-write:

```bash
rm -f .git/index.lock
```

## Temp files

`.fuse_hidden...` files can be leftover handles from a mounted runtime.
Remove only the exact temp files after confirming they are not real
repo work. Do not run a broad clean unless that is the explicit task.

## Shell comments

In zsh, do not trail commands with comments. The comment text can be
passed as arguments when the shell is not in interactive-comment mode.

Use this:

```bash
# Adds the client_op_id column and unique index.
npx drizzle-kit push

git fetch origin
git reset --hard origin/main
```

Not this:

```bash
npx drizzle-kit push # adds the client_op_id column
git reset --hard origin/main # sync local to deploy
```

## Commits and pushes

Run the repo's verify ritual before committing:

```bash
npx eslint src --max-warnings=0
npx next build
```

Update `docs/QA.md`, then commit only the files you touched:

```bash
git add path/to/file path/to/other-file
git commit -m "Give agents a git playbook"
git push origin main
```

If push is rejected, fetch and inspect first. Rebase only your own clean
commit. Do not force push `main`.
