import { EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from 'discord.js';
import InteractionHandler from '../InteractionHandler.js';
import RoleData from '../RoleData.js';

InteractionHandler.registerSlashCommand(new SlashCommandBuilder()
    .setName("role")
    .setDescription("Search for info on a role")
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    .addStringOption(option => option
        .setName("role")
        .setDescription("The role to search for")
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addBooleanOption(option => option
        .setName("quiet")
        .setDescription("Should only you be able to see the result?")
    ),

    async interaction => {
        await interaction.deferReply({ flags: interaction.options.getBoolean("quiet") === true ? MessageFlags.Ephemeral : 0 });
        let query = interaction.options.getString("role");
        if (query.length <= 0) {
            interaction.editReply("Role field is empty!");
            return;
        }
        let role = await RoleData.byIdOrSearch(query);
        if (role == null) {
            interaction.editReply("Role not found.");
            return;
        }

        let embed = new EmbedBuilder().setTitle(`**${role.name}** *(${role.team})*`);
        let edition = null;

        switch (role.team) {
            case "Townsfolk":
                embed.setColor("#00049f");
                break;
            case "Outsider":
                embed.setColor("#00bbff");
                break;
            case "Minion":
                embed.setColor("#ff8800");
                break;
            case "Demon":
                embed.setColor("#ff0000");
                break;
            case "Traveller":
                embed.setColor("#ff00ff");
                break;
            case "Fabled":
                embed.setColor("#ffcc00");
                break;
            case "Loric":
                embed.setColor("#42ad36");
                break;
        }

        switch (role.edition) {
            case "tb":
                edition = "[Trouble Brewing](https://wiki.bloodontheclocktower.com/Trouble_Brewing)";
                break;
            case "snv":
                edition = "[Sects & Violets](https://wiki.bloodontheclocktower.com/Sects_%26_Violets)";
                break;
            case "bmr":
                edition = "[Bad Moon Rising](https://wiki.bloodontheclocktower.com/Bad_Moon_Rising)";
                break;
            case "carousel":
                edition = "[Experimental](https://wiki.bloodontheclocktower.com/Experimental)";
                break;
            case "Fabled":
                edition = "[Fabled](https://wiki.bloodontheclocktower.com/Fabled)";
                break;
            case "Loric":
                edition = "[Loric](https://wiki.bloodontheclocktower.com/Loric)";
                break;
            case "homebrew":
                edition = "Homebrew";
                break;
        }

        let description = "";
        if (edition != null)
            description += `-# ${edition}\n`;
        description += role.ability;
        embed.setDescription(description);

        if (role.hasOwnProperty("thumbnail"))
            embed.setThumbnail(role.thumbnail);
        else
            embed.setThumbnail("https://raw.githubusercontent.com/tomozbot/botc-icons/refs/heads/main/PNG/" + role.id + ".png");

        if (role.edition != "homebrew")
            embed.setURL("https://wiki.bloodontheclocktower.com/" + role.name.replaceAll(" ", "_"));

        interaction.editReply({embeds: [embed]});
    }
);

InteractionHandler.registerAutocomplete("role/role", async (interaction, option) => {
    try {
        const roles = await RoleData.search(option.value, 25);
        if (roles === null) return;
        interaction.respond(roles.map(r => {
            let roleText = `${r.name} (${r.team}) - ${r.ability}`;
            if (roleText.length > 100)
                roleText = roleText.slice(0, 97) + "...";
            return {
                name: roleText,
                value: r.id,
            };
        }));
    } catch (e) {
        console.error(e);
    }
});