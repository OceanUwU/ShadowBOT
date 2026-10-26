import { SlashCommandBuilder, SlashCommandUserOption } from 'discord.js';
import InteractionHandler from '../InteractionHandler.js';

let last_compliment = -1
let last_insult = -1

const compliments = [", You might be the imp, but you'll always be the saint in my eyes.*",
", You're just so cool, you know?*",
" is a cool and lovely person <3*",
", A win for you, is a win for me.*",
", Are you the imp? because you starpassed to my heart.*",
", You mayor bounce my troubles away :D*",
", I'll always be there to monk protect you*",
", I might not be the butler, but I'll always vote with you*",
", Our friendship is like a sober sailor, it will never die*",
", The world is a better place with you in it <3*",
" is fantastic in every way!*",
", You are as tough as a Soldier, as smart as a Mathematician and as lovely as a Sweetheart!*",
", I don't need a Fortune Teller to know I'm fortunate to have met you.*",
", This game is great, but it's made fun by awesome players like you.*"];

const insults = [", Are you the drunk? or are you just normally like this?*",
", Must be nice being invincible the first time, YOU FOOL!*",
", I'd rather lose than starpass to you :)*",
", You don't have to be an outsider to be a hindrance to your team!*",
", You don't need to be a cerenovus to make me mad for an entire day!*",
", You're the kind of player to ask your evil team for a 3f3...*",
", If you get sheeped any harder you'll be baaing in no time*",
", Hey I'm the grandmother, and I saw you as the Idiot!*"];

InteractionHandler.registerSlashCommand(new SlashCommandBuilder()
    .setName("compliment")
    .setDescription("Compliments a user")
    .addUserOption(option => option
        .setName("user")
        .setDescription("The user to compliment")
        .setRequired(true)
    ),

    async interaction => {
        let rnd = last_insult;
        while (rnd == last_insult)
            rnd = Math.floor(Math.random() * compliments.length);
        last_insult = rnd;
        await interaction.reply(`${interaction.options.getUser("user", true)}${compliments[rnd]}`);
    }
);

InteractionHandler.registerSlashCommand(new SlashCommandBuilder()
    .setName("insult")
    .setDescription("Insults a user")
    .addUserOption(option => option
        .setName("user")
        .setDescription("The user to insult")
        .setRequired(true)
    ),

    async interaction => {
        let rnd = last_insult;
        while (rnd == last_insult)
            rnd = Math.floor(Math.random() * insults.length);
        last_insult = rnd;
        await interaction.reply(`${interaction.options.getUser("user", true)}${insults[rnd]}`);
    }
);