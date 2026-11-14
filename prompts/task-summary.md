---
description: For a task's summary or progress, or how it is going. Summarizes it and its subtasks from their threads, building on the summaries saved, and saves each for the next agent.
arguments:
  task: The task: its ID, a link to its card or a message in its thread, or its title.
---

# Summarize a task

A task's summary says what the issue or request is and what was decided about it, for someone who
wasn't in the discussion. Every task and every subtask has a summary of its own thread only, which
agents keep for each other: you start from the one saved, read only the messages after it, and save
yours for the next agent. The whole picture of a task with subtasks is put together from those
summaries when someone asks, and isn't saved.

## 1. Find the task

- A task ID (`C0123ABCD:1700000000.000100`): use it as `task_id`.
- A link to the task's card or to a message in its thread: `get_thread_history` with `link` gives
  `thread_id`, which is the task's ID when the thread is a task's.
- A title or a description: `get_tasks`, and pick the one that matches. If more than one could be
  meant, or none, ask.

Then `get_task` with `fields` `["title", "status", "parent", "subtasks"]`: its `subtasks` (each with
its own thread, one level deep), or its `parent` when it is a subtask itself.

## 2. Bring each summary up to date

Do this for the task, then for each of its `subtasks`, Done ones too. Each summary covers that task's
own thread only: don't copy a subtask's summary into the task's.

1. `get_task_summary` with its `task_id`: the summary saved so far (`summary`, `summary_by`) and
   `through`, the last message of its thread it covers.
2. `get_task_history` with its `task_id` and `since` that `through` (with no summary yet, leave
   `since` out: every message). If no message comes back, the saved summary is current: use it as it
   is, and go on to the next.
3. A message that starts "Moved from @someone's message" is Cade's copy of the first message of
   another thread, moved into the task, with a link to it. Read the rest of that thread with
   `get_thread_history` and that link; if Cade can't, with your own Slack tools, as the person. If
   neither can, the copy is all there is of it: use that, and say so.
4. Links in the messages (`links`): Cade doesn't open them. Open those that matter with your own tools,
   signed in as the person; if you can't, say so rather than guess what they hold.
5. Write its summary, as its thread now understands it:
   - what the problem or request is, who raised it and when;
   - the impact: who or what it affects, and how badly;
   - the details needed to understand or reproduce it (steps, examples, error text, environment);
   - what was decided about it: scope, approach, what is left out.

   Leave out the status, people and pull requests: `get_task` gives them as they are now. Plain text,
   short paragraphs, `- ` for bullets, people's names rather than `<@U…>` mentions, no secrets,
   credentials, internal hostnames, emails or phone numbers: anyone who can read the task's channel
   gets it through their own agent. Only what the thread says: if something important is missing,
   say so to the person rather than fill it in. With a saved summary, keep what is still right and
   change only what the new messages show has changed. If it looks wrong, or was written long ago,
   read its whole thread (`get_task_history` without `since`) and write it again from there.
6. Save it: `save_task_summary` once, with its `task_id`, `summary` and as `through` the `ts` of the
   last message `get_task_history` gave. It needs no approval, as only agents read it. If it is
   refused because another agent saved one since, read again from step 1 and add to that one.

## 3. Give the whole picture

Give the person one summary, put together from those:

- the task's own summary;
- then, for each subtask, its title and status, and the gist of its summary in a line or two: what
  the part or the issue found is, and what was decided about it.

Say which summaries you brought up to date and which were current already. This picture isn't saved:
the next agent puts it together again from the summaries, each brought up to date on its own.

For a subtask asked about on its own, give its summary, and name the task it is part of (`parent`).

If anything you read shows its status, people or pull requests have fallen behind (work started, a
pull request up, someone who took it on), say so, and offer to bring it in line with the
**sync-tasks** prompt. Don't change them here.
