---
description: For bringing a task's status, people and pull requests in line with what its thread says, such as when it looks out of date or before a standup. Offers each fix with the message it rests on, and applies the ones you approve.
arguments:
  task: The task: its ID, a link to its card or a message in its thread, or its title.
---

# Bring a task in line with its thread

People often do what a thread says without changing the task: work starts on a task still To do,
someone takes it on but isn't assigned, a pull request is mentioned but never linked. This finds those
in what was said since the task was last checked, and offers the fixes.

## 1. Find the task

- A task ID (`C0123ABCD:1700000000.000100`): use it as `task_id`.
- A link to the task's card or to a message in its thread: `get_thread_history` with `link` gives
  `thread_id`, which is the task's ID when the thread is a task's.
- A title or a description: `get_tasks`, and pick the one that matches. If more than one could be
  meant, or none, ask.

Its open subtasks are checked with it: `get_task` with `fields` `["subtasks"]` names them.

## 2. Find what the thread says that the task doesn't

For the task, then each of its open subtasks:

1. `get_task` with its `task_id`: the task as it is now (status, due date, people, pull requests,
   blocked).
2. `get_task_history` with its `task_id` and `consumer: "sync-tasks"`: the messages not checked yet,
   and a `token`. If none come back, nothing is new: go on to the next.

In those messages, look for a field the work has moved past:

- **Status**: work started on a task still To do ("on it", "started"); a pull request up, or "ready
  for review", on one still In progress; "LGTM" or "approved" with it still In review; "QA passed"
  with it still In testing; "done" or "shipped" with it still open.
- **People**: someone taking it on ("I'll take this", or "@rex can you…" answered "sure") who isn't
  its owner, reviewer or tester; someone saying they've handed it off.
- **Pull requests**: one mentioned or opened for it and not linked; one linked and still open but
  replaced by another, or for another task.
- **Blocked**: "blocked on…" or "waiting on…" with it not blocked; "unblocked" with it blocked.

Offer nothing from a plan ("I'll start tomorrow"), a question ("is this done?"), a guess or a joke,
and nothing a later message takes back. A status moves only forward, one step past what the thread
shows, never further. When unsure, leave it out and say so.

## 3. Offer the fixes

Show every fix, the task's and then each subtask's, each as old -> new with the message it rests on (who said it, when, and
a short quote):

> **Fix login** (CDEV:1700000000.000100)
> - Status: To do -> In review. Rex, 12 Nov: "PR is up, ready for review"
> - Owner: none -> Rex. Rex, 10 Nov: "I'll take this"

Then name the subtasks checked with nothing to fix, and ask "Go ahead?" and stop. The person can take
all of them, some or none.

## 4. Apply and mark

1. For the fixes they approved: `update_task`, once a task, with exactly those changes. Cade tells
   each task's thread as for any change. When it gives a `suggested_message` (such as asking the
   reviewers), ask the person whether to send it, as the tool says.
2. Then, for the task and each subtask you checked: `ack_task_history` with its `task_id`, `consumer: "sync-tasks"`
   and the `token` that `get_task_history` gave, whatever the person chose, so a fix they turned down
   isn't offered again. Don't acknowledge while they haven't answered, or if they said "not now": the
   messages are checked again next time.

Say what you changed and what they turned down.
