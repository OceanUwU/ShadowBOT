import { AutocompleteInteraction, EmbedBuilder, Role, SlashCommandBuilder } from "discord.js";
import InteractionHandler from "../InteractionHandler.js";
import fetch from 'node-fetch';
import RoleData from "../RoleData.js";

const jinxesUrl = "https://raw.githubusercontent.com/nicholas-eden/townsquare/refs/heads/develop/src/jinxes.json"
const allJinxesImage = "https://media.discordapp.net/attachments/904250103588597790/1427728667089436854/jinx_rules_1.png\nhttps://media.discordapp.net/attachments/904250103588597790/1427728668305915934/jinx_rules_2.png\
	\n\nNo roles specified, displaying all jinxes.\n-# (To see in better quality, right click and open in browser, or download the image)"

let jinxData = null;
let jinxedRoles = null;

async function getJinxes() {
    if (jinxData === null) {
        try {
            let response = await fetch(jinxesUrl);
            let body = await response.text();
            let jinxes = JSON.parse(body);
            if (!Array.isArray(jinxes))
                throw "Invalid jinx data detected!";
            let jinxMap = {};
            let jinxedChars = [];
            for (let jinxList of jinxes) {
                for (let jinx of jinxList.jinx) {
                    let id1 = jinxList.id;
                    let id2 = jinx.id;
                    if (!jinxedChars.includes(id1)) {
                        jinxedChars.push(id1);
                        jinxMap[id1] = {};
                    }
                    if (!jinxedChars.includes(id2)) {
                        jinxedChars.push(id2);
                        jinxMap[id2] = {};
                    }
                    jinxMap[id1][id2] = jinx.reason;
                    jinxMap[id2][id1] = jinx.reason;
                }
            }
            jinxData = jinxMap;
            jinxedRoles = jinxedChars;
        } catch (e) {
            console.error(e);
            return null;
        }
    }
    return jinxData;
}

InteractionHandler.registerSlashCommand(new SlashCommandBuilder()
    .setName("jinx")
    .setDescription("Search for a Djinn jinx")
    .addStringOption(option => option
        .setName("role")
        .setDescription("The role to find a jinx for")
        .setAutocomplete(true)
    )
    .addStringOption(option => option
        .setName("role2")
        .setDescription("The jinxed role to find")
        .setAutocomplete(true)
    )
    .addBooleanOption(option => option
        .setName("quiet")
        .setDescription("Should only you be able to see the result?")
    ),

    async interaction => {
        await interaction.deferReply({ flags: interaction.options.getBoolean("quiet") === true ? MessageFlags.Ephemeral : 0 });
        let role1 = interaction.options.getString("role", false);
        let role2 = interaction.options.getString("role2", false);
        if (role1 == null) { //if at least one of the options is empty, swap them so the 2nd option is always the empty one
            role1 = role2
            role2 = null;
        }
        if (role1 == null) {
            await interaction.editReply(allJinxesImage);
            return;
        }
        let jinxes = await getJinxes();
        if (jinxes == null) return interaction.editReply("could not load jinxes");
        if (role2 != null) { //if both roles are specified
            role1 = await RoleData.byIdOrSearch(role1);
            role2 = await RoleData.byIdOrSearch(role2);
            if (role1 == null || role2 == null || !jinxes.hasOwnProperty(role1.id) || !jinxes[role1.id].hasOwnProperty(role2.id))
                return interaction.editReply("Role or Jinx not found.");
            let jinx = jinxes[role1.id][role2.id];
            return await interaction.editReply({ embeds: [new EmbedBuilder().setTitle(`${role1.name} / ${role2.name} Jinx`).setDescription(jinx)] });
        } else { // only one role specified, return all relevant jinxes for the role
            role1 = await RoleData.byIdOrSearch(role1);
            if (role1 == null )
                return interaction.editReply("Role not found.");
            if (!jinxes.hasOwnProperty(role1.id))
                return interaction.editReply("Role has no jinxes.");
            jinxes = jinxes[role1.id];
            return interaction.editReply({ embeds: [new EmbedBuilder()
                .setTitle(`${role1.name} Jinxes`)
                .setURL("https://wiki.bloodontheclocktower.com/" + role1.name.replaceAll(" ", "_"))
                .setDescription((await Promise.all(Object.keys(jinxes).map(async r => {
                    r = await RoleData.byId(r);
                    if (r == null) return null;
                    return `**${r.name}**: \`${jinxes[r.id]}\``;
                }))).filter(r => r != null).join("\n"))
            ] });
        }
    }
)

/**
 * 
 * @param {AutocompleteInteraction} interaction 
 */
async function getJinxedCharactersAutocomplete(interaction, option, option2) {
    option = interaction.options.getString(option, false);
    option2 = interaction.options.getString(option2, false);
    let jinxes = await getJinxes();
    if (await jinxes == null) return;
    if (option == null)
        return;
    if (option2 != null) {
        let role1 = await RoleData.byIdOrSearch(option2);
        if (role1 != null && jinxedRoles.includes(role1.id)) {
            let possibleJinxes = jinxes[role1.id];
            let roles;
            if (option == "") {
                let allRoles = await RoleData.all();
                if (allRoles == null) return null;
                roles = await Promise.all(Object.keys(possibleJinxes).map(async id => await RoleData.byId(id)));
            } else {
                roles = await RoleData.search(option);
                if (roles === null) return;
                roles = roles.filter(r => Object.keys(possibleJinxes).includes(r.id));
            }
            roles = roles.slice(0, 25);
            interaction.respond(roles.map(r => {
                let jinxText = `${role1.name} / ${r.name} - ${possibleJinxes[r.id]}`;
                if (jinxText.length > 100)
                    jinxText = jinxText.slice(0, 97) + "...";
                return {
                    name: jinxText,
                    value: r.id,
                };
            }));
            return;
        }
    }
    let roles = await RoleData.search(option);
    roles = roles.filter(r => jinxedRoles.includes(r.id));
    if (roles === null) return;
    roles = roles.slice(0, 25);
    interaction.respond(roles.map(r => {
        let roleText = `${r.name} (${r.team}) - ${r.ability}`;
        if (roleText.length > 100)
            roleText = roleText.slice(0, 97) + "...";
        return {
            name: roleText,
            value: r.id,
        };
    }));
}

InteractionHandler.registerAutocomplete("jinx/role", async (interaction, option) => {
    try {
        await getJinxedCharactersAutocomplete(interaction, "role", "role2");
    } catch (e) {
        console.error(e);
    }
});

InteractionHandler.registerAutocomplete("jinx/role2", async (interaction, option) => {
    try {
        await getJinxedCharactersAutocomplete(interaction, "role2", "role");
    } catch (e) {
        console.error(e);
    }
});