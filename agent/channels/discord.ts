import { defaultDiscordAuth, discordChannel } from "eve/channels/discord";
import {
  DIGEST_COMMAND_NAME,
  DIGEST_PROMPT,
} from "../lib/digest-prompt.js";

export default discordChannel({
  credentials: {
    applicationId: () => process.env.DISCORD_APPLICATION_ID!,
    botToken: () => process.env.DISCORD_BOT_TOKEN!,
    publicKey: () => process.env.DISCORD_PUBLIC_KEY!,
  },
  onCommand(_ctx, interaction) {
    if (interaction.commandName === DIGEST_COMMAND_NAME) {
      return {
        auth: defaultDiscordAuth(interaction),
        context: [DIGEST_PROMPT],
      };
    }

    return { auth: defaultDiscordAuth(interaction) };
  },
});
