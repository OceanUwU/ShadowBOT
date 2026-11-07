import dotenv from 'dotenv';
import { exec }  from "child_process";
import { 
	Client,
	ChannelType,
	GatewayIntentBits, 
	EmbedBuilder,
	Partials,
  Events
  }  from 'discord.js';
import WebSocket from 'ws';
import crypto from 'crypto';

dotenv.config();

const client = new Client({
	intents: [
	  GatewayIntentBits.Guilds,
	  GatewayIntentBits.GuildVoiceStates,
	  //GatewayIntentBits.GuildMessages,
	  //GatewayIntentBits.GuildMembers,
	  //GatewayIntentBits.GuildMessageReactions,
	  //GatewayIntentBits.MessageContent
	]
});

import './interactions/index.js';
import InteractionHandler from './InteractionHandler.js';


client.on(Events.InteractionCreate, async interaction => {
  await InteractionHandler.handle(interaction);
});


var stdic = {};
var medic = {};

var grim_serv = -1
var grim_link = -1
var grim_setter = -1

var grim_servs = []
var grim_links = []
var grim_setters = []
var grim_channel = []

var next_game = []

var move_blacklist = []

var secret_polls = []

const moonsties_id = "1273651260003844108";
const shovel_id = "1146523171999207465";

var comps = [[3, 0, 1, 1],
[3, 1, 1, 1],
[5, 0, 1, 1],
[5, 1, 1, 1],
[5, 2, 1, 1],
[7, 0, 2, 1],
[7, 1, 2, 1],
[7, 2, 2, 1],
[9, 0, 3, 1],
[9, 1, 3, 1],
[9, 2, 3, 1]]

var timers = []

var lieu_id = '549986826794827786'

let responding = true;
let running_cycle = false;

console.log(lieu_id, "ALRIGHT, STARTING UP!!!");

client.on(Events.ClientReady, async e => {
  console.log(`Logged in as ${client.user.tag}! Registering commands...`)
  let registered = await InteractionHandler.initialize(client, process.env.TEST_GUILD);
  console.log(`Registered ${registered.size} commands!`);
})

const properCase = str => str.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());

function defer() {

    let res = () => {};
    let rej = () => {};

    const promise = new Promise((resolve, reject) => {
        res = resolve;
        rej = reject;
    });

    promise.resolve = (value) => {
        res(value);
        return promise;
    };

    promise.reject = (reason) => {
        rej(reason);
        return promise;
    };

    return promise;

}

function createTimer(time) {

    const promise = defer();
    const timeout = setTimeout(() => promise.resolve(), time);

    promise.cancel = () => {
        promise.reject("cancelled");
        clearTimeout(timeout);
    };

    return promise;

}

async function connectToGame(gameUrl, gameChannel) {
    const session = new URL(gameUrl).hash.substring(1);
    const playerId = `spy_${crypto.randomBytes(4).toString('hex')}`;

    return new Promise((resolve, reject) => {
        const ws = new WebSocket(
            `wss://clocktower.live:8001/${session}/${playerId}`,
            {
                rejectUnauthorized: false,
                headers: {
                    Origin: 'https://clocktower.live'
                }
            }
        );

        ws.on('open', () => {
            ws.send(JSON.stringify([
                'direct',
                {
                    host: ['getGamestate', playerId]
                }
            ]));
        });

		let script = "Custom Script ✨";
        ws.on('message', data => {
            try {
                const message = JSON.parse(data.toString());
                const [type, payload] = message;
				if (type === 'edition') {
					let sid = '';
                    sid = payload["edition"]["id"];
					if (sid == "tb")
						script = "Trouble Brewing 🫟";
					else if (sid == "bmr")
						script = "Bad Moon Rising 🌙";
					else if (sid == "snv")
						script = "Sects & Violets 🌸";
					else if (sid == "custom") {
						let sname = payload["edition"]["name"];
						let sauth = payload["edition"]["author"];
						if (sname) {
							script = sname + " ✨";
						}
						if (sauth) {
							script += " by " + sauth;
						}
					}
                }
                if (type === 'gs') {
					let players = payload["gamestate"];
					let cnt = players.length;
					let alive = 0;
					let dead = 0;
					let travs = 0;
					for (let i = 0; i < players.length; i++) {
						if (players[i]["isDead"])
							dead++;
						else
							alive++;
						if (players[i]["roleId"])
							travs++;
					}
					let resp = '- <#' + gameChannel + '>\n<' + gameUrl + '> - ' + script + "\n";
					resp += cnt + " players: " + alive + " alive, " + dead + " dead";
					if (travs == 1)
						resp += " [1 is a traveller]";
					else if (travs > 1)
						resp += " [" + travs + " are travellers]";
                    resolve(resp);

                    // We're done with this socket.
                    ws.close();
                }
            } catch (err) {
                // Ignore messages that aren't valid JSON.
            }
        });

        ws.on('error', err => {
            reject(err);
        });

        ws.on('close', () => {
            // Socket has closed.
        });
    });
}

async function find_consult(msg, categoryid) {
  let channels = await msg.guild.channels.cache.filter(c => c.parentId == categoryid && c.type === ChannelType.GuildVoice);
  for (const [channelID, channel] of channels) {
    // msg_user(lieu_id,channelID+"- "+channel.name.toLowerCase())
    if (channel.name.toLowerCase().indexOf("consult") != -1) {
      // msg_user(lieu_id,"JASKDFJLAKSDFJKLASJDFKLAJSDFKLAS");
      return channel
    }
  }
  return null
}


async function find_target(msg, name) {
  let p = null
  const channels = await msg.guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice);

  for (const [channelID, channel] of channels) {
    for (const [memberID, member] of channel.members) {/*console
log(member.displayName.trim().toLowerCase()+","+ name.trim().toLowerCase())*/

      if (member.displayName.trim().toLowerCase().indexOf(name.trim().toLowerCase()) > -1) {
        p = member.user
        break
      }
    }
  }
  return p
}

async function first_word(text) {
  let txt = "";
  for (let i = 0; i < text.length; i++) {
    if ((text.charCodeAt(i) >= 65 && text.charCodeAt(i) <= 90) || (text.charCodeAt(i) >= 97 && text.charCodeAt(i) <= 122)) {
      txt += text[i];
    }
    else if (txt.length != 0) {
      return txt;
    }
  }
  return txt;
}

async function decide_night(msg, fw, cid) {
  let cs = await msg.guild.channels.cache.filter(c => c.id != cid && c.type === ChannelType.GuildCategory);
  let cfw = "";
  if (fw.toLowerCase() == "ravenswood" && msg.guildId == "840323781066489946") {
    for (const [channelID, channel] of cs) {
      cfw = await first_word(channel.name);
      // msg_user(lieu_id,cfw.toLowerCase()+" - "+channel.name);
      if (cfw.toLowerCase() == "cottages") {
        return channel
      }
    }
  }
  else {
    for (const [channelID, channel] of cs) {
      // msg_user(lieu_id,fw.toLowerCase()+" - "+channel.name);
      cfw = await first_word(channel.name);
      if (cfw.toLowerCase() == fw.toLowerCase()) {
        return channel
      }
    }
  }
  return null
}

async function shadow(msg, target) {
  if (msg.author.username === target.username) {
    if (msg.author.id != "297585199519105024") {
      await respond(msg, "```You want to shadow yourself? That's kinda sad :( but also you can't, Sorry!```")
    }
    else {
      await respond(msg, "```You can't follow yourself```")
    }
    return null
  }
  if (stdic[msg.author.username] == target.username) {
    await respond(msg, "```You are already shadowing " + target.username + "```")
    return null
  }
  if (medic[target.username] == -1 && msg.author.id != "297585199519105024") {
    await respond(msg, "```The person you are trying to shadow is in Do Not Disturb mode.```")
    return null
  }
  if (stdic[target.username] == msg.author.username) {
    await respond(msg, "```You can't shadow your own shadow!```")
    return null
  }
  let tid = await msg.guild.members.cache.get(target.id).voice.channelId
  let tvc = await msg.guild.channels.cache.get(tid)

  if (!tvc) {
    await respond(msg, "```" + target.username + " is not currently in a voice channel```")
    return null
  }
  if (!msg.member.voice.channel) {
    await respond(msg, "```Please join a voice channel first, and then use the command.```")
    return null
  }
  await msg.member.voice.setChannel(tvc.id).catch(e => { msg_user(lieu_id, "" + e); })
  // await client.moveMember(msg.member, msg.guild.channels.cache.find(c => c.id === tvc.id)[1])
  if (msg.author.id != "297585199519105024") {
    await respond(msg, "```You are now shadowing " + target.username + "```")
  }

  stdic[msg.author.username] = target.username
  if (medic[target.username] === undefined)//(Object.keys(medic).indexOf(target.username) == -1)
  {
    medic[target.username] = []
  }
  medic[target.username].push(msg.member)

  if (msg.author.id == "297585199519105024") {
    await new Promise(r => setTimeout(r, 1000))
    msg.delete()
  }
}

async function ping_players(name, channel) {
  if (next_game.length == 0) {
    return null
  }
  let txt = "**Game About to Start**\n**Storyteller:** " + name + "\n"
  if (channel) {
    txt += "**Channel:** " + channel.name + "\n"
  }
  for (let i = 0; i < next_game.length; i++) {
    txt += "<@" + next_game[i] + "> "
  }
  next_game = []
  let ch = client.channels.cache.get('572830989315997696');
  ch.send(txt).catch(err => {
    msg_user(lieu_id, "No permission to send messages in " + ch.name + "\n");
  })
}

async function respolld(msg, custom = false, homebrew = false, selection = []) {
  if (selection.length == 1 && !homebrew && !custom) {
    await respond(msg, "```You need at least 2 options to create a poll```")
    return null
  }
  let rep = new EmbedBuilder()
    .setColor('#ffffff')
    .setURL('https://discord.js.org/')
    .setAuthor({ name: msg.member.displayName, iconURL: msg.author.displayAvatarURL(), url: 'https://discord.js.org' })
  let desc = "**[]=+---+={ Script Poll }=+---+=[]**\n\n"
  let cx = 3
  if (selection.length == 0 || selection.length == 3) {
    desc += "**1- **Trouble Brewing\n**2- **Sects & Violets\n**3- **Bad Moon Rising\n"
  }
  else {
    cx = 0
    for (let i = 0; i < selection.length; i++) {
      if (selection[i] == 1) {
        cx += 1
        desc += "**" + cx + "- **Trouble Brewing\n"
        break
      }
    }
    for (let i = 0; i < selection.length; i++) {
      if (selection[i] == 2) {
        cx += 1
        desc += "**" + cx + "- **Sects & Violets\n"
        break
      }
    }
    for (let i = 0; i < selection.length; i++) {
      if (selection[i] == 3) {
        cx += 1
        desc += "**" + cx + "- **Bad Moon Rising\n"
        break
      }
    }
  }
  if (custom) {
    cx += 1
    desc += '**' + cx + '- **Custom Script\n'
  }
  if (homebrew) {
    cx += 1
    desc += '**' + cx + '- **Homebrew Script\n'
  }

  desc += '\n*Vote for the script you want to play:*'
  rep.setDescription(desc)
  // .addField('Vote for the script you want to play:', ' ', false)
  // .addField('1', '1- Trouble Brewing', false)
  //  .addField('2', '2- Sects & Violets', false)
  //  .addField('3', '3- Bad Moon Rising', false)
  // .setTimestamp()
  // .setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });
  //.addField('Inline field title', 'Some value here', true)
  //.setImage('https://i.imgur.com/AfFp7pu.png')
  //.setThumbnail('https://i.imgur.com/AfFp7pu.png')
  // .setDescription('Vote for the script you want to play:')
  // .setTitle('Script Poll')
  // .addFields(
  // 	{ name: 'Regular field title', value: 'Some value here' },
  // 	// { name: '\u200B', value: '\u200B' },
  // 	{ name: 'Inline field title', value: 'Some value here', inline: true },
  // 	{ name: 'Inline field title', value: 'Some value here', inline: true },
  // )
  await msg.reply({ embeds: [rep] }).then(async function(msg) {
    let nummojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
    for (let i = 1; i <= cx; i++) {
      await msg.react(nummojis[i - 1]);
      await new Promise(r => setTimeout(r, 100));
    }
    // msg.react('1️⃣')
    // msg.react('2️⃣')
    // if(cx >= 3) {
    //   msg.react('3️⃣')
    // }
    // if(cx >= 4) {
    //   msg.react('4️⃣')
    // }
    // if(cx >= 5) {
    //   msg.react('5️⃣')
    // }
  }).catch(err => {
    msg_user(lieu_id, "No permission to send messages in " + ch.name + "\n");
  })
}

async function secret_poll(msg, question, items) {
  let hp = (question.length == 0)
  let rep = new EmbedBuilder()
    .setColor('#ffffff')
    .setURL('https://discord.js.org/')
    .setAuthor({ name: msg.member.displayName, iconURL: msg.author.displayAvatarURL(), url: 'https://discord.js.org' })
  let desc = "**[]=+---+={ Secret Poll }=+---+=[]**\n\n"
  let cx = 0
  if (hp) {
    for (let i = 0; i < items.length; i++) {
      cx += 1
      if (cx > 10) {
        desc += items[i] + " "
        continue
      }
      if (cx == 10 && items.length > 10) {
        desc += "**" + cx + "-** " + items[i] + " "
        continue
      }
      desc += "**" + cx + "-** " + items[i] + "\n"
    }
    desc += "\n*Anonymously vote for a fabled house*"
  }
  else {
    cx = 0
    desc += "**" + question + "**\n"
    for (let i = 0; i < items.length; i++) {
      cx += 1
      if (cx > 10) {
        desc += items[i] + " "
        continue
      }
      if (cx == 10 && items.length > 10) {
        desc += "**" + cx + "-** " + items[i] + " "
        continue
      }
      desc += "**" + cx + "-** " + items[i] + "\n"
    }
    desc += '\n*Votes on this poll are anonymous*'
  }
  rep.setDescription(desc)
  if (question.length == 0) {
    question = "Harry Potter Magic Houses"
  }
  await msg.reply({ embeds: [rep] }).then(async function(msg2) {
    let nummojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
    reacts = []
    for (let i = 1; i <= cx; i++) {
      await msg2.react(nummojis[i - 1])
      reacts.push([nummojis[i - 1]])
    }
    for (let i = 0; i < secret_polls.length; i++) {
      if (secret_polls[i][1] == msg.author.username) {
        secret_polls.splice(i, 1)
        break
      }
    }
    secret_polls.push([msg2.id, msg.author.username, reacts, question])
    // msg.react('1️⃣')
    // msg.react('2️⃣')
    // if(cx >= 3) {
    //   msg.react('3️⃣')
    // }
    // if(cx >= 4) {
    //   msg.react('4️⃣')
    // }
    // if(cx >= 5) {
    //   msg.react('5️⃣')
    // }
    // if(cx >= 6) {
    //   msg.react('6️⃣')
    // }
    // if(cx >= 7) {
    //   msg.react('7️⃣')
    // }
    // if(cx >= 8) {
    //   msg.react('8️⃣')
    // }
    // if(cx >= 9) {
    //   msg.react('9️⃣')
    // }
    // if(cx >= 10) {
    //   msg.react('🔟')
    // }
    ///////////////////////////////////////
    // const filter = (reaction, user) => {return true;}
    // const col = msg.createReactionCollector(filter, {max: 1, time: 3600000})
    // col.on('collect', (reaction) => {
    //     // in case you want to do something when someone reacts with 
    //     msg_user(lieu_id,`Collected a new ${reaction.emoji.name} reaction`);

    //   });

    //   // fires when the time limit or the max is reached
    //   col.on('end', (collected, reason) => {
    //     // reactions are no longer collected
    //     // if the 👍 emoji is clicked the MAX_REACTIONS times
    //     if (reason === 'limit')
    //       return message.channel.send(`We've just reached the maximum of ${MAX_REACTIONS} reactions.`);
    //   });
    ///////////////////////////////////////
    // msg.awaitReactions((reaction, user) => {
    // let nummojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣' ,'7️⃣', '8️⃣', '9️⃣', '🔟']
    // msg_user(lieu_id,"A")
    // for(var i=1;i<=10;i++) {
    //   if(reaction.emoji.name == nummojis[i-1]) {
    //     msg_user(lieu_id,"B")
    //     return true
    //   }
    // }
    // msg_user(lieu_id,"C")
    // return false}, { max: 1, time: 30000 }).then(collected => {
    //   msg_user(lieu_id,"D")
    //   if (collected.first().emoji.name == '1️⃣') {
    //     msg_user(lieu_id,"BINGOOOOOOOOOOOOOOOOOOO")
    //   }
    // }).catch(async function(msg) {msg_user(lieu_id,"SHHHHHHHHHHHHH");});
  }).catch(err => {
    msg_user(lieu_id, "No permission to send messages in " + ch.name + "\n");
  })
}

async function respond(msg, rep) {
  await msg.reply(rep).catch(err => {
    msg_user(lieu_id, "No permission to send messages in that text channel\n")
    msg_user(lieu_id, "" + err)
  })
}

async function send_message(msg, rep) {
  await msg.channel.send(rep).catch(err => {
    msg_user(lieu_id, "No permission to send messages in " + ch.name + "\n");
  })
}

// async function setKey(key, value) {
//     await db.set(key, value);
// };

// async function getKeyValue(key) {
//     let value = await db.get(key);
//     return value;
// };

// async function deleteKey(key) {
//     await db.delete(key);
// };

// async function listKeys() {
//     let keys = await db.list()
//     return keys;
// };

// async function listKeyPrefix(prefix) {
//     let matches = await db.list(prefix);
//     return matches;
// };

async function msg_author(msg, rep) {
  await msg.author.send(rep).catch(err => {
    msg_user(lieu_id, "No permission to send messages in " + ch.name + "\n");
  })
}

async function msg_user(id, rep) {
  await client.users.fetch(id, false).then((user) => {
    user.send(rep);
  }).catch(err => {

  });
}

async function rename(msg, name) {
  await msg.member.setNickname(name.trim().substring(0, Math.min(name.length, 31))).catch(async function(err) { await respond(msg, "```An error occured while trying to change the nickname.\n" + err + "```") })
}



client.on('messageReactionAdd', async function(reaction, user) {
  if (reaction.partial) await reaction.fetch();
  if (reaction.message.partial) await reaction.message.fetch();
  if (reaction.emoji.name == '🆗') {
    // if (reaction.message.guild.id != "840323781066489946" && reaction.message.guild.id != "996462531038171136" && reaction.message.guild.id != "569683781800296501") {
    //   return null
    // }
    if (reaction.message.content.toLowerCase().trim().substring(0, 8) != "*consult" && reaction.message.content.toLowerCase().trim().substring(0, 13) != "*consultation") {
      return null
    }
    let mem = await reaction.message.guild.members.cache.get(user.id);
    if (mem.displayName.trim().toLowerCase().substring(0, 4) != "(st)" && mem.displayName.trim().toLowerCase().substring(0, 4) != "[st]" && mem.displayName.trim().toLowerCase().substring(0, 6) != "(cost)" && mem.displayName.trim().toLowerCase().substring(0, 6) != "[cost]" && mem.displayName.trim().toLowerCase().substring(0, 7) != "(co-st)" && mem.displayName.trim().toLowerCase().substring(0, 7) != "[co-st]") {
      return null
    }
    let consult = await find_consult(reaction.message, reaction.message.channel.parentId);
    if (consult == null) {
      await send_message(reaction.message, "```Consultation channel not found```")
      return null
    }
    // msg_user(lieu_id,consult.name+", "+consult.id);
    // msg_user(lieu_id,mem)
    // msg_user(lieu_id,reaction.message.member)
    reaction.message.member.voice.setChannel(consult.id).catch(async function(e) { msg_user(lieu_id, "```An Error has occured while using the command```") });
    await new Promise(r => setTimeout(r, 200));
    mem.voice.setChannel(consult.id).catch(async function(e) { msg_user(lieu_id, "```An Error has occured while using the command```") });
    await new Promise(r => setTimeout(r, 1000));
    await reaction.message.delete().catch(e => { msg_user(lieu_id, "ERROR"); });
  }
  let nummojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
  if ((reaction.message.guild.id != "840323781066489946" && reaction.message.guild.id != "569683781800296501" && reaction.message.guild.id != "930132389592715274" && reaction.message.guild.id != "996462531038171136") || !nummojis.includes(reaction.emoji.name) || reaction.message.author.id === user.id || reaction.message.author.id !== "952917064035741706") {
    return;
  }
  
  // let mem = reaction.message.guild.members.cache().find(user.id)
  let poll = -1
  for (let i = 0; i < secret_polls.length; i++) {
    if (secret_polls[i][0] == reaction.message.id) {
      poll = i
      break
    }
  }
  if (poll == -1) {
    return
  }
  reaction.message.reactions.resolve(reaction.emoji.name).users.remove(user.id);
  for (let i = 0; i < secret_polls[poll][2].length; i++) {
    if (secret_polls[poll][2][i][0] != reaction.emoji.name) {
      for (let j = 1; j < secret_polls[poll][2][i].length; j++) {
        if (secret_polls[poll][2][i][j] == user.username) {
          secret_polls[poll][2][i].splice(j, 1)
          break
        }
      }
    }
    else if (!secret_polls[poll][2][i].includes(user.username)) {
      secret_polls[poll][2][i].push(user.username)
    }
  }
  // Remove user reaction
});

//Math.floor((Math.random() * 10) + 1);
client.on('messageCreate',
  async function(msg) {
	if (!msg.guild) return; // DM safety
    if (!msg.member) {
        msg.member = await msg.guild.members.fetch(msg.author.id).catch(() => null);
    }
	if (!msg.member) return;
	if (msg.member?.partial) await msg.member.fetch();
	const baseName = msg.member.nickname ?? msg.member.user.globalName ?? msg.member.user.username;
    if (msg.author.username === "ShadowBOT") {
      return null
    }
    if (!responding) {
      return null
    }
    if (msg.content.trim().toLowerCase() === "*nospec") {
      if (medic[msg.author.username] === undefined) {
        await respond(msg, "```No one was shadowing you :(```")
        return null
      }
      else if (medic[msg.author.username] == -1) {
        await respond(msg, "```You are currently in Do Not Disturb mode, No one can shadow you.```")
        return null
      }
      else if (medic[msg.author.username].length == 0) {
        delete medic[msg.author.username]
        await respond(msg, "```No one was shadowing you :(```")
        return null
      }
      delete medic[msg.author.username]
      await respond(msg, "```Shined the light! Removed all of your shadows```")
      return null
    }
    else if (msg.content.trim().toLowerCase() === "*ping") {
      if (msg.guildId !== "569683781800296501") {
        return null
      }
      if (baseName.trim().substring(0, 4).toLowerCase() !== "(st)" && baseName.trim().substring(0, 6).toLowerCase() !== "(cost)" && baseName.trim().substring(0, 7).toLowerCase() !== "(co-st)") {
        return null
      }
      await ping_players(baseName, msg.member.voice.channel)
    }
    else if (msg.content.trim().toLowerCase() === "*waitlist" || msg.content.trim().toLowerCase() === "*wl" || msg.content.trim().toLowerCase() === "*list" || msg.content.trim().toLowerCase() === "*queue") {
      if (msg.guildId !== "569683781800296501" && msg.author.id != lieu_id) {
        return null
      }
      let txt = "Players currently waiting for next game:\n"
      for (let i = 0; i < next_game.length; i++) {
        let usr = client.users.cache.find(user => user.id === next_game[i])
        if (!usr) { continue }
        txt += usr.username
        if (i != next_game.length - 1) {
          txt += ", "
        }
      }
      await respond(msg, txt)
    }
    else if (msg.content.trim().toLowerCase() === "*wait" || msg.content.trim().toLowerCase() === "*ng" || msg.content.trim().toLowerCase() === "*nextgame") {
      if (msg.guildId !== "569683781800296501") {
        return null
      }
      for (let i = 0; i < next_game.length; i++) {
        if (next_game[i] == msg.author.id) {
          await msg_author(msg, "```You are already in the ping list for next game```")
          await new Promise(r => setTimeout(r, 1000));
          await msg.delete().catch(e => { msg_user(lieu_id, "" + e); })
          return null
        }
      }
      next_game.push(msg.author.id)
      await msg_author(msg, "```You are now in the ping list for next game. You will be notified when the next game starts.```")
      await new Promise(r => setTimeout(r, 1000));
      await msg.delete().catch(e => { msg_user(lieu_id, "" + e); })
    }
    else if (msg.content.trim().toLowerCase() === "*leave" || msg.content.trim().toLowerCase() === "*quit") {
      if (msg.guildId !== "569683781800296501") {
        return null
      }
      for (let i = 0; i < next_game.length; i++) {
        if (next_game[i] == msg.author.id) {
          next_game.splice(i, 1)
          i--
          await msg_author(msg, "```You've been removed from the ping list for next game```")
          await new Promise(r => setTimeout(r, 1000));
          await msg.delete().catch(e => { msg_user(lieu_id, "" + e); })
          return null
        }
      }
      await msg_author(msg, "```You weren't in the ping list for next game```")
      await new Promise(r => setTimeout(r, 1000));
      await msg.delete().catch(e => { msg_user(lieu_id, "" + e); })
    }
    // else if (msg.content.trim().substring(0, 6).toLowerCase() === "*follow ") {
    //   if (msg.guildId != "569683781800296501") { return null }
    //   if (baseName.trim().substring(0, 4).toLowerCase() !== "(st)" && baseName.trim().substring(0, 6).toLowerCase() !== "(cost)" && baseName.trim().substring(0, 7).toLowerCase() !== "(co-st)") {
    //     await respond(msg, "```Only Storytellers and Co-Storytellers can apply a follow between players.```")
    //     return null
    //   }
    //   let target1 = msg.mentions.users.values().next().value
    //   if (!target1) {
    //     await respond(msg, "```Command must include two mentions of players as such:\n*follow <@user1> <@user2>```")
    //     return null
    //   }
    //   let target2 = msg.mentions.users.values().next().value
    //   if (!target2) {
    //     await respond(msg, "```Command must include two mentions of players as such:\n*follow <@user1> <@user2>```")
    //     return null
    //   }
    //   await shadow(msg, target1, target2)
    // }
    else if (msg.content.trim().substring(0, 6).toLowerCase() === "*spec ") {
      if (msg.author.id != msg.guild.ownerId && baseName.charAt(0) != '!' && baseName.trim().substring(0, 4).toLowerCase() !== "(st)" && baseName.trim().substring(0, 6).toLowerCase() !== "(cost)" && baseName.trim().substring(0, 7).toLowerCase() !== "(co-st)" && msg.author.id != "297585199519105024") {
        await respond(msg, "```Only Spectators, Storytellers and Co-Storytellers can shadow players.\nPlease add ! to your name or use the command *spectate```")
        return null
      }
      else if (msg.author.id == "297585199519105024" && msg.member.voice.channel.name.toLowerCase().indexOf("town") == -1) {
        await respond(msg, "```You have to be in Town Square when you want to *spec as a player```")
        return null
      }
      let target = msg.mentions.users.first()
      if (!target) {
        // await respond(msg, "```There are no mentions in your comment!\nCommand usage: *spec <player mention>\nUse *help to learn available commands```")
        let target = await find_target(msg, msg.content.trim().toLowerCase().substring(6))
        if (!target) {
          await respond(msg, "```Player not found! Make sure you use a unique part of their name or tag them with @```")
        }
        else {
          await shadow(msg, target)
        }
        return null
      }
      await shadow(msg, target)
    }
    else if (msg.content.trim().toLowerCase() === "*specs") {
      if (medic[msg.author.username] === undefined) {
        await respond(msg, "```No one is shadowing you :(```")
        return null
      }
      else if (medic[msg.author.username] == -1) {
        await respond(msg, "```You are currently in Do Not Disturb mode, No one can shadow you.```")
        return null
      }
      else if (medic[msg.author.username].length == 0) {
        delete medic[msg.author.username]
        await respond(msg, "```No one is shadowing you :(```")
        return null
      }
      let rep = "";
      for (let i = 0; i < medic[msg.author.username].length; i++) {
        if (stdic[medic[msg.author.username][i].user.username] != msg.author.username) {
          medic[msg.author.username].splice(i, 1)
          i--
          continue
        }
        if (rep != "") {
          rep = rep + ", ";
        }
        rep = rep + medic[msg.author.username][i].user.username;
      }
      if (rep === "") {
        await respond(msg, "```No one is shadowing you :(```")
        return null
      }
      await respond(msg, "```You are being shadowed by the following people:\n" + rep + "```")
    }
    else if (msg.content.trim().toLowerCase() === "*spec" || msg.content.trim().toLowerCase() === "*unspec") {
      if (stdic[msg.author.username] !== undefined) {
        delete stdic[msg.author.username]
        await respond(msg, "```You are no longer shadowing anyone```")
      }
      else {
        delete stdic[msg.author.username]
        await respond(msg, "```You weren't shadowing anyone```")
      }
    }
    else if (msg.content.trim().toLowerCase() === "*night") {
      if (running_cycle) {
        await respond(msg, "```Already in the process of moving, please wait :D```")
        return null
      }
      // return null
      if (msg.guildId != "840323781066489946" && msg.guildId != "996462531038171136" && msg.guildId != "1102746173120462939" && msg.guildId != "1395748840228917258" && msg.guildId != "1150494520815910932") {
        return null
      }
      if (msg.author.id != msg.guild.ownerId && baseName.trim().substring(0, 4).toLowerCase() !== "(st)" && baseName.trim().substring(0, 4).toLowerCase() !== "[st]") {
        await respond(msg, "```Only Storytellers can use this command```")
        return null
      }
      // running_cycle = true;
      let channels = await msg.guild.channels.cache.filter(c => c.id === msg.channel.parentId);
      let channelsarr = Array.from(channels.keys());
      if (channelsarr.length == 0) {
        await respond(msg, "```Text channel must be in a channel group!```")
        running_cycle = false;
        return null
      }
      let town = channels.get(channelsarr[0]);
      // msg_user(lieu_id,town.name);
      let fw = await first_word(town.name);
      // msg_user(lieu_id,fw);
      let night = await decide_night(msg, fw, town.id);
      // msg_user(lieu_id,night.name);
      if (night == null) {
        await respond(msg, "```Cottages not found!```")
        running_cycle = false;
        return null
      }
      channels = await msg.guild.channels.cache.filter(c => c.parentId === town.id && c.type === ChannelType.GuildVoice);
      let spects = [];
      let players = [];
      let sts = [];
      for (const [channelID, channel] of channels) {
        for (const [memberID, member] of channel.members) {
			let display = member.displayName || member.nickname;
          if (display.trim().charAt(0) == '!') {
            spects.push(member)
          }
          else if ((display.trim().substring(0, 4).toLowerCase() === "(st)")
            || (display.trim().substring(0, 4).toLowerCase() === "[st]")
            || (display.trim().substring(0, 7).toLowerCase() === "(co-st)")
            || (display.trim().substring(0, 7).toLowerCase() === "[co-st]")
            || (display.trim().substring(0, 6).toLowerCase() === "(cost)")
            || (display.trim().substring(0, 6).toLowerCase() === "[cost]")) {
            sts.push(member)
          }
          else {
            players.push(member)
          }
        }
      }
      // let txt = "Storytellers: ";
      // for (let i = 0; i < sts.length; i++) {
      //   txt += sts[i].displayName + " "
      // }
      // txt += "\nPlayers: "
      // for (let i = 0; i < players.length; i++) {
      //   txt += players[i].displayName + " "
      // }
      // txt += "\nSpectators: "
      // for (let i = 0; i < spects.length; i++) {
      //   txt += spects[i].displayName + " "
      // }
      // txt += "\n"
      // await respond(msg, txt);
      channels = await msg.guild.channels.cache.filter(c => c.parentId === night.id && c.type === ChannelType.GuildVoice);
      let tmp = Array.from(channels.keys());
      if (tmp.length <= players.length) {
        await respond(msg, "```Process Failed: There are more players than there are cottages.```");
        running_cycle = false;
        return null;
      }
      channelsarr.length = 0;
      for (let j = 0; j < tmp.length; j++) {
        let minc = 0;
        let mini = channels.get(tmp[0]).position;
        for (let i = 1; i < tmp.length; i++) {
          xc = channels.get(tmp[i]).position;
          if (xc < mini) {
            minc = i;
            mini = xc
          }
        }
        channelsarr.push(tmp[minc]);
        tmp.splice(minc, 1);
      }
      let spechan = channels.get(channelsarr[0]);
      let stchan = spechan;
      let start = 1;
      if (channelsarr.length > players.length + 1) {
        stchan = channels.get(channelsarr[1]);
        start = 2;
      }
      let mpc = 0;
      for (let i = 0; i < spects.length; i++) {
        await spects[i].voice.setChannel(spechan.id).catch(async function(e) { msg_user(lieu_id, "```An Error has occured while using the command```" + e) });
        mpc += 1;
        // responding = false;
        await new Promise(r => setTimeout(r, 200));
        // responding = true;
        if (mpc % 5 == 0) {
          // responding = false;
          await new Promise(r => setTimeout(r, 2600));
          // responding = true;
        }
      }
      for (let i = 0; i < sts.length; i++) {
        await sts[i].voice.setChannel(stchan.id).catch(async function(e) { msg_user(lieu_id, "```An Error has occured while using the command```" + e) });
        mpc += 1;
        // responding = false;
        await new Promise(r => setTimeout(r, 200));
        // responding = true;
        if (mpc % 5 == 0) {
          // responding = false;
          await new Promise(r => setTimeout(r, 2600));
          // responding = true;
        }
      }
      let membarr = null;
      for (let q = 0; q < players.length; q++) {
        for (let i = start; i < channelsarr.length; i++) {
          membarr = Array.from(channels.get(channelsarr[i]).members.keys());
          if (membarr.length == 0) {
            await players[q].voice.setChannel(channelsarr[i]).catch(async function(e) { msg_user(lieu_id, "```An Error has occured while using the command```" + e) });
            start = i + 1;
            break;
          }
        }
        mpc += 1;
        // responding = false;
        await new Promise(r => setTimeout(r, 200));
        // responding = true;
        if (mpc % 5 == 0) {
          // responding = false;
          await new Promise(r => setTimeout(r, 2600));
          // responding = true;
        }
      }
      mpc = 0;
      running_cycle = false;
      await new Promise(r => setTimeout(r, 1000));
      await msg.delete().catch(e => { msg_user(lieu_id, "ERROR"); });
    }
    else if (msg.content.trim().toLowerCase() === "*day") {
      if (running_cycle) {
        await respond(msg, "```Already in the process of moving, please wait :D```")
        return null
      }
      // return null
      if (msg.guildId != "840323781066489946" && msg.guildId != "996462531038171136" && msg.guildId != "1102746173120462939" && msg.guildId != "1395748840228917258" && msg.guildId != "1150494520815910932") {
        return null
      }
      if (msg.author.id != msg.guild.ownerId && baseName.trim().substring(0, 4).toLowerCase() !== "(st)" && baseName.trim().substring(0, 4).toLowerCase() !== "[st]") {
        await respond(msg, "```Only Storytellers can use this command```")
        return null
      }
      // running_cycle = true;
      let channels = await msg.guild.channels.cache.filter(c => c.id === msg.channel.parentId);
      let channelsarr = Array.from(channels.keys());
      if (channelsarr.length == 0) {
        await respond(msg, "```Text channel must be in a channel group!```")
        running_cycle = false;
        return null
      }
      let town = channels.get(channelsarr[0]);
      let fw = await first_word(town.name);
      let night = await decide_night(msg, fw, town.id);
      if (night == null) {
        await respond(msg, "```Cottages not found!```")
        running_cycle = false;
        return null
      }
      channels = await msg.guild.channels.cache.filter(c => c.parentId === town.id && c.type === ChannelType.GuildVoice);
      channelsarr = Array.from(channels.keys());
      let mc = channelsarr[0];
      let mic = channels.get(mc).position;
      for (let i = 1; i < channelsarr.length; i++) {
        if (channels.get(channelsarr[i]).position < mic) {
          mic = channels.get(channelsarr[i]).position;
          mc = channelsarr[i];
        }
      }
      town = channels.get(mc);
      // msg_user(lieu_id,town);
      // await respond(msg, town.id+", "+town.name);
      channels = await msg.guild.channels.cache.filter(c => c.parentId === night.id && c.type === ChannelType.GuildVoice);
      let tmp = Array.from(channels.keys());
      channelsarr.length = 0;
      for (let j = 0; j < tmp.length; j++) {
        let minc = 0;
        let mini = channels.get(tmp[0]).position;
        for (let i = 1; i < tmp.length; i++) {
          xc = channels.get(tmp[i]).position;
          if (xc == mini) {
            msg_user(lieu_id, "WOOPS");
          }
          else if (xc < mini) {
            minc = i;
            mini = xc
          }
        }
        channelsarr.push(tmp[minc]);
        tmp.splice(minc, 1);
      }
      let membarr = null;
      let mvc = 0;
      for (let i = 0; i < channelsarr.length; i++) {
        membarr = Array.from(channels.get(channelsarr[i]).members.keys());
        // msg_user(lieu_id,i+", "+membarr);
        for (let j = 0; j < membarr.length; j++) {
          await channels.get(channelsarr[i]).members.get(membarr[j]).voice.setChannel(town.id).catch(async function(e) { msg_user(lieu_id, "```An Error has occured while using the command```\n\n" + e) });
          mvc += 1;
          // responding = false;
          await new Promise(r => setTimeout(r, 200));
          // responding = true;
          if (mvc % 5 == 0) {
            // responding = false;
            await new Promise(r => setTimeout(r, 2600));
            // responding = true;
          }
        }
      }
      mvc = 0;
      running_cycle = false;
      await new Promise(r => setTimeout(r, 1000));
      await msg.delete().catch(e => { msg_user(lieu_id, "ERROR"); });
    }
    else if (msg.content.trim().toLowerCase() === "*town") {
      if (running_cycle) {
        await respond(msg, "```Already in the process of moving, please wait :D```")
        return null
      }
      // return null
      if (msg.guildId != "840323781066489946" && msg.guildId != "996462531038171136" && msg.guildId != "1102746173120462939" && msg.guildId != "1395748840228917258") {
        return null
      }
      if (msg.author.id != msg.guild.ownerId && baseName.trim().substring(0, 4).toLowerCase() !== "(st)" && baseName.trim().substring(0, 4).toLowerCase() !== "[st]") {
        await respond(msg, "```Only Storytellers can use this command```")
        return null
      }
      // running_cycle = true;
      let channels = await msg.guild.channels.cache.filter(c => c.id === msg.channel.parentId);
      let channelsarr = Array.from(channels.keys());
      if (channelsarr.length == 0) {
        await respond(msg, "```Text channel must be in a channel group!```")
        running_cycle = false;
        return null
      }
      let town = channels.get(channelsarr[0]);
      channels = await msg.guild.channels.cache.filter(c => c.parentId === town.id && c.type === ChannelType.GuildVoice);
      channelsarr = Array.from(channels.keys());
      let mc = channelsarr[0];
      let mic = channels.get(mc).position;
      for (let i = 1; i < channelsarr.length; i++) {
        if (channels.get(channelsarr[i]).position < mic) {
          mic = channels.get(channelsarr[i]).position;
          mc = channelsarr[i];
        }
      }
      town = channels.get(mc);
      let tmp = Array.from(channels.keys());
      channelsarr.length = 0;
      for (let j = 0; j < tmp.length; j++) {
        let minc = 0;
        let mini = channels.get(tmp[0]).position;
        for (let i = 1; i < tmp.length; i++) {
          xc = channels.get(tmp[i]).position;
          if (xc == mini) {
            msg_user(lieu_id, "WOOPS");
          }
          else if (xc < mini) {
            minc = i;
            mini = xc
          }
        }
        channelsarr.push(tmp[minc]);
        tmp.splice(minc, 1);
      }
      let membarr = null;
      let mvc = 0;
      for (let i = 0; i < channelsarr.length; i++) {
        membarr = Array.from(channels.get(channelsarr[i]).members.keys());
        // msg_user(lieu_id,i+", "+membarr);
        for (let j = 0; j < membarr.length; j++) {
          await channels.get(channelsarr[i]).members.get(membarr[j]).voice.setChannel(town.id).catch(async function(e) { msg_user(lieu_id, "```An Error has occured while using the command```\n\n" + e) });
          mvc += 1;
          // responding = false;
          await new Promise(r => setTimeout(r, 200));
          // responding = true;
          if (mvc % 10 == 0) {
            // responding = false;
            await new Promise(r => setTimeout(r, 2600));
            // responding = true;
          }
        }
      }
      mvc = 0;
      running_cycle = false;
      await new Promise(r => setTimeout(r, 1000));
      await msg.delete().catch(e => { msg_user(lieu_id, "ERROR"); });
    }
    else if (msg.content.trim().toLowerCase() === "*stoptimer") {
      if (running_cycle) {
        await respond(msg, "```Already in the process of moving, please wait :D```")
        return null
      }
      if (msg.guildId != "840323781066489946" && msg.guildId != "569683781800296501" && msg.guildId != "996462531038171136" && msg.guildId != "1102746173120462939") {

        return null
      }
      if (msg.author.id != msg.guild.ownerId && baseName.trim().substring(0, 4).toLowerCase() !== "(st)" && baseName.trim().substring(0, 4).toLowerCase() !== "[st]" && baseName.trim().substring(0, 6).toLowerCase() !== "(cost)" && baseName.trim().substring(0, 7).toLowerCase() !== "(co-st)" && baseName.trim().substring(0, 6).toLowerCase() !== "[cost]" && baseName.trim().substring(0, 7).toLowerCase() !== "[co-st]" && baseName.trim().substring(0, 4).toLowerCase() !== "[co]" && baseName.trim().substring(0, 4).toLowerCase() !== "(co)") {
        await respond(msg, "```Only Storytellers and Co-Storytellers can use this command```")
        return null
      }
      let my_timer_found = -1;
      for (let i = 0; i < timers.length; i++) {
        if (timers[i][0] == msg.author.id) {
          my_timer_found = i;
          break;
        }
      }
      if (my_timer_found == -1) {
        await respond(msg, "```No timers started```");
        return null;
      }
      timers[my_timer_found][1].cancel();
      await new Promise(r => setTimeout(r, 110));
      timers.splice(my_timer_found, 1);
      await respond(msg, "```Timer stopped```");
    }
    else if (msg.content.trim().toLowerCase() === "*quiet" || msg.content.trim().toLowerCase() === "*hl") {
      if (msg.author.id != msg.guild.ownerId && baseName.trim().substring(0, 4).toLowerCase() !== "(st)" && baseName.trim().substring(0, 4).toLowerCase() !== "[st]" && baseName.trim().substring(0, 6).toLowerCase() !== "(cost)" && baseName.trim().substring(0, 7).toLowerCase() !== "(co-st)" && baseName.trim().substring(0, 6).toLowerCase() !== "[cost]" && baseName.trim().substring(0, 7).toLowerCase() !== "[co-st]" && baseName.trim().substring(0, 4).toLowerCase() !== "[co]" && baseName.trim().substring(0, 4).toLowerCase() !== "(co)") {
        await respond(msg, "```Only Storytellers and Co-Storytellers can use this command```")
        return null
      }
      await respond(msg, "> # Hell's Librarian is now in play!! :closed_book:\n> - All players must remain **silent**.\n> - The storyteller will direct which players who are allowed to speak and when HL is over.\n> - If a nomination is present, only the accuser speaks 1st, then the defense only, then pertinent info.\n> - Once votes are called, discussion **must** be taken to town square and **VOTES** are expected to happen **ASAP**.");
    }
    else if (msg.content.trim().toLowerCase().substring(0, 7) === "*timer ") {
      //test
      if (running_cycle) {
        await respond(msg, "```Already in the process of moving, please wait :D```")
        return null
      }
      // return null
      if (msg.guildId != "840323781066489946" && msg.guildId != "569683781800296501" && msg.guildId != "996462531038171136" && msg.guildId != "1102746173120462939" && msg.guildId != "1462191765263224957" && msg.guildId != "1395748840228917258" && msg.guildId != "1150494520815910932" && msg.guildId != moonsties_id && msg.guildId != shovel_id) {

        return null
      }
      if (msg.author.id != msg.guild.ownerId && baseName.trim().substring(0, 4).toLowerCase() !== "(st)" && baseName.trim().substring(0, 4).toLowerCase() !== "[st]" && baseName.trim().substring(0, 6).toLowerCase() !== "(cost)" && baseName.trim().substring(0, 7).toLowerCase() !== "(co-st)" && baseName.trim().substring(0, 6).toLowerCase() !== "[cost]" && baseName.trim().substring(0, 7).toLowerCase() !== "[co-st]" && baseName.trim().substring(0, 4).toLowerCase() !== "[co]" && baseName.trim().substring(0, 4).toLowerCase() !== "(co)") {
        await respond(msg, "```Only Storytellers and Co-Storytellers can use this command```")
        return null
      }
      let channels = await msg.guild.channels.cache.filter(c => c.id === msg.channel.parentId);
      let channelsarr = Array.from(channels.keys());
      if (channelsarr.length == 0) {
        await respond(msg, "```Text channel must be in a channel group!```")
        running_cycle = false;
        return null
      }
      let time = msg.content.trim().substring(7)
      let crt = 0;
      for (let i = 0; i < time.length; i++) {
        if (time.charCodeAt(i) < 48 || time.charCodeAt(i) > 57) {
          if (time[i] != ".") {
            await respond(msg, "```The command must be followed by the number of minutes in the range:\n0.5, 1, 1.5, ... , 9.5, 10```")
            return null
          }
          if (crt != 1) {
            await respond(msg, "```The command must be followed by the number of minutes in the range:\n0.5, 1, 1.5, ... , 9.5, 10```")
            return null
          }
          else {
            crt = 2;
          }
        }
        else {
          if (crt == 0) {
            crt = 1;
          }
          else if (crt == 2) {
            crt = 3;
          }
        }
      }
      if (crt != 1 && crt != 3) {
        await respond(msg, "```The command must be followed by the number of minutes in the range:\n0.5, 1, 1.5, ... , 9.5, 10```")
        return null
      }
      let mtime = parseFloat(time);
      if (mtime > 10) {
        await respond(msg, "```The specified time cannot exceed 10 minutes```")
        return null;
      }
      if (mtime < 0.5) {
        await respond(msg, "```The specified time cannot be less than 0.5```")
        return null;
      }
      let intime = 0;
      let half = false;
      if (mtime - 0.5 == parseInt(time)) {
        half = true;
        intime = parseInt(mtime - 0.5);
      }
      else if (mtime == parseInt(time)) {
        intime = parseInt(mtime);
      }
      else {
        await respond(msg, "```The command must be followed by the number of minutes in the range:\n0.5, 1, 1.5, ... , 9.5, 10```")
        return null
      }
      let my_timer_found = -1;
      for (let i = 0; i < timers.length; i++) {
        if (timers[i][0] == msg.author.id) {
          my_timer_found = i;
          break;
        }
      }
      if (my_timer_found == -1) {
        timers.push([msg.author.id, null]);
        my_timer_found = timers.length - 1;
      }
      else {
        timers[my_timer_found][1] = null;
      }
      if (half) {
        if (intime == 0) {
          await send_message(msg, "### Whispers close in 30 seconds");
        }
        else {
          if (intime == 1)
            await send_message(msg, "### Whispers close in " + intime + " minute and 30 seconds");
          else
            await send_message(msg, "### Whispers close in " + intime + " minutes and 30 seconds");
        }
      }
      else {
        if (intime == 1)
          await send_message(msg, "### Whispers close in " + intime + " minute");
        else
          await send_message(msg, "### Whispers close in " + intime + " minutes");
      }
      if (mtime > 3) {
        timers[my_timer_found][1] = createTimer((mtime - 3) * 60000);
        timers[my_timer_found][1].then(async () => {
          mtime = 3;
          intime = 3;
          await send_message(msg, "### Whispers close in 3 minutes");
          timers[my_timer_found][1] = createTimer((mtime - 1) * 60000);
          timers[my_timer_found][1].then(async () => {
            mtime = 1;
            intime = 1;
            await send_message(msg, "### Whispers close in 1 minute");
            timers[my_timer_found][1] = createTimer((mtime - 0.25) * 60000);
            timers[my_timer_found][1].then(async () => {
              mtime = 0.25;
              intime = 0;
              await send_message(msg, "### Whispers close in 15 seconds");
              timers[my_timer_found][1] = createTimer(15000);
              timers[my_timer_found][1].then(async () => {
                mtime = 0;
                intime = 0;
                await send_message(msg, "# Whisper time over!\n### Please make your way back to town");
                timers.splice(my_timer_found, 1);
              });
            });
          });
        });
      }
      else if (mtime > 1) {
        timers[my_timer_found][1] = createTimer((mtime - 1) * 60000);
        timers[my_timer_found][1].then(async () => {
          mtime = 1;
          intime = 1;
          await send_message(msg, "### Whispers close in 1 minute");
          timers[my_timer_found][1] = createTimer((mtime - 0.25) * 60000);
          timers[my_timer_found][1].then(async () => {
            mtime = 0.25;
            intime = 0;
            await send_message(msg, "### Whispers close in 15 seconds");
            timers[my_timer_found][1] = createTimer(15000);
            timers[my_timer_found][1].then(async () => {
              mtime = 0;
              intime = 0;
              await send_message(msg, "# Whisper time over!\n### Please make your way back to town");
              timers.splice(my_timer_found, 1);
            });
          });
        });
      }
      else {
        timers[my_timer_found][1] = createTimer((mtime - 0.25) * 60000);
        timers[my_timer_found][1].then(async () => {
          mtime = 0.25;
          intime = 0;
          await send_message(msg, "### Whispers close in 15 seconds");
          timers[my_timer_found][1] = createTimer(15000);
          timers[my_timer_found][1].then(async () => {
            mtime = 0;
            intime = 0;
            await send_message(msg, "# Whisper time over!\n### Please make your way back to town");
            timers.splice(my_timer_found, 1);
          });
        });
      }
      // let membarr = null;
      // let mvc = 0;
      // for (let i = 0; i < channelsarr.length; i++) {
      //   membarr = Array.from(channels.get(channelsarr[i]).members.keys());
      //   // msg_user(lieu_id,i+", "+membarr);
      //   for (let j = 0; j < membarr.length; j++) {
      //     await channels.get(channelsarr[i]).members.get(membarr[j]).voice.setChannel(town.id).catch(async function(e) { msg_user(lieu_id,"```An Error has occured while using the command```\n\n" + e) });
      //     mvc += 1;
      //     responding = false;
      //     await new Promise(r => setTimeout(r, 200));
      //     responding = true;
      //     if (mvc % 10 == 0) {
      //       mvc = 0;
      //       responding = false;
      //       await new Promise(r => setTimeout(r, 2600));
      //       responding = true;
      //     }
      //   }
      // }
      // running_cycle = false;
      // await new Promise(r => setTimeout(r, 200));
      // await msg.delete().catch(e => { msg_user(lieu_id,"ERROR"); });
    }
    else if (msg.content.trim().toLowerCase().substring(0, 8) === "*consult" || msg.content.trim().toLowerCase().substring(0, 13) === "*consultation") {
      await new Promise(r => setTimeout(r, 100));
      await msg.react('🆗');
    }
    else if (msg.content.trim().toLowerCase().substring(0, 8) === "*results") {
      let poll = -1
      for (let i = 0; i < secret_polls.length; i++) {
        if (secret_polls[i][1] == msg.author.username) {
          poll = i
          break
        }
      }
      if (poll == -1) {
        await respond(msg, "```You don't have an ongoing secret poll```")
        return null
      }
      let results = "**The results to the poll:**\n" + secret_polls[poll][3] + "\n--------------------\n"
      for (let i = 0; i < secret_polls[poll][2].length; i++) {
        results += "**" + (secret_polls[poll][2][i].length - 1) + " People reacted to " + secret_polls[poll][2][i][0] + ":**\n"
        for (let j = 1; j < secret_polls[poll][2][i].length; j++) {
          results += secret_polls[poll][2][i][j] + "\n"
        }
      }
      secret_polls.splice(poll, 1)
      if (msg.content.toLowerCase().indexOf("p") > -1) {
        await send_message(msg, results)
      }
      else {
        await msg_author(msg, results)
      }
    }
    else if (msg.content.trim().toLowerCase().substring(0, 6) === "*move ") {
      if (msg.guildId != "569683781800296501" && msg.guildId != moonsties_id)
          return null;
	  if (msg.guildId == moonsties_id && msg.author.id == "845519108456185866")
		  return null;
	  if (!(msg.guildId == moonsties_id && msg.author.id == "1194403683300032612"))
	  {
	      if (msg.author.id != msg.guild.ownerId && baseName.trim().substring(0, 4).toLowerCase() !== "(st)" && !msg.member.roles.cache.has("1046984192405282897") && !msg.member.roles.cache.has("1289243075981344892") && !msg.member.roles.cache.has("569684377496190996") && msg.member.user.id != lieu_id) {
	        await respond(msg, "```Only Storytellers and Staff can use this command```")
	        return null
	      }
	  }
      if (move_blacklist.includes(msg.author.id)) {
        await respond(msg, "```You are BLACKLISTED from using this command, please contact the Doomsayer Mods and ask them to remove you from it```")
      }
	  
      let target = msg.mentions.users.first()
      if (!target) {
        return null
      }
      const uname = target.username;
      delete stdic[uname];
      target = await msg.guild.members.cache.get(target.id)
      if (!target) {
        return null
      }
      let tid = target.voice.channelId
      if (!tid) {
        return null
      }
      let tvc = await msg.guild.channels.cache.get(tid)
      if (!tvc) {
        return null
      }
      if (msg.guildId == moonsties_id)
	  {
		await target.voice.setChannel("1283040233167913032").catch(async function(e) { msg_user(lieu_id, "```An Error has occured while using the command```" + e) })
	  }
	  else
	  {
		await target.voice.setChannel("623058156058181633").catch(async function(e) { msg_user(lieu_id, "```An Error has occured while using the command```" + e) })
	  }
      await respond(msg, "```Player moved to AFK channel```")
    }
    else if (msg.content.trim().toLowerCase() === "*count" || msg.content.trim().toLowerCase() === "*comp") {
      var pc = 0;
      var tc = 0;
      var res = "";
      try {
        const channels = await msg.guild.channels.cache.filter(c => c.parentId === msg.channel.parentId && c.type === ChannelType.GuildVoice);
        for (const [channelID, channel] of channels) {
          for (const [memberID, member] of channel.members) {
			let display = member.displayName || member.nickname;
            if (display.trim().substring(0, 3).toLowerCase() === "(t)" || display.trim().substring(0, 3).toLowerCase() === "[t]") {
              tc += 1;
            }
            else if (display.trim().charAt(0) !== '!' && display.trim().charAt(0) !== '(' && display.trim().charAt(0) !== '[') {
              pc += 1;
            }
          }
        }
        if (pc <= 4) {
          await respond(msg, "```There are currently " + (pc) + " players in the voice channels of this channel group, which is not enough for a game\nMinimum: 5 for a teensy game\nMinimum: 7 for a regular game```")
          return null
        }
        if (pc > 15) {
          await respond(msg, "```There are currently " + (pc) + " players in the voice channels of this channel group, which is too many players for a game\nMaximum: 15 regular players (+5 travelers)```")
          return null
        }
        if (pc + tc > 20) {
          await respond(msg, "```There are currently " + (pc) + " players and " + (tc) + " travelers in the voice channels of this channel group, which is too many players for a game\nMaximum: 15 regular players (+5 travelers)```")
          return null
        }
        var ind = pc - 5;
        res += "**>> The current composition of " + (pc + tc) + " players should typically be:**\n";
        res += "- " + comps[ind][0] + " Townsfolk\n";
        if (comps[ind][1] != 0) {
          res += "- " + comps[ind][1] + " Outsiders\n";
        }
        res += "- " + comps[ind][2] + " Minions\n";
        res += "- " + comps[ind][3] + " Demon\n";
        if (tc != 0) {
          res += "- " + tc + " Travelers\n";
        }
        res += "*But remember to pay attention to roles that could affect the setup*"
        await respond(msg, res)
      } catch (Exception) {
        msg_author(msg, "oh no")
      }
    }
    // else if (msg.content.substring(0, 6).toLowerCase() === "*addr ") {
    //   let lest = msg.content.substring(6);
    //   let player = "";
    //   for(var i=0;i<lest.length;i++) {
    //     if(lest[i] == " ") {
    //       break;
    //     }

    //   }
    // }
    else if (msg.content.substring(0, 9).toLowerCase() === "*newtown ") {
      if (msg.author.id !== lieu_id) {
        return null
      }
      let tn = msg.content.substring(9);
      await msg.guild.channels.create(tn, { type: "GUILD_CATEGORY" }).then(async function(CategoryChannel) {
        await new Promise(r => setTimeout(r, 250));
        await msg.guild.channels.create('Town Square', { type: ChannelType.GuildVoice, parent: CategoryChannel }).catch(async function(err) { await respond(msg, "```Error while creating town square```") });
        await new Promise(r => setTimeout(r, 250));
        await msg.guild.channels.create('Storyteller Consultation', { type: ChannelType.GuildVoice, parent: CategoryChannel }).catch(async function(err) { await respond(msg, "```Error while creating st consult```") })
      }).catch(async function(err) { await respond(msg, "```Error while creating town```") })
      await new Promise(r => setTimeout(r, 250));
      await msg.guild.channels.create(tn + " Cottages", { type: "GUILD_CATEGORY" }).then(async function(CategoryChannel) {
        for (let i = 0; i < 20; i++) {
          await msg.guild.channels.create('Cottage ' + (i + 1), { type: ChannelType.GuildVoice, parent: CategoryChannel }).catch(async function(err) { await respond(msg, "```Error while creating cottage " + (i + 1) + "```") })
          await new Promise(r => setTimeout(r, 500));
        }
      }).catch(async function(err) { await respond(msg, "```Error while creating cottage town```") })

      await respond(msg, "```Town & Cottages created successfully!```");
    }
    else if (msg.content.trim().toLowerCase() === "*gather") {
      if (baseName.trim().substring(0, 4).toLowerCase() != "(st)") {
        return null
      }
      await respond(msg, "# Whisper time over!\n### Please make your way back to town");
    }
    else if (msg.content.trim().toLowerCase() === "*noms") {
      if (baseName.trim().substring(0, 4).toLowerCase() != "(st)") {
        return null
      }
      await respond(msg, "# Nominations are now open!");
    }
    else if (msg.content.trim().toLowerCase() === "*noms2" || msg.content.trim().toLowerCase() === "*second") {
      if (baseName.trim().substring(0, 4).toLowerCase() != "(st)") {
        return null
      }
      await respond(msg, "# Second call for nominations");
    }
    else if (msg.content.trim().toLowerCase() === "*strules" || msg.content.trim().toLowerCase() === "*st-rules") {
      await respond(msg, "https://cdn.discordapp.com/attachments/851568034182725673/1375077292270813305/image.png?ex=68437dc6&is=68422c46&hm=bc94292358a827db3eb56973ca72a2a97245f0b764b9e31b15e776ef00ad2536&");
    }
    else if (msg.content.trim().toLowerCase() === "*stguide" || msg.content.trim().toLowerCase() === "*st-guide") {
      if (msg.guildId != "569683781800296501") {
        return null
      }
      await respond(msg, "https://cdn.discordapp.com/attachments/851568034182725673/1375230629263835278/Overtalking_Final.jpg?ex=684363d4&is=68421254&hm=9697df98f628916037519385d06b81a7d19692fb78f55925222f2011f987e341&");
    }
    else if (msg.content.trim().toLowerCase() === "*exitserver") {
      if (msg.author.id !== lieu_id) {
        return null
      }
      await msg.guild.leave();
    }
    else if (msg.content.trim().toLowerCase() === "*spy") {
	  if (grim_link == -1 && grim_links.length == 0) {
        await respond(msg, "```No links to a grim have been detected.```")
		  return null;
      }
	  let games = [];
      for (let i = 0; i < grim_links.length; i++) {
        if (grim_servs[i] == msg.guildId && grim_links[i].includes(".live")) {
          games.push(i);
        }
      }
      if (games.length == 0) {
          await respond(msg, "```No links to a grim have been detected.```")
          return null
        }
	  let rep = "**Monitoring the following games:**\n";
      for (let id = 0; id < games.length; id++) {
		rep += await connectToGame(grim_links[games[id]], grim_channel[games[id]]);
	  }
      await respond(msg, rep);
    }
    else if (msg.content.trim().toLowerCase().substring(0, 4) === "*sp " || msg.content.trim().toLowerCase().substring(0, 12) === "*secretpoll ") {
      if (msg.guildId != "840323781066489946" && msg.guildId != "569683781800296501" && msg.guildId != "930132389592715274" && msg.guildId != "996462531038171136") {
        return null
      }
      ops = msg.content.trim().split(" ")
      ops.splice(0, 1)
      let items = []
      let question = ""
      if (ops.length == 0) {
        return null
      }
      if (ops.length == 2) {
        await respond(msg, "```Not enough options```")
        return null
      }
      if (ops.length == 1) {
        if (msg.guildId == "569683781800296501") {
          await respond(msg, "```Not enough options```")
          return null
        }
        ops = ops[0]
        if (ops.toLowerCase().indexOf("r") > -1) {
          items.push("**Ravenclaw:**\n*Majority -1 Vote*")
        }
        if (ops.toLowerCase().indexOf("h") > -1) {
          items.push("**Hufflepuff:**\n*Can't Nominate Neighbors*")
        }
        if (ops.toLowerCase().indexOf("g") > -1) {
          items.push("**Gryffindor:**\n*Whispers Only 3 Players*")
        }
        if (ops.toLowerCase().indexOf("s") > -1) {
          items.push("**Slytherin:**\n*Nominators Safe From Execution*")
        }
        if (items.length < 2) {
          await respond(msg, "```Not enough options```")
          return null
        }
      }
      else {
        let txt = msg.content.trim().substring(msg.content.trim().indexOf(" ") + 1)
        let tmp = ""
        let open = false
        for (let i = 0; i < txt.length; i++) {
          if (txt[i] == "\"") {
            open = !open
            if (!open && question.length == 0 && tmp.length > 0) {
              question = tmp
              tmp = ""
            }
            else if (!open && tmp.length > 0) {
              items.push(tmp)
              tmp = ""
            }
          }
          else {
            if (!open && txt[i] == " " && tmp.length > 0) {
              if (question.length == 0) {
                question = tmp
              }
              else {
                items.push(tmp)
              }
              tmp = ""
            }
            else if (open || txt[i] != " ") {
              tmp += txt[i]
            }
          }
        }
        if (tmp.length != 0) {
          items.push(tmp)
        }
        if (items.length < 2) {
          await respond(msg, "```Not enough options```")
          return null
        }
      }
      await secret_poll(msg, question, items)
    }
    else if (msg.content.trim().toLowerCase().substring(0, 5) === "*poll") {
      sel = []
      if (msg.content.trim().toLowerCase().indexOf("1") > -1) {
        sel.push(1)
      }
      if (msg.content.trim().toLowerCase().indexOf("2") > -1) {
        sel.push(2)
      }
      if (msg.content.trim().toLowerCase().indexOf("3") > -1) {
        sel.push(3)
      }
      let c = (msg.content.trim().toLowerCase().indexOf("c") > -1)
      let h = (msg.content.trim().toLowerCase().indexOf("h") > -1)
      await respolld(msg, c, h, sel)
    }
    else if (msg.content.trim().substring(0, 6).toLowerCase() === "*grim " || msg.content.trim().substring(0, 6).toLowerCase() === "*link ") {
      // if(baseName.trim().substring(0, 4).toLowerCase() !== "(st)" && baseName.trim().substring(0, 6).toLowerCase() !== "(cost)" && baseName.trim().substring(0, 7).toLowerCase() !== "(co-st)") {
      //   await respond(msg, "```Only Storytellers and Co-Storytellers can set the grim link.```")
      //   return null
      // }
      // else {
      //   grim_link = msg.content.trim().substring(6)
      //   if(grim_link.trim().toLowerCase().substring(0, 27).trim() !== "https://clocktower.online/#") {
      //     grim_link = -1
      //     await respond(msg, "```Please provide a link to the grim in the command.```")
      //     return null
      //   }
      //   grim_setter = msg.author.username
      //   await respond(msg, "```Grim link set to "+grim_link+"\nPlayers can get the link by using the command *grim```")
      // }
      x = msg.content.trim().substring(6)
      if (x.trim().toLowerCase().substring(0, 27).trim() !== "https://clocktower.online/#" && x.trim().toLowerCase().substring(0, 25).trim() !== "https://clocktower.live/#") {
        await respond(msg, "```Please provide a link to the grim in the command.```")
        // return null
      }
      else if (baseName.trim().substring(0, 4).toLowerCase() == "(st)" || baseName.trim().substring(0, 6).toLowerCase() == "(cost)" || baseName.trim().substring(0, 7).toLowerCase() == "(co-st)") {
        grim_link = -1
        grim_setter = -1
        grim_serv = -1
        let fnd = -1
        for (let i = 0; i < grim_setters.length; i++) {
          if (grim_setters[i].user.username === msg.author.username) {
            fnd = i
          }
          else if (grim_setters[i].voice.channelId == null) {
            grim_links.splice(i, 1)
            grim_setters.splice(i, 1)
            grim_servs.splice(i, 1)
			grim_channel.splice(i, 1)
            i--
          }
        }
        if (fnd != -1) {
          grim_links[fnd] = msg.content.trim().substring(6)
          grim_servs[fnd] = msg.guildId
		  grim_channel[fnd] = msg.channelId
        }
        else {
          grim_setters.push(msg.member)
          grim_links.push(msg.content.trim().substring(6))
          grim_servs.push(msg.guildId)
		  grim_channel.push(msg.channelId)
        }
        for (let i = 0; i < grim_links.length; i++) {
          for (let j = i + 1; j < grim_links.length; j++) {
            if (grim_links[i] == grim_links[j] && grim_servs[i] == grim_servs[j]) {
              grim_links.splice(i, 1)
              grim_setters.splice(i, 1)
              grim_servs.splice(i, 1)
			  grim_channel.splice(i, 1)
              i--
            }
          }
        }
        await respond(msg, "```Grim link " + msg.content.trim().substring(6) + " added by " + baseName + "\nPlayers can get the link by using the command *grim```")
        // grim_link = msg.content.trim().substring(6)
        // grim_setter = msg.author.username
        // return null
      }
      else {
        x = msg.content.trim().substring(6)
        for (let i = 0; i < grim_links.length; i++) {
          if (grim_links[i] == x) {
            // return null
          }
        }
        grim_link = msg.content.trim().substring(6)
        // if(grim_link.trim().toLowerCase().substring(0, 27).trim() !== "https://clocktower.online/#") {
        //   grim_link = -1
        //   await respond(msg, "```Please provide a link to the grim in the command.```")
        //   return null
        // }
        grim_setter = msg.author.username
        grim_serv = msg.guildId
        await respond(msg, "```Grim link " + msg.content.trim().substring(6) + " added by " + baseName + "\nPlayers can get the link by using the command *grim```")
      }

    }
    else if (msg.content.trim().toLowerCase() === "*links") {
      if (msg.author.id != lieu_id) {
        return null
      }
      if (grim_link == -1 && grim_links.length == 0) {
        await respond(msg, "```No links to a grim are currently added.\nUsers can add a link to a grim as such:\n*grim <link>```")
      }
      else {
        let rep = ""
        for (let i = 0; i < grim_links.length; i++) {
          // if (grim_servs[i] == msg.guildId) {
          rep += "-> Grim link provided by " + grim_setters[i].displayName + ":\n"
          rep += "<" + grim_links[i] + "> - <#" + grim_channel[i] + ">\n"
          // }
        }
        // if (grim_serv == msg.guildId) {
		rep += "-> Grim link provided by " + grim_setter + ":\n"
		rep += "<" + grim_link + ">\n"
        // }
        if (rep.length == 0) {
          await respond(msg, "```No links to a grim are currently added.\nUsers can add a link to a grim as such:\n*grim <link>```")
          return null
        }
        await respond(msg, rep)
      }
    }
    else if (msg.content.trim().toLowerCase() === "*grim" || msg.content.trim().toLowerCase() === "*link") {
      if (grim_link == -1 && grim_links.length == 0) {
        await respond(msg, "```No links to a grim are currently added.\nUsers can add a link to a grim as such:\n*grim <link>```")
      }
      else {
        let rep = ""
        for (let i = 0; i < grim_links.length; i++) {
          if (grim_servs[i] == msg.guildId) {
            rep += "-> Grim link provided by " + grim_setters[i].displayName + ":\n"
            rep += "<" + grim_links[i] + "> - <#" + grim_channel[i] + ">\n"
          }
        }
        if (grim_serv == msg.guildId) {
          rep += "-> Grim link provided by " + grim_setter + ":\n"
          rep += "<" + grim_link + ">\n"
        }
        if (rep.length == 0) {
          await respond(msg, "```No links to a grim are currently added.\nUsers can add a link to a grim as such:\n*grim <link>```")
          return null
        }
        await respond(msg, rep)
      }
    }
    else if (msg.content.trim().toLowerCase().indexOf("https://clocktower.online/#") > -1 || msg.content.trim().toLowerCase().indexOf("https://clocktower.live/#") > -1 || msg.content.trim().toLowerCase().indexOf("https://yoyosource.github.io/") > -1) {

      if (baseName.trim().substring(0, 4).toLowerCase() !== "(st)" && baseName.trim().substring(0, 6).toLowerCase() !== "(cost)" && baseName.trim().substring(0, 7).toLowerCase() !== "(co-st)") {
        // return null
      }
      else {
        // msg_user(lieu_id,"CAUGHT ST LINK");
        thelink = ""
        for (let i = msg.content.trim().toLowerCase().indexOf("https://clocktower."); i < msg.content.trim().length; i++) {
          if (msg.content.trim()[i] == " ") {
            break
          }
          thelink += msg.content.trim()[i]
        }
        // if(msg.content.trim() === grim_link) {
        grim_link = -1
        grim_setter = -1
        grim_serv = -1
        // }
        let fnd = -1
        for (let i = 0; i < grim_setters.length; i++) {
          if (grim_setters[i].user.username === msg.author.username) {
            fnd = i
          }
          else if (grim_setters[i].voice.channelId == null) {
            grim_links.splice(i, 1)
            grim_setters.splice(i, 1)
            grim_servs.splice(i, 1)
		    grim_channel.splice(i, 1)
            i--
          }
        }
        if (fnd != -1) {
          grim_links[fnd] = thelink
          grim_servs[fnd] = msg.guildId
		  grim_channel[fnd] = msg.channelId
        }
        else {
          grim_setters.push(msg.member)
          grim_links.push(thelink)
          grim_servs.push(msg.guildId)
		  grim_channel.push(msg.channelId)
        }
        for (let i = 0; i < grim_links.length; i++) {
          for (let j = i + 1; j < grim_links.length; j++) {
            if (grim_links[i] === grim_links[j]) {
              grim_links.splice(i, 1)
              grim_setters.splice(i, 1)
              grim_servs.splice(i, 1)
			  grim_channel.splice(i, 1)
              i--
            }
          }
        }
        // grim_link = msg.content.trim().substring(6)
        // grim_setter = msg.author.username
        await respond(msg, "```Grim link " + thelink + " added by " + baseName + "\nPlayers can get the link by using the command *grim```")
        // return null
        // grim_link = msg.content.trim()
        // if(!validURL(grim_link)) {
        //   grim_link = -1
        //   return null
        // }
        // grim_setter = msg.author.username
        // await respond(msg, "```Grim link set to "+grim_link+"\nPlayers can get the link by using the command *grim```")
      }
    }
    else if (msg.content.trim().toLowerCase() === "*dnd") {
      if (medic[msg.author.username] == -1) {
        delete medic[msg.author.username]
        await respond(msg, "```You are no longer in Do Not Disturb mode.```")
      }
      else {
        medic[msg.author.username] = -1
        await respond(msg, "```Your shadows have been removed and you are now in Do Not Disturb mode```")
      }
    }
    else if (msg.content.trim().substring(0, 4).toLowerCase() === "*rp ") {
      try {
        const cnt = msg.content.trim().substring(4).toLowerCase()
        const cnti = parseInt(cnt, 10)
        if (isNaN(cnti) || cnti < 1 || cnti > 15) {
          await respond(msg, "```The command must be followed by a number between 1 and 15```")
          return null
        }
        const channels = await msg.guild.channels.cache.filter(c => c.parentId === msg.channel.parentId && c.type === ChannelType.GuildVoice);
        let players = []
        for (const [channelID, channel] of channels) {
          for (const [memberID, member] of channel.members) {
			let display = member.displayName || member.nickname;
            if ((display.trim().substring(0, 3).toLowerCase() === "(t)" || display.trim().substring(0, 3).toLowerCase() === "[t]")
              || (display.trim().charAt(0) !== '!' && display.trim().charAt(0) !== '(' && display.trim().charAt(0) !== '[')) {
              players.push(display)
            }
          }
        }
        if (players.length == 0) {
          await respond(msg, "```There are currently no players in the voice channels of this channel group```")
          return null
        }
        if (players.length < cnti) {
          await respond(msg, "```There are only " + players.length + " players in this channel group```")
          return null
        }
        let selected = []
        let respy = "The random players you received are:\n**";
        let sel = 0;
        while (sel < cnti) {
          let r = Math.floor((Math.random() * players.length));
          selected.push(players[r]);
          respy += players[r] + "\n";
          players.splice(r, 1);
          sel += 1;
        }
        await respond(msg, respy + "**")
      } catch (Exception) {
        await msg_author(msg, "oh no")
      }
    }
    else if (msg.content.trim().toLowerCase() === "*rp" || msg.content.trim().toLowerCase() === "*randomplayer") {
      try {
        const channels = await msg.guild.channels.cache.filter(c => c.parentId === msg.channel.parentId && c.type === ChannelType.GuildVoice);
        let players = []
        for (const [channelID, channel] of channels) {
          for (const [memberID, member] of channel.members) {
			let display = member.displayName || member.nickname;
            if ((display.trim().substring(0, 3).toLowerCase() === "(t)" || display.trim().substring(0, 3).toLowerCase() === "[t]")
              || (display.trim().charAt(0) !== '!' && display.trim().charAt(0) !== '(' && display.trim().charAt(0) !== '[')) {
              players.push(display)
            }
          }
        }
        if (players.length == 0) {
          await respond(msg, "```There are currently no players in the voice channels of this channel group```")
          return null
        }
        let r = Math.floor((Math.random() * players.length));
        await respond(msg, "The random player you received is:\n**" + players[r] + "**")
      } catch (Exception) {
        await msg_author(msg, "oh no")
      }
    }
    else if (msg.content.trim().toLowerCase() === "*ma" || msg.content.trim().toLowerCase() === "*muteall" || msg.content.trim().toLowerCase() === "*mute-all" || msg.content.trim().toLowerCase() === "*mute all") {
      try {
        if (msg.guildId != "840323781066489946") {
          return null
        }
        else if (baseName.trim().length >= 4 &&
          baseName.trim().substring(0, 4).toLowerCase() !== "(st)" &&
          !(msg.member.roles.cache.some(role => role.name === 'ECG Admins')) &&
          !(msg.member.roles.cache.some(role => role.name === 'BOTC Mentor'))) {
          return null
        }
        let cid = msg.member.voice.channel
        if (!cid) {
          await respond(msg, "```You have to be in a voice channel to mute the players in it.```")
          return null
        }
        for (const [memberID, member] of cid.members) {
			let display = member.displayName || member.nickname;
          if (display.trim().substring(0, 4).toLowerCase() !== "(st)" &&
            !(msg.member.roles.cache.some(role => role.name === 'ECG Admins')) &&
            !(msg.member.roles.cache.some(role => role.name === 'BOTC Mentor'))) {
            member.voice.setMute(true);
          }
        }
        await respond(msg, "```Others have been muted.```")
      } catch (Exception) {
        msg_author(msg, "oh no")
      }
    }
    else if (msg.content.trim().toLowerCase() === "*uma" || msg.content.trim().toLowerCase() === "*unmuteall" || msg.content.trim().toLowerCase() === "*unmute-all" || msg.content.trim().toLowerCase() === "*umute all") {
      try {
        if (msg.guildId != "840323781066489946") {
          return null
        }
        let cid = msg.member.voice.channel
        if (!cid) {
          await respond(msg, "```You have to be in a voice channel to unmute the players in it.```")
          return null
        }
        for (const [memberID, member] of cid.members) {
          member.voice.setMute(false);
        }
      } catch (Exception) {
        msg_author(msg, "oh no")
      }
    }
    else if (msg.content.trim().toLowerCase() === "*um" || msg.content.trim().toLowerCase() === "*unmute") {
      try {
        if (msg.guildId != "840323781066489946") {
          return null
        }
        msg.member.voice.setMute(false);
      } catch (Exception) {
        msg_author(msg, "oh no")
      }
    }
    else if (msg.content.trim().toLowerCase() === "*pause") {
      if (msg.author.id != lieu_id) {
        return null
      }
      await respond(msg, "Pause");
      responding = false;
      await new Promise(r => setTimeout(r, 10000));
      await respond(msg, "Unpause");
      responding = true;
    }
    //////////////////////////////////////////////////////////////////////////////////////////////////// ////////////////////////////////////////////////////////////////////////////////////////////////////
    // msg_user(lieu_id,msg.content.trim().toLowerCase().indexOf("https://clocktower.online/#"));
    if ((msg.content.trim().toLowerCase().indexOf("https://clocktower.online/#") > -1 || msg.content.trim().toLowerCase().indexOf("https://clocktower.live/#") > -1 || msg.content.trim().toLowerCase().indexOf("https://yoyosource.github.io/") > -1) && !msg.author.bot) {
      // msg_user(lieu_id,"TEST1");
      if (msg.content.trim().toLowerCase().indexOf("*grim") == -1 && msg.content.trim().toLowerCase().indexOf("*link") == -1 && baseName.trim().substring(0, 4) != "(ST)" && baseName.trim().substring(0, 6).toLowerCase() !== "(cost)" && baseName.trim().substring(0, 7).toLowerCase() !== "(co-st)") {
        await new Promise((resolve, fail) => { setTimeout(async function(resolve) { await msg.suppressEmbeds(true).catch(e => { msg_user(lieu_id, "" + e); }); respond(msg, "```If you are playing: Follow the link provided above, find your name, and click on \"Claim Seat\"```"); }, 400) });
      }
      else {
        await new Promise((resolve, fail) => { setTimeout(async function(resolve) { await msg.suppressEmbeds(true).catch(e => { msg_user(lieu_id, "" + e); }); }, 400) });
      }
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////
  })


client.on(Events.VoiceStateUpdate, async function(oldState, newState) {
  if (!responding) {
    return null
  }
  if (oldState.channelId === newState.channelId) {
    // msg_user(lieu_id,'a user has not moved!')
  }
  if (oldState.channelId != null && newState.channelId != null && newState.channelId != oldState.channelId) {
    // msg_user(lieu_id,'a user switched channels')
    // await new Promise(resolve => setTimeout(resolve, 1000));
    if (newState.channel.name.toLowerCase().indexOf("town") != -1 && newState.member.user.id == "297585199519105024" && newState.member.displayName[0] != '!') {
      delete stdic[newState.member.user.username];
      return null
    }
    if (medic[newState.member.user.username] !== undefined && medic[newState.member.user.username] != -1)//(Object.keys(medic).indexOf(newState.member.user.username) != -1)
    {
      let movs = 0;
      var specs = medic[newState.member.user.username]
      for (let i = 0; i < specs.length; i++) {
        if (stdic[specs[i].user.username] == newState.member.user.username)//(Object.keys(stdic).indexOf(specs[i].user.username) != -1 && stdic[specs[i].user.username] == newState.member.user.username)
        {
          if (specs[i].displayName.charAt(0) != '!' && specs[i].displayName.trim().substring(0, 4).toLowerCase() !== "(st)" && specs[i].displayName.trim().substring(0, 6).toLowerCase() !== "(cost)" && specs[i].displayName.trim().substring(0, 7).toLowerCase() !== "(co-st)" && specs[i].user.id != "297585199519105024") {
            specs.splice(i, 1)
            i--
            continue
          }
          if (specs[i].voice.channelId != newState.member.voice.channelId) {
            await specs[i].voice.setChannel(newState.member.voice.channelId).catch(e => { msg_user(lieu_id, "" + e); })
            await new Promise(r => setTimeout(r, 200));
            movs += 1;
            if (movs == 5) {
              await new Promise(r => setTimeout(r, 2600));
              movs = 0;
            }
            // //await specs[i].move_member(newState.member.voice.channelId)
            // // await client.move_member(specs[i], client.get_channel(newState.member.voice.channelId))
            // await client.moveMember(specs[i], msg.guild.channels.cache.find(c => c.id === newState.member.voice.channelId)[1])
          }
        }
        else {
          specs.splice(i, 1)
          i--
        }
      }
    }
  }
  if (oldState.channelId === null) {
    // if (newState.guild.id == "569683781800296501" && newState.member.displayName.trim().substring(0, 4).toLowerCase() == "(st)") {
    //   if (!st_list.includes(newState.user.id))
    //   {
    //     if (st_list.length() < 4)
    //       st_list.append(newState.user.id);
    //     else
    //       st_list[stlc] = newState.user.id;
    //     stlc = (stlc + 1) % 4;
    //     msg_user(lieu_id,"THIS IS WORKING!!");
    //     await ping_players(newState.member.displayName, newState.channel);
    //   }
    // }
  }
  if (newState.channelId === null) {
    for (let i = 0; i < grim_setters.length; i++) {
      if (newState.member.user.username === grim_setters[i].user.username) {
        // grim_setter = grim_setters[i]
        // grim_link = grim_links[i]
        grim_setters.splice(i, 1)
        grim_links.splice(i, 1)
        grim_servs.splice(i, 1)
		grim_channel.splice(i, 1)
        break
      }
    }
    // msg_user(lieu_id,'a user left!')
    if (medic[newState.member.user.username] !== undefined && medic[newState.member.user.username] != -1)//(Object.keys(medic).indexOf(newState.member.user.username) != -1)
    {
      var specs = medic[newState.member.user.username]
      for (let i = 0; i < specs.length; i++) {
        if (stdic[specs[i].user.username] == newState.member.user.username) {
          delete stdic[specs[i].user.username]
        }
      }
    }
    if (medic[newState.member.user.username] != -1) {
      delete medic[newState.member.user.username]
    }
    delete stdic[newState.member.user.username]
  }
});

client.on(Events.GuildMemberUpdate, async function(oldMember, newMember) {
  if (!responding) {
    return null
  }
  //   // msg_user(lieu_id,oldMember.displayName)
  //   // msg_user(lieu_id,newMember.displayName)
  //   remove role discord.js

  //   const Role = message.guild.roles.cache.get("RoleID");
  //   Role.members.forEach((member, i) => { // Looping through the members of Role.
  //       setTimeout(() => {
  //           member.roles.remove(Role); // Removing the Role.
  //       }, i * 1000);
  //   });

  if (newMember.displayName && oldMember.displayName != newMember.displayName) {
    if (newMember.displayName.charAt(0) != '!' && newMember.displayName.trim().substring(0, 4).toLowerCase() !== "(st)" && newMember.displayName.trim().substring(0, 6).toLowerCase() !== "(cost)" && newMember.displayName.trim().substring(0, 7).toLowerCase() !== "(co-st)") {
      delete stdic[newMember.user.username]
    } //tofix: comment out part below
    // if (oldMember.displayName.trim().substring(0, 4).toLowerCase() === "(st)" && newMember.displayName.trim().substring(0, 4).toLowerCase() !== "(st)") {
    //   for (let i = 0; i < grim_setters.length; i++) {
    //     if (grim_setters[i].user.username === oldMember.user.username) {
    //       grim_setters.splice(i, 1)
    //       grim_links.splice(i, 1)
    //       grim_servs.splice(i, 1)
    //       i--
    //     }
    //   }
    // }
    //ROLESSSSSSSSSSSSSS
    if (newMember.displayName.trim().substring(0, 4).toLowerCase() !== "(st)" &&
      newMember.displayName.trim().substring(0, 7).toLowerCase() !== "(co-st)" &&
      newMember.displayName.trim().substring(0, 1).toLowerCase() !== "!" &&
      newMember.guild.id === "569683781800296501") {
      // const specrole = client.guilds.cache.get("569683781800296501").roles.cache.get("1003428487375364216");
      // const strole = client.guilds.cache.get("569683781800296501").roles.cache.get("745730857976725536");
      // newMember.roles.remove(specrole).catch(err => { msg_user(lieu_id,err); });
      // newMember.roles.remove(strole).catch(err => { msg_user(lieu_id,err); });
      // msg_user(lieu_id,"Caught Player");
      // specrole.members.forEach((member, i) => { // Looping through the members of Role.
      //     setTimeout(() => {
      //         member.roles.remove(Role); // Removing the Role.
      //     }, i * 1000);
      // });
      // strole.members.forEach((member, i) => { // Looping through the members of Role.
      //     setTimeout(() => {
      //         member.roles.remove(Role); // Removing the Role.
      //     }, i * 1000);
      // });
      // Role.members.forEach((member, i) => { // Looping through the members of Role.
      //     setTimeout(() => {
      //         member.roles.remove(Role); // Removing the Role.
      //     }, i * 1000);
      // });
    }
    else if (newMember.displayName.trim().substring(0, 1).toLowerCase() === "!" &&
      newMember.guild.id === "569683781800296501") {
      // const specrole = client.guilds.cache.get("569683781800296501").roles.cache.get("1003428487375364216");
      // const strole = client.guilds.cache.get("569683781800296501").roles.cache.get("745730857976725536");
      // newMember.roles.add(specrole).catch(err => { msg_user(lieu_id,err); });
      // newMember.roles.remove(strole).catch(err => { msg_user(lieu_id,err); });
      // msg_user(lieu_id,"Caught Spectator");
    }
    else if ((newMember.displayName.trim().substring(0, 4).toLowerCase() === "(st)" ||
      newMember.displayName.trim().substring(0, 7).toLowerCase() === "(co-st)") &&
      newMember.guild.id === "569683781800296501") {
      // const specrole = client.guilds.cache.get("569683781800296501").roles.cache.get("1003428487375364216");
      // const strole = client.guilds.cache.get("569683781800296501").roles.cache.get("745730857976725536");
      // newMember.roles.remove(specrole).catch(err => { msg_user(lieu_id,err); });
      // newMember.roles.add(strole).catch(err => { msg_user(lieu_id,err); });
      // msg_user(lieu_id,"Caught ST");
    }
    //ROLESSSSSSSSSSSSSS
    if (oldMember.displayName.trim().substring(0, 4).toLowerCase() !== "(st)" && newMember.displayName.trim().substring(0, 4).toLowerCase() === "(st)") {
      if (next_game.length > 0 && newMember.guild.id === "569683781800296501" && newMember.voice.channel) {
        if (newMember.voice.channel && (newMember.voice.channel.id == "1134270809804914698" || newMember.voice.channel.id == "1134270208408821770")) {
          return null;
        }
        //let ch1 = client.channels.cache.get('981318418806472815');
        //ch1.send(newMember.user.id+" "+newMember.user.username+"#").catch(err => { msg_user(lieu_id,"No permission to send messages in that text channel\n")
        let txt = "**Game About to Start**\n**Storyteller:** " + newMember.displayName + "\n"
        if (newMember.voice.channel) {
          txt += "**Channel:** " + newMember.voice.channel.name + "\n"
        }
        for (let i = 0; i < next_game.length; i++) {
          txt += "<@" + next_game[i] + "> "
        }
        next_game = []
        let ch = client.channels.cache.get('572830989315997696');
        ch.send(txt).catch(err => {
          msg_author(msg, "No permission to send messages in " + ch.name + "\n");
        })
      }
    }
    if ((oldMember.displayName.trim().substring(0, 4).toLowerCase() === "(st)" || oldMember.displayName.trim().substring(0, 6).toLowerCase() === "(cost)" || oldMember.displayName.trim().substring(0, 7).toLowerCase() === "(co-st)") && (newMember.displayName.trim().substring(0, 4).toLowerCase() !== "(st)" && newMember.displayName.trim().substring(0, 6).toLowerCase() !== "(cost)" && newMember.displayName.trim().substring(0, 7).toLowerCase() !== "(co-st)")) {
      for (let i = 0; i < grim_setters.length; i++) {
        if (grim_setters[i].user.username === oldMember.user.username) {
          grim_setters.splice(i, 1)
          grim_links.splice(i, 1)
          grim_servs.splice(i, 1)
		  grim_channel.splice(i, 1)
          i--
        }
      }
    }
  }
})

client.on('rateLimit', async function(info) {
  let timeout = info.timeDifference ? info.timeDifference : info.timeout ? info.timeout : -1
  // msg_user(lieu_id,`Rate limit hit ${timeout != -1 ? timeout : 'Unknown timeout'}`)
  if (timeout > 3600000) {
    msg_user(lieu_id, "\n\nHuge Timeout!\n\n")
  }// else { msg_user(lieu_id,"\n\nSmall Pause\n\n") }
  responding = false;
  await new Promise(resolve => setTimeout(resolve, timeout));
  responding = true;
})

// client.on('error', console.log);

// client.on('debug', (stuff) => {
//   msg_user(lieu_id,"DEBUGGER vvvvvvvvvvvv\n")
//   msg_user(lieu_id,stuff)
//   msg_user(lieu_id,"DEBUGGER ^^^^^^^^^^^^\n")
// });

try {
  client.login(process.env.DISCORD_TOKEN)
} catch (e) {
  console.log("Login Error!")
  exec("kill 1", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}