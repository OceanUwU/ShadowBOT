import discord, { SlashCommandBuilder, Client, ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';

const commands = [];
const contextMenuCommands = [];
const userContextMenuCommands = [];
const commandHandlers = {};
const contextMenuCommandHandlers = {};
const userContextMenuCommandHandlers = {};
let initialized = false;

class InteractionHandler {
    /**
     * @param {SlashCommandBuilder} commandBuilder 
     * @param {function(discord.Interaction):void} callback
     */
    static registerSlashCommand(commandBuilder, callback) {
        if (initialized)
            throw new Error("Cannot register new commands after initialization!");
        commands.push([commandBuilder, callback]);
    }

    /**
     * @param {ContextMenuCommandBuilder} commandBuilder 
     * @param {function(discord.Interaction):void} callback
     */
    static registerContextMenuCommand(commandBuilder, callback) {
        if (initialized)
            throw new Error("Cannot register new commands after initialization!");
        contextMenuCommands.push([commandBuilder, callback]);
    }
    
    /**
     * @param {ContextMenuCommandBuilder} commandBuilder 
     * @param {function(discord.Interaction):void} callback
     */
    static registerUserContextMenuCommand(commandBuilder, callback) {
        if (initialized)
            throw new Error("Cannot register new commands after initialization!");
        userContextMenuCommands.push([commandBuilder, callback]);
    }

    /**
     * @param {discord.Interaction} interaction 
     */
    static handle(interaction) {
        try {
            if (!initialized)
                throw new Error("Cannot handle interactions before initialization!");

            if (interaction.isChatInputCommand()) {
                if (commandHandlers.hasOwnProperty(interaction.commandId))
                    commandHandlers[interaction.commandId](interaction);
            } else if (interaction.isContextMenuCommand()) {
                if (contextMenuCommandHandlers.hasOwnProperty(interaction.commandId))
                    contextMenuCommandHandlers[interaction.commandId](interaction);
            } else if (interaction.isUserContextMenuCommand()) {
                if (userContextMenuCommandHandlers.hasOwnProperty(interaction.commandId))
                    userContextMenuCommandHandlers[interaction.commandId](interaction);
            } else if (interaction.isAutocomplete()) {

            } else if (interaction.isButton()) {

            } else if (interaction.isSelectMenu()) {

            }
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * @param {Client} client
     * @param {string} guildOnly
     */
    static async initialize(client, guildOnly) {
        if (initialized)
            throw new Error("Cannot initialize twice!");

        let builders = [...commands, ...contextMenuCommands, ...userContextMenuCommands].map(c => c[0]);
        

        let registered;

        if (guildOnly == null)
            registered = await client.application?.commands.set(builders);
        else {
            client.application?.commands.set([]);
            registered = await (await client.guilds.fetch(guildOnly)).commands.set(builders);
        }

        registered.each((command, id) => {
            if (command.type == ApplicationCommandType.ChatInput)
                commandHandlers[id] = commands.find(c => c[0].name == command.name)[1];
            else if (command.isContextMenuCommand())
                contextMenuCommandHandlers[id] = contextMenuCommands.find(c => c[0].name == command.commandName)[1];
            else if (command.isUserContextMenuCommand())
                userContextMenuCommandHandlers[id] = userContextMenuCommands.find(c => c[0].name == command.commandName)[1];
        });
        commands.length = 0;
        contextMenuCommands.length = 0;
        userContextMenuCommands.length = 0;
        initialized = true;
    }
}

export default InteractionHandler;