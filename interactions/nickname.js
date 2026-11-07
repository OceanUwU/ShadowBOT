import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import InteractionHandler from '../InteractionHandler.js';
import Nickname from '../Nickname.js';

async function changeNickname(interaction, to, successMessage) {
    let result = await Nickname.change(interaction.member, to);
    if (typeof result == 'string') {
        await interaction.editReply(result);
        return result;
    }
    await interaction.editReply(successMessage);
    return result;
}

async function toggleTag(interaction, has, add, remove, typeName) {
    await interaction.deferReply({ flags: interaction.options.getBoolean("loud") === true ? 0 : MessageFlags.Ephemeral });
    let name = Nickname.baseName(interaction.member);
    if (has(name))
        return await changeNickname(interaction, remove(name), typeName + " tag removed.");
    else
        return await changeNickname(interaction, add(name), typeName + " tag added.");
}

InteractionHandler.registerCommandGroup(new SlashCommandBuilder()
    .setName("tag")
    .setDescription("Edit your nickname quickly"),
[
    [
        new SlashCommandSubcommandBuilder()
            .setName("spectator")
            .setDescription("Toggle the spectator tag (!) in your nickname")
            .addBooleanOption(option => option
                .setName("lfg")
                .setDescription("Include an LFG tag to indicate you're looking to play the next game?")
            )
            .addBooleanOption(option => option
                .setName("loud")
                .setDescription("Should the result be sent to the channel for everyone to see?")
            ),

        async interaction => {
            await interaction.deferReply({ flags: interaction.options.getBoolean("loud") === true ? 0 : MessageFlags.Ephemeral });
            let lfg = interaction.options.getBoolean("lfg") === true;
            let name = Nickname.baseName(interaction.member);
            if (lfg && !Nickname.hasLFGTag(name))
                await changeNickname(interaction, Nickname.addLFGTag(name), "LFG tag added.");
            else if (Nickname.hasSpecTag(name))
                await changeNickname(interaction, Nickname.removeSpecTag(name), "Spectator tag removed.");
            else
                await changeNickname(interaction, Nickname.addSpecTag(name), "Spectator tag added.");
        }
    ],

    [
        new SlashCommandSubcommandBuilder()
            .setName("storyteller")
            .setDescription("Toggle the storyteller tag (ST) in your nickname")
            .addBooleanOption(option => option
                .setName("loud")
                .setDescription("Should the result be sent to the channel for everyone to see?")
            ),

        async interaction => {
            await toggleTag(interaction, Nickname.hasSTTag, Nickname.addSTTag, Nickname.removeStateTags, "Storyteller");
        }
    ],

    [
        new SlashCommandSubcommandBuilder()
            .setName("co-storyteller")
            .setDescription("Toggle the co-storyteller tag (Co-ST) in your nickname")
            .addBooleanOption(option => option
                .setName("loud")
                .setDescription("Should the result be sent to the channel for everyone to see?")
            ),

        async interaction => {
            await toggleTag(interaction, Nickname.hasCoSTTag, Nickname.addCoSTTag, Nickname.removeStateTags, "Co-storyteller");
        }
    ],
    
    [
        new SlashCommandSubcommandBuilder()
            .setName("travel")
            .setDescription("Toggle the traveller tag (T) in your nickname")
            .addBooleanOption(option => option
                .setName("loud")
                .setDescription("Should the result be sent to the channel for everyone to see?")
            ),

        async interaction => {
            await toggleTag(interaction, Nickname.hasTravellerTag, Nickname.addTravellerTag, Nickname.removeStateTags, "Traveller");
        }
    ],
    
    [
        new SlashCommandSubcommandBuilder()
            .setName("afk")
            .setDescription("Toggle the AFK tag [AFK] in your nickname")
            .addBooleanOption(option => option
                .setName("loud")
                .setDescription("Should the result be sent to the channel for everyone to see?")
            ),

        async interaction => {
            await toggleTag(interaction, Nickname.hasAFKTag, Nickname.addAFKTag, Nickname.removeAFKOrBRBTag, "AFK");
        }
    ],
    
    [
        new SlashCommandSubcommandBuilder()
            .setName("brb")
            .setDescription("Toggle the BRB tag [BRB] in your nickname")
            .addBooleanOption(option => option
                .setName("loud")
                .setDescription("Should the result be sent to the channel for everyone to see?")
            ),

        async interaction => {
            await toggleTag(interaction, Nickname.hasBRBTag, Nickname.addBRBTag, Nickname.removeAFKOrBRBTag, "BRB");
        }
    ],
    
    [
        new SlashCommandSubcommandBuilder()
            .setName("text")
            .setDescription("Toggle the text player tag [TEXT] in your nickname")
            .addBooleanOption(option => option
                .setName("loud")
                .setDescription("Should the result be sent to the channel for everyone to see?")
            ),

        async interaction => {
            await toggleTag(interaction, Nickname.hasTextTag, Nickname.addTextTag, Nickname.removeTextTag, "Text player");
        }
    ],
    
    [
        new SlashCommandSubcommandBuilder()
            .setName("newplayer")
            .setDescription("Toggle the new player tag [N] in your nickname")
            .addBooleanOption(option => option
                .setName("loud")
                .setDescription("Should the result be sent to the channel for everyone to see?")
            ),

        async interaction => {
            await toggleTag(interaction, Nickname.hasNewPlayerTag, Nickname.addNewPlayerTag, Nickname.removeNewPlayerTag, "New player");
        }
    ],
]);

const nicks = {};

InteractionHandler.registerSlashCommand(new SlashCommandBuilder()
    .setName("vote")
    .setDescription("Change your nickname to vote for a player")
    .addStringOption(option => option
        .setName("name")
        .setDescription("The name of the player to vote for")
        .setRequired(true)
        .setMaxLength(32)
    ),

    async interaction => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        let originalName = Nickname.baseName(interaction.member);
        let result = await changeNickname(interaction, interaction.options.getString("name", true),
            {
                content: "Your nickname was updated to reflect your vote.",
                components: [new ActionRowBuilder().addComponents(new ButtonBuilder()
                    .setCustomId("unvote")
                    .setLabel("Remove vote")
                    .setStyle(ButtonStyle.Primary))]
        });
        if (result === true)
            nicks[interaction.user.id] = originalName;
    }
);

async function unvote(interaction) {
    if (!nicks.hasOwnProperty(interaction.user.id))
        return await interaction.editReply();
    await changeNickname(interaction, nicks[interaction.user.id], "Vote removed.");
    delete nicks[interaction.user.id];
}

InteractionHandler.registerButton("unvote", async interaction => await unvote(interaction));

InteractionHandler.registerSlashCommand(new SlashCommandBuilder()
    .setName("unvote")
    .setDescription("Revert your nickname to what it was before you used /vote"),

    async interaction => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        await unvote(interaction);
    }
);