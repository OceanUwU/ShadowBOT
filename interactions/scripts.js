import { InteractionContextType, MessageFlags, SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from 'discord.js';
import InteractionHandler from '../InteractionHandler.js';
import fetch from 'node-fetch';

const scriptSiteBaseUrl = "https://www.botcscripts.com/"

async function scriptSearch(type, query, author=null) {
    try {
        let url = `${scriptSiteBaseUrl}api/scripts/?script_type=${type}&search=${encodeURIComponent(query).replaceAll("%20","+")}`;
        if (author != null) url += "&author="+encodeURIComponent(author).replaceAll("%20","+");
        let response = await fetch(url);
        let body = await response.text();
        return JSON.parse(body).results;
    } catch (e) {
        console.error(e);
        return null;
    }
}

async function topScriptResults(type, query) {
    let results = await scriptSearch(type, query);
    if (results == null) return [];
    return results.slice(0, 25).map(r => ({name: `${r.name} by ${r.author}`, value: r.script_id.toString()}));
}

async function getScript(interaction, type) {
    await interaction.deferReply({ flags: interaction.options.getBoolean("quiet") === true ? MessageFlags.Ephemeral : 0 });
    let query = interaction.options.getString("name");
    let author = null;
    let id = Number.parseInt(query);
    if (Number.isNaN(id)) {
        let results = await scriptSearch(type, query, author);
        if (results == null || results.length == 0)
            return await interaction.editReply("Could not find that script");
        id = results[0].script_id;
    }
    await interaction.editReply(`${scriptSiteBaseUrl}script/${id}`);
}

InteractionHandler.registerCommandGroup(new SlashCommandBuilder()
    .setName("script")
    .setDescription("Search for a script from botcscripts.com"),
[
    [
        new SlashCommandSubcommandBuilder()
            .setName("full")
            .setDescription("Search for a full (7+ player) script")
            .addStringOption(option => option
                .setName("name")
                .setDescription("The name of the script to search for")
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addBooleanOption(option => option
                .setName("quiet")
                .setDescription("Should only you be able to see the result?")
            ),

        async interaction => {
            await getScript(interaction, "Full");
        }
    ],

    [
        new SlashCommandSubcommandBuilder()
            .setName("teensyville")
            .setDescription("Search for a teensy (5-6 player) script")
            .addStringOption(option => option
                .setName("name")
                .setDescription("The name of the script to search for")
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addBooleanOption(option => option
                .setName("quiet")
                .setDescription("Should only you be able to see the result?")
            ),

        async interaction => {
            await getScript(interaction, "Teensyville");
        }
    ]
]);

InteractionHandler.registerAutocomplete("script/full/name", async (interaction, option) => {
    try {
        interaction.respond(await topScriptResults("Full", option.value));
    } catch (e) {}
});

InteractionHandler.registerAutocomplete("script/teensyville/name", async (interaction, option) => {
    try {
        await interaction.respond(await topScriptResults("Teensyville", option.value));
    } catch (e) {}
});