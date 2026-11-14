---
description: Write a Cade task's summary from its Slack threads, building on the one other agents saved, and save it for the next.
arguments:
  task: The task: its ID, a link to its card or a message in its thread, or its title.
---

# Summarize a task

A task's summary says what the issue or request is and what was decided about it, for someone who
wasn't in the discussion. Agents keep it for each other: you start from the one saved and read only
the messages after it, then save yours for the next agent.

## 1. Find the task

- A task ID (`C0123ABCD:1700000000.000100`): use it as `task_id`.
- A link to the task's card or to a message in its thread: `get_thread_history` with `link` gives
  `thread_id`, which is the task's ID when the thread is a task's.
- A title or a description: `get_tasks`, and pick the one that matches. If more than one could be
  meant, or none, ask.

## 2. Read

1. `get_task_summary` with the `task_id`: the summary saved so far (`summary`, `summary_by`,
   `summary_through`) and the messages of the task's thread after it, oldest first. With no summary
   yet, every message. If `up_to_date`, the saved summary is the answer: give it, and stop.
2. A message with `moved_from` is Cade's copy of the first message of another thread, moved into the
   task. Read the rest of that thread with `get_thread_history` and `moved_from.thread_id`; if Cade
   can't, with your own Slack tools, as the person. If neither can, the copy is all there is of it:
   use that, and say so.
3. Links in the messages (`links`): Cade doesn't open them. Open those that matter with your own tools,
   signed in as the person; if you can't, say so rather than guess what they hold.

## 3. Write

The summary, as the threads now understand it:

- what the problem or request is, who raised it and when;
- the impact: who or what it affects, and how badly;
- the details needed to understand or reproduce it (steps, examples, error text, environment);
- what was decided about it: scope, approach, what is left out.

Leave out the status, people and pull requests: `get_task` gives them as they are now. Plain text,
short paragraphs, `- ` for bullets, people's names rather than `<@U…>` mentions, no secrets,
credentials, internal hostnames, emails or phone numbers: anyone who can read the task's channel gets
it through their own agent. Only what the threads say: if something important is missing, say so to
the person rather than fill it in.

If there is a saved summary, keep what is still right and change only what the new messages show
has changed. If it looks wrong, or was written long ago, call `get_task_summary` again with
`full: true` and write it from the whole thread.

## 4. Give it and save it

Give the person the summary. Then call `save_task_summary` once, with `task_id`, `summary` and the
`through` that `get_task_summary` gave: it needs no approval, as only agents read it. If it is refused
because another agent saved one since, read again with `get_task_summary` and add to that one.
