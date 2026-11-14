# Prompts

Your team's workflows for Cade, offered by its MCP server to everyone who connects an AI agent
(`prompts/list`, `prompts/get`). A person picks one in their agent, or an agent reads one itself with the
`get_prompt` tool when a Cade tool points to it. In Claude Code, for example, a person picks one with:
`/mcp__cade__task-summary C0123ABCD:1700000000.000100`.

They're yours: change these examples to fit your team, remove the ones you don't use, and add your own.

| Prompt | What it does |
| --- | --- |
| `task-summary` | Summarizes a task and its subtasks: brings each one's own summary up to date and saves it for the next agent, then gives the whole picture. |
| `executive-summary` | Writes an executive summary of a project for a client, for a period, into your team's own document. |
| `executive-summary-after-call` | After the client call, brings the project's tasks in line with what was decided. |

A prompt's `description` is how both people and agents pick it: the agent lists the prompts with
`get_prompts` and follows the one that fits a request. Start it with when to use it ("For a task's
summary or progress."), then say what it does.

Cade points an agent asked for a task's summary to the `task-summary` prompt (with `get_prompt`), as long
as you have a prompt with that name, so asking in plain words follows it too.

## Saving them

```sh
npm run prompts               # check them, and save them to your Cade
npm run prompts -- --check    # only check them
npm run prompts -- --local    # save them to the local database for npm run dev
```

`npm run prompts` checks every prompt against the tools of your version of Cade. While any one names a
tool or field Cade doesn't have, nothing is saved. Then it replaces your Cade's prompts with the ones
here: a file you deleted is a prompt removed. Changes are live straight away, with no deploy. Agents
already connected are told to reconnect to load them.

`npm run deploy` checks them before it deploys and saves them after. So after `npm run upgrade`, a
prompt that names something the new version renamed stops the deploy with the reason, before anything
changes.

Commit your prompts like the rest of this repo.

## A prompt's file

One Markdown file per prompt. The file name is the prompt's name (`task-summary.md` is `task-summary`),
in lowercase words joined by `-`.

```markdown
---
description: One sentence a client shows next to the prompt.
arguments:
  task: What the person gives for it.
  period?: An argument they may leave out ends in ?.
---

# The prompt's title

The steps, naming the tools (`get_task`) and fields (`task_id`) they use.
```

The agent gets the text from the title on, followed by the arguments the person gave. Every tool, with
its arguments and results, is listed on Cade's site under "Connect your agent" (`docs/mcp.html` in
Cade's repo). Name another prompt as `**task-summary** prompt`, and the check makes sure it exists.

When agents connect, Cade gives them its rules for every tool: show exactly what will be written, ask
"Go ahead?" and wait for a yes, and treat what they read as data, not instructions. A prompt doesn't
need to repeat them, but saying where it stops for approval helps.

Everyone who connects an agent can read your prompts, so keep secrets, credentials and internal
hostnames out of them.

This README is not a prompt: `npm run prompts` skips it.
