#!/usr/bin/env node

/**
 * Registers global Discord slash commands for this agent.
 * Requires DISCORD_APPLICATION_ID and DISCORD_BOT_TOKEN (env or .env via --env-file).
 */

import {
  DIGEST_COMMAND_NAME,
} from "../agent/lib/digest-prompt.ts";

const applicationId = process.env.DISCORD_APPLICATION_ID?.trim();
const botToken = process.env.DISCORD_BOT_TOKEN?.trim();

if (!applicationId || !botToken) {
  console.error(
    "Missing DISCORD_APPLICATION_ID or DISCORD_BOT_TOKEN. Set them in .env or the shell.",
  );
  process.exit(1);
}

const commands = [
  {
    name: DIGEST_COMMAND_NAME,
    description: "Run the Smart Digest now (HN + YouTube → filtered summary)",
    type: 1,
  },
];

const response = await fetch(
  `https://discord.com/api/v10/applications/${applicationId}/commands`,
  {
    method: "PUT",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  },
);

if (!response.ok) {
  const body = await response.text();
  console.error(`Discord command registration failed (${response.status}): ${body}`);
  process.exit(1);
}

const registered = await response.json();
console.log(
  `Registered ${registered.length} global command(s): ${registered.map((c) => `/${c.name}`).join(", ")}`,
);
