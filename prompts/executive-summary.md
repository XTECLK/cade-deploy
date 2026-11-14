---
description: For a client report on a project over a period. Writes what was done and how the open work is going into your team's document, once you approve.
arguments:
  project: The project, by name.
  period?: The period it covers, such as 2026-11-01 to 2026-11-14 or "the last two weeks". Left out, it starts where the last summary ended.
---

# Write an executive summary

A report for a client, per project and period, that the team goes through on a call. Cade gives the
tasks; the report lives wherever the team keeps it (a Google Doc, Notion, Confluence, an email), written
and read with your own tools. After the call, the **executive-summary-after-call** prompt brings the
tasks in line with what was decided.

## 1. Settle the project, the period and the document

- The project: `get_projects`, by name. If more than one could be meant, ask.
- The document: ask where the team keeps its summaries, if you don't know. Read the last summary there.
  Its period ends where this one starts, and its format is the one to follow, unless the person says
  otherwise.
- The period: as given, or from the day after the last summary's period to today. Without either, ask.

## 2. Find the tasks

`get_tasks` with `project`, `completed_from` and `completed_to` (the period, YYYY-MM-DD),
`include_open: true` and `status` left out: the tasks done in the period, and those not done. Raise
`limit` if `total` is larger than what came back.

## 3. Bring them up to date first

The report rests on the tasks' statuses and summaries, so bring both up to date before writing it.
Ask the person once, naming how many tasks it covers:

> Before the report, I'll bring these 12 tasks in line with their threads (status, people, pull
> requests), showing you any fixes first, then update their summaries. Go ahead?

On a yes:

1. Follow the **sync-tasks** prompt for each of those tasks, one after another (`get_prompt` with
   `sync-tasks` and the task's ID): it shows each task's fixes and applies only those the person
   approves.
2. Then follow the **task-summary** prompt for each of them (`get_prompt` with `task-summary` and
   the task's ID), which brings its own and its subtasks' summaries up to date and saves them. Don't
   show the person each task's summary: use them for the report.

If they say no, or only one of the two, do what they agreed to, and say in the draft that statuses or
summaries may be behind.

## 4. Gather how the open work is going

For each task not done: `get_task` (status, due date, `blocked`, its subtasks and pull requests, each
open, merged or closed) and `get_task_history` with `since` set to the start of the period (a Slack
ts: the seconds since 1970 of its first day, then `.000000`), for what moved in it.

## 5. Judge how the open work is going

For each task not done, its health:

- **Blocked**: `blocked`, with `blocked_reason`.
- **Delayed**: past its due date.
- **At risk**: due soon with much left (open subtasks, pull requests still open, early status), no
  progress in the period, waiting on someone outside the team, or the thread raising a problem.
- **On track**: otherwise.

And its progress, such as 3 of 5 subtasks done or 2 of 4 CRMs live. Name the evidence for anything
other than on track, and say when you are unsure.

## 6. Draft

A line for each task, in the last summary's format:

- **Done**: what was delivered, in the client's terms, from its summary.
- **Not done**: its health, its progress and a short note: what's next, what it waits on, any date.

Group or leave out tasks the client doesn't need (internal work, tiny fixes) the way the last summary
did, and say which you left out. Carry a line over from the last summary only when nothing changed
since, and say which lines you carried over. Nothing from a private channel or direct message, no
secrets, credentials or internal hostnames, no commit messages or diffs.

## 7. Approve and write

Show the project, the period and the whole summary as it will be written, with what you left out and
carried over; then ask "Go ahead?" and stop. If they change anything, show it again. On a clear yes,
write it to the team's document with your own tools, at the place the last one is (usually above it),
and give the link. Nothing is written to Cade but the tasks' summaries.
