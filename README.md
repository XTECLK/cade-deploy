# Cade deploy

Your own deployment of [Cade](https://github.com/XTECLK/Cade), the Slack app for tracking a team's tasks and incidents. This repo holds **your settings**, not Cade's code: Cade is checked out at the version you choose, and updating it is one command.

**Use this template** (the green button above), make the copy **private**, then clone it. It will hold your Cloudflare account, the IDs of your Slack app, your settings and your team's prompts for AI agents.

## Set up

You need Node.js 22.18 or newer, git, a Cloudflare account (free is enough), and a Slack workspace where you can create apps.

```sh
git clone https://github.com/<you>/<your copy>.git cade-deploy
cd cade-deploy
npm run setup
```

`npm run setup` asks which version of Cade to deploy: a release, or `main`, the latest development version. It then checks that version out into `.cade-src/`, installs it, and takes you through Cloudflare, the Slack app and the first admin. Then, in Slack, you create a channel, invite Cade (`/invite @Cade`), open Cade's Home tab and click **Add project**. Run it again to carry on if it stops.

Commit what it made when it finishes:

```sh
git add -A && git commit -m "Set up Cade" && git push
```

## What is in this repo

| Path | What it is | Commit it? |
| --- | --- | --- |
| `.cade/version.json` | The Cade version you chose. | Yes |
| `.cade/cloudflare.json` | Your Cloudflare account, and an optional custom `domain`. | Yes |
| `.cade/slack-app.json` | The IDs and addresses of your Slack app. No tokens. | Yes |
| `cade.config.json` | Your settings: timezone, admins, and any projects you keep in the file. `npm run config` uploads it. | Yes |
| `prompts/` | Your team's prompts for AI agents connected to Cade: a task's summary and an executive summary to start with, to change or add to. `npm run prompts` saves them, and `npm run deploy` does too. See [prompts/README.md](prompts/README.md). | Yes |
| `.cade-src/` | Cade's code at your version. Made for you. | No (ignored) |

Tokens and secrets are asked for by the scripts, hidden, and kept only in Cloudflare. Nothing here holds a secret.

## Day to day

Every Cade script runs here with the same name. Everything after `--` goes to the script.

```sh
npm run config                              # upload cade.config.json
npm run deploy                              # deploy the chosen version
npm run dev                                 # run it locally
npm run wrangler -- tail                    # wrangler, on your account (logs, secrets…)
npm run prompts                             # save prompts/ to your Cade (see prompts/README.md)
```

## Update Cade

```sh
npm run upgrade                  # lists the releases and main, and asks
npm run upgrade -- v1.3.0        # or name one
npm run deploy                   # deploys it, and applies new database changes
npm run slack:update             # only if the release notes say the Slack app changed
git add -A && git commit -m "Cade v1.3.0" && git push
```

Choosing `main` follows the latest development version: `npm run deploy`, `setup` and `slack:update` first fetch its newest changes. A release stays exactly as it was released until you upgrade.

`npm run version` shows what you are on. To roll back, `npm run upgrade -- <the earlier release>` and deploy again.

Other forks of Cade work too: put `"repo": "https://github.com/<you>/Cade.git"` in `.cade/version.json`.

## More

The step-by-step guide, with what to expect at each step and what to do when one fails, is [Cade's GETTING_STARTED.md](https://github.com/XTECLK/Cade/blob/main/GETTING_STARTED.md).
