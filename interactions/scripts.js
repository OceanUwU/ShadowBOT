import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from 'discord.js';
import InteractionHandler from '../InteractionHandler.js';

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
                .setRequired(false)
            ),

        async interaction => {
            await interaction.reply("test1");
        }
    ],

    [
        new SlashCommandSubcommandBuilder()
            .setName("teensyville")
            .setDescription("Search for a teensy (5-6 player) script"),

        async interaction => {
            await interaction.reply("test2");
        }
    ]
]);