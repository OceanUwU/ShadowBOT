import discord, { SlashCommandBuilder, Client, ContextMenuCommandBuilder, ApplicationCommandType, ChatInputCommandInteraction, ContextMenuCommandInteraction, UserContextMenuCommandInteraction, SlashCommandSubcommandBuilder, AutocompleteInteraction } from 'discord.js';


class InteractionHandler {
    static commands = [];
    static contextMenuCommands = [];
    static userContextMenuCommands = [];
    static commandHandlers = {};
    static contextMenuCommandHandlers = {};
    static userContextMenuCommandHandlers = {};
    static autocompleteHandlers = {};
    static initialized = false;

    /**
     * @param {SlashCommandBuilder} commandBuilder 
     * @param {function(ChatInputCommandInteraction):void} callback
     */
    static registerSlashCommand(commandBuilder, callback) {
        if (this.initialized)
            throw new Error("Cannot register new commands after initialization!");
        this.commands.push([commandBuilder, callback]);
    }
    /**
     * @param {SlashCommandBuilder} commandBuilder
     * @param {Array.<[SlashCommandSubcommandBuilder, function(ChatInputCommandInteraction):void]>} subcommands
     */
    static registerCommandGroup(commandBuilder, subcommands) {
        if (this.initialized)
            throw new Error("Cannot register new commands after initialization!");
        let subcommandMap = {};
        for (let subcommand of subcommands) {
            commandBuilder.addSubcommand(subcommand[0]);
            subcommandMap[subcommand[0].name] = subcommand[1];
            this.commands.push([subcommand[0], subcommand[1]]);
        }
        this.commands.push([commandBuilder, subcommandMap]);
    }

    /**
     * @param {ContextMenuCommandBuilder} commandBuilder 
     * @param {function(ContextMenuCommandInteraction):void} callback
     */
    static registerContextMenuCommand(commandBuilder, callback) {
        if (this.initialized)
            throw new Error("Cannot register new commands after initialization!");
        this.contextMenuCommands.push([commandBuilder, callback]);
    }
    
    /**
     * @param {ContextMenuCommandBuilder} commandBuilder 
     * @param {function(UserContextMenuCommandInteraction):void} callback
     */
    static registerUserContextMenuCommand(commandBuilder, callback) {
        if (this.initialized)
            throw new Error("Cannot register new commands after initialization!");
        this.userContextMenuCommands.push([commandBuilder, callback]);
    }
    
    /**
     * @param {string} name 
     * @param {function(AutocompleteInteraction, import('discord.js').AutocompleteFocusedOption):void} callback
     */
    static registerAutocomplete(name, callback) {
        if (this.initialized)
            throw new Error("Cannot register new interactions after initialization!");
        this.autocompleteHandlers[name] = callback;
    }

    /**
     * @param {discord.Interaction} interaction 
     */
    static handle(interaction) {
        try {
            if (!this.initialized)
                throw new Error("Cannot handle interactions before initialization!");

            if (interaction.isChatInputCommand()) {
                if (this.commandHandlers.hasOwnProperty(interaction.commandId)) {
                    let handler = this.commandHandlers[interaction.commandId];
                    if (typeof(handler) == 'function')
                        handler(interaction)
                    else
                        handler[interaction.options.getSubcommand(true)](interaction)
                }
            } else if (interaction.isContextMenuCommand()) {
                if (this.contextMenuCommandHandlers.hasOwnProperty(interaction.commandId))
                    this.contextMenuCommandHandlers[interaction.commandId](interaction);
            } else if (interaction.isUserContextMenuCommand()) {
                if (this.userContextMenuCommandHandlers.hasOwnProperty(interaction.commandId))
                    this.userContextMenuCommandHandlers[interaction.commandId](interaction);
            } else if (interaction.isAutocomplete()) {
                let commandName = interaction.commandName;
                let subcommand = interaction.options.getSubcommand(true);
                if (subcommand != null)
                    commandName += "/" + subcommand;
                let option = interaction.options.getFocused(true);
                if (option == null)
                    return;
                commandName += "/" + option.name;
                if (this.autocompleteHandlers.hasOwnProperty(commandName))
                    this.autocompleteHandlers[commandName](interaction, option);
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
        if (this.initialized)
            throw new Error("Cannot initialize twice!");

        let builders = [...this.commands, ...this.contextMenuCommands, ...this.userContextMenuCommands].map(c => c[0]);
        

        let registered;

        if (guildOnly == null)
            registered = await client.application?.commands.set(builders);
        else {
            client.application?.commands.set([]);
            registered = await (await client.guilds.fetch(guildOnly)).commands.set(builders);
        }

        registered.each((command, id) => {
            if (command.type == ApplicationCommandType.ChatInput)
                this.commandHandlers[id] = this.commands.find(c => c[0].name == command.name)[1];
            else if (command.isContextMenuCommand())
                this.contextMenuCommandHandlers[id] = this.contextMenuCommands.find(c => c[0].name == command.commandName)[1];
            else if (command.isUserContextMenuCommand())
                this.userContextMenuCommandHandlers[id] = this.userContextMenuCommands.find(c => c[0].name == command.commandName)[1];
        });
        this.commands.length = 0;
        this.contextMenuCommands.length = 0;
        this.userContextMenuCommands.length = 0;
        this.initialized = true;

        return registered;
    }
}

export default InteractionHandler;