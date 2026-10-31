import { EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from 'discord.js';
import InteractionHandler from '../InteractionHandler.js';
import fetch from 'node-fetch';
import { Document as Search } from 'flexsearch';

const roles_url = "https://raw.githubusercontent.com/nicholas-eden/townsquare/refs/heads/develop/src/roles.json"
const jinxes_url = "https://raw.githubusercontent.com/nicholas-eden/townsquare/refs/heads/develop/src/jinxes.json"
const additionalRoleData = [
    {
        "id": "bigbarnacle",
        "name": "Big Barnacle",
        "edition": "homebrew",
        "team": "demon",
        "ability": "Each night*, pick a player. Then pick another player you've not picked before. They both become a Crab. Only crab nominations on you can kill you. If you pick a crab at night for a second time they become a super crab. Only 1 minion can be a super crab. If a super crab nominates a regular crab, that player instantly dies and loses their ghost vote. If a super crab nominates another super crab, both super crabs must engage in roshambo until one player wins. The winning player remains a super crab while the loser reverts back to a regular crab and is ashamed. Each night a crab player may swap seats with an alive neighbour. Each night also pick another player. They receive the grimoire except only 1 role is correct. You are \"Mad\" that crabs are awesome or you may die. If a player is \"Mad\" that crabs suck and they neighbour a crab, they may instantly die and lose their dead vote and be asked to leave the room. Each night, pick a player, they die but register as alive. Start knowing any players who received a number 1. Also start by choosing 2 players, they start off as crabs. Crab players lose their previous character ability but are super cool. If a player is executed then during the night they receive an \"L\". During each day, a good player must be \"Mad\" that they worship the crab overlord otherwise may evil win the game. If a player is \"Mad\" that they do not understand how the Big Barnacle's ability works, they may die but cannot leave the game [-Other demons on the script.]",
        "setup": true,
        "thumbnail": "https://i.imgur.com/0Fr5Ane.png",
    }
];

/** @type {Search} */
let roleSearch = null;
let roleData = null;

async function searchRoles(name, limit) {
    if (roleSearch === null) {
        try {
            let response = await fetch(roles_url);
            let body = await response.text();
            let roles = JSON.parse(body);
            if (!Array.isArray(roles))
                throw "Invalid role data detected!";
            roleSearch = new Search({
                document: {
                    id: "id",
                    index: ["name", "ability", "team"],
                },
                tokenize: "forward"
            });
            roleData = [...roles, ...additionalRoleData];
            let roleMap = {};
            for (let i of roleData) {
                i.team = i.team.slice(0, 1).toUpperCase() + i.team.slice(1);
                roleSearch.add(i.id, i);
                roleMap[i.id] = i;
            }
            roleData = roleMap;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    let roles = roleSearch.search(name, {limit: limit, merge: true});
    if (limit != undefined && roles.length > limit)
        roles = roles.slice(0, limit);
    return roles.map(r => roleData[r.id]);
}

InteractionHandler.registerSlashCommand(new SlashCommandBuilder()
    .setName("role")
    .setDescription("Search for info on a role")
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
        let role = null;
        if (roleData.hasOwnProperty(query));
            role = roleData[query];
        let searchResults = roleSearch.search(query, {merge: true});
        if (searchResults.length > 0)
            role = roleData[searchResults[0].id];

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
        const roles = await searchRoles(option.value, 25);
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



async function aawdwadawd() {
              if (msg.content.trim().substring(0, 6).toLowerCase() === "*jinx " || msg.content.trim().substring(0, 8).toLowerCase() === "*jinxes ") {
              const rest = msg.content.trim().substring(6).toLowerCase();
                let roles, role_name, secondrole;
              if (rest.includes(",")) {
                roles = rest.split(',');
                role_name = roles[0].replaceAll(" ", "").replaceAll("-", "");
                secondrole = roles[1].replaceAll(" ", "").replaceAll("-", "");
              }
              else {
                role_name = rest.replaceAll(" ", "").replaceAll("-", "");
                secondrole = null;
              }
                https.get(jinxes_url, async function(res) {
                  let body = "";
          
                  res.on("data", (chunk) => {
                    body += chunk;
                  });
          
                  res.on("end", async function() {
                    try {
                      let json = JSON.parse(body);
                      ////////////////////////
          
                      let mr = await match_role(role_name, json, true);
                      if (mr == -1 && secondrole == null) {
                        let match = null;
                        let curmur;
                        for (let r = 0; r < json.length; r++) {
                            if (!match) {
                                curmur = await match_role(role_name, json[r]["jinx"], true);
                                if (curmur != -1) {
                                    match = json[r]["jinx"][curmur]["id"];
                                    json.push({"id": match, "jinx": []});
                                    mr = json.length - 1;
                                    json[mr]["jinx"].push({"id": json[r]["id"], "reason": json[r]["jinx"][curmur]["reason"]});
                                    role_name = match;
                                }
                            }
                            else {
                                curmur = await match_role(match, json[r]["jinx"], true);
                                if (curmur != -1) {
                                    json[mr]["jinx"].push({"id": json[r]["id"], "reason": json[r]["jinx"][curmur]["reason"]});
                                }
                            }
                        }
                        if (!match) {
                            await respond(msg, "```Role has no jinxes.```");
                            return null;
                        }
                      }
                    else if (mr == -1 && secondrole != null) {
                        let tmp = role_name;
                        role_name = secondrole;
                        secondrole = tmp;
                        mr = await match_role(role_name, json, true);
                        if (mr == -1) {
                            await respond(msg, "```Roles have no jinxes.```");
                            return null;
                        }
                    }
                      let resp;
                      if (secondrole == null) {
                        let curmur, mur2;
                        for (let r = 0; r < json.length; r++) {
                            if (r == mr)
                                continue;
                            curmur = await match_role(json[r]["id"], json[mr]["jinx"], true);
                            if (curmur != -1)
                                continue;
                            curmur = await match_role(role_name, json[r]["jinx"], true);
                            if (curmur != -1) {
                                json[mr]["jinx"].push({"id": json[r]["id"], "reason": json[r]["jinx"][curmur]["reason"]});
                            }
                        }
                        resp = "## Jinxes of " + properCase(json[mr]["id"]) + ":\n";
                        for (let q = 0; q < json[mr]["jinx"].length; q++) {
                          resp += "**" + properCase(json[mr]["jinx"][q]["id"]) + ":** `" + json[mr]["jinx"][q]["reason"] + "`\n";
                        }
                      }
                      else {
                      mr2 = await match_role(secondrole, json[mr]["jinx"], true);
                      if (mr2 == -1)
                            resp = "```There are no jinxes between " + properCase(json[mr]["id"]) + " and " + properCase(secondrole) + "```";
                      else {
                        resp = "## Jinx of " + properCase(json[mr]["id"]) + " and " + properCase(json[mr]["jinx"][mr2]["id"]) + ":\n";
                        resp += "**" + properCase(json[mr]["jinx"][mr2]["id"]) + ":** `" + json[mr]["jinx"][mr2]["reason"] + "`\n";
                      }
                      }
                      await respond(msg, resp);
                    } catch (error) {
                      msg_user(lieu_id, error.message);
                    };
                  });
          
          
                }).on("error", (error) => {
                  msg_user(lieu_id, error.message);
                });
              }
}