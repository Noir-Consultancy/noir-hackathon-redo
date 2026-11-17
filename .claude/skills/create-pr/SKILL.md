---
name: create-pr
description: Create a small, quick-to-review pull request for the current branch – commit, merge in main, push and open the PR with a short description and the teammates as reviewers. Use when the user wants to open a PR, "skapa PR", or share their work with the team.
model: haiku
effort: low
allowed-tools:
  - Bash(git status*)
  - Bash(git branch*)
  - Bash(git switch*)
  - Bash(git add*)
  - Bash(git commit*)
  - Bash(git diff*)
  - Bash(git log*)
  - Bash(git remote*)
  - Bash(git fetch*)
  - Bash(git merge*)
  - Bash(git push*)
  - Bash(gh api user*)
  - Bash(gh issue list*)
  - Bash(gh issue view*)
  - Bash(gh pr create*)
  - Bash(gh pr view*)
---

# Create PR

Open a small pull request that a teammate can skim in under a minute. Be fast: no
extra analysis, no builds unless asked. Talk to the user in their language; write the PR
title and body in English unless the team decided otherwise.

## Steps

1. **Branch.** `git status` and `git branch --show-current`. If on `main`, stop and
   suggest creating a branch `<type>/<topic>` first, e.g. `feature/minimap` or
   `fix/empty-results` (`git switch -c …` keeps uncommitted changes).
2. **Uncommitted changes.** If any, show a one-line summary and propose a Conventional
   Commit message (`feat(scope): …`, `fix(scope): …`); commit after the user agrees.
   Never commit `.env` or secrets.
3. **Update from main.** `git fetch origin` then `git merge origin/main`. On conflicts,
   stop: list the conflicting files, note any in `docs/contract/`, and tell the user to
   resolve them in their next prompt (which runs on the session's own model) or with the
   teammate who changed them. Run this skill again afterwards.
4. **Issue.** Find the GitHub issue this branch solves: the user's assigned issues
   (`gh issue list --assignee @me`), the task plan (`docs/tasks/<issue>-…`) or the commits.
   If unclear, ask in one line. Work without an issue (e.g. a small fix) is fine: say so.
5. **Reviewers.** Take the teammates' GitHub handles from the team table in `AGENTS.md`
   (or `docs/plan.md`), excluding the user (`gh api user -q .login`). If there is no team
   table, ask the user which GitHub handles to add – or none.
6. **Draft the PR.** Write the body from the commits and diff (`git log`/`git diff
   origin/main...HEAD`), using this structure. Keep it skimmable in about a minute and
   **leave out sections that would be empty**. Always include `Closes #<issue>` when there
   is an issue, so GitHub closes it on merge:

   ```markdown
   ## Summary
   <2–4 sentences: what changed and why. Link the task plan (`docs/tasks/…`) if there is one.>

   Closes #<issue>

   ## Changes
   - <one bullet per notable change>

   ## Contract
   <which endpoint/event/model in docs/contract/ changed – flag clearly>

   ## How to test
   <commands or steps, e.g. `curl localhost:8000/matches?...`>

   ## Notes for reviewers
   <where to look first, open questions, known limitations, follow-ups>
   ```

7. **Confirm.** If the branch hasn't been reviewed in this session, offer to run the
   built-in `/code-review` first (and `/security-review` if the change touches input
   handling, secrets, dependencies or the LLM boundary) and to fix what's worth fixing
   before pushing. The user may decline. Then show the branch, the
   number of commits, the title and the reviewers, and ask for an ok to push and open
   the PR. Continue only after a clear yes.
8. **Push and open.** `git push -u origin HEAD`, then
   `gh pr create --base main --title "<conventional title>" --body "<body>" --reviewer <h1>,<h2>`.
   If adding reviewers fails (e.g. a handle is not a collaborator), create the PR without
   them and mention it. If `gh` is not installed or not logged in, give the user the
   compare URL (`https://github.com/<owner>/<repo>/compare/<branch>?expand=1`) and the
   title and body to paste.
9. **Report** the PR URL in one line. If `docs/contract/` changed, remind the user to tell
   the affected teammates.
