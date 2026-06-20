import { defaultDiscordAuth, discordChannel } from "eve/channels/discord";
import {
  DIGEST_COMMAND_NAME,
  DIGEST_PROMPT,
} from "../lib/digest-prompt.js";

export default discordChannel({
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
