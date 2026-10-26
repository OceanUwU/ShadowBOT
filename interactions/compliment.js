import { SlashCommandBuilder } from 'discord.js';
import InteractionHandler from '../InteractionHandler.js';

InteractionHandler.registerSlashCommand(new SlashCommandBuilder()
    .setName("compliment")
    .setDescription("Compliments a user"),

    async interaction => {
        await interaction.reply("test");
    }
);

InteractionHandler.registerSlashCommand(new SlashCommandBuilder()
    .setName("compliment2")
    .setDescription("Compliments a user 2"),

    async interaction => {
        await interaction.reply("test2");
    }
);