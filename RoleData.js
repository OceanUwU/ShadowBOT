import fetch from 'node-fetch';
import { Document } from 'flexsearch';

const rolesUrl = "https://raw.githubusercontent.com/nicholas-eden/townsquare/refs/heads/develop/src/roles.json"
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

/** @type {Document} */
let roleSearch = null;
let roleData = null;

async function fetchData() {
    if (roleSearch === null) {
        try {
            let response = await fetch(rolesUrl);
            let body = await response.text();
            let roles = JSON.parse(body);
            if (!Array.isArray(roles))
                throw "Invalid role data detected!";
            roleSearch = new Document({
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
    return roleSearch;
}

async function searchRoles(name, limit) {
    if (await fetchData() === null) return null;
    let roles = roleSearch.search(name, {limit: limit, merge: true});
    if (limit != undefined && roles.length > limit)
        roles = roles.slice(0, limit);
    return roles.map(r => roleData[r.id]);
}

async function getById(id) {
    if (await fetchData() === null) return null;
    if (!roleData.hasOwnProperty(id)) return null;
    return roleData[id];
}

async function byIdOrSearch(query, limit) {
    let byId = await getById(query);
    if (byId == null) {
        let results = await searchRoles(query, limit);
        if (results == null || results.length <= 0) return null;
        return roleData[results[0].id];
    }
    return byId;
}

export default {
    search: searchRoles,
    byId: getById,
    byIdOrSearch: byIdOrSearch,
    all: async () => { await fetchData(); return roleData; },
};