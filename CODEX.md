# To every agent who opens this repo

Read AGENTS.md, then docs/CRM.md (the back-office law and the
session memory), then docs/DESIGN.md (the design law), before you
touch a file. When two ideas disagree, the law wins; when the law is
silent, the roots in CRM.md decide.

## The rules that get broken by newcomers

1. The maison whispers. The Instagram shouts because Instagram is a
   market; the site is a house. Take the brand's identity (colours,
   mark, facts, trade names) and never its flyer voice. "No. 1 in
   Nigeria" belongs on a flyer; "Spaces that begin with water"
   belongs on the door. This was violated once, reverted once, and
   the owner's verdict is on record in docs/QA.md.
2. No em dashes anywhere in the repo. Apple-terse copy. One gold per
   screen. No borders or hairlines; whitespace does the separating.
   Money is kobo integers. Nothing is ever hard-deleted.
3. The voice of the house is written down: rooms have names (the
   book, the glance, the stockroom), commits tell stories, and the
   ledger (docs/QA.md) gains a row every pass and is never rewritten.
4. Verify before you ship: npx eslint src --max-warnings=0, then a
   production build, then the ledger row, then one story commit.
   Deploys follow pushes; close the loop against production.
5. The owner's eye is the last gate. If a change touches how the
   window looks or speaks, prefer proposing over shipping when the
   owner is present; his verdict overrides any session's taste,
   including yours.
6. Another session may be working this tree at the same time. Commit
   only the files you touched, re-read shared docs before editing,
   and never sweep a stranger's work into your commit with add -A.
   Read docs/GIT.md before git recovery, sync, reset, commit, or push.

The repo is the portfolio piece and the log is the story. Leave both
better written than you found them.
