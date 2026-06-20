import { defineSchedule } from "eve/schedules";
import discord from "../channels/discord.js";
import { DIGEST_CHANNEL_ID } from "../lib/discord-config.js";
import { DIGEST_PROMPT } from "../lib/digest-prompt.js";

export default defineSchedule({
  cron: "0 8 * * *",
  async run({ receive, waitUntil, appAuth }) {
    waitUntil(
      receive(discord, {
        message: DIGEST_PROMPT,
        target: { channelId: DIGEST_CHANNEL_ID },
        auth: appAuth,
      }),
    );
  },
});
