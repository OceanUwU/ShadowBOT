const specTag = "!";
const LFGTag = specTag + "[LFG]";
const STTag = "(ST)";
const coSTTag = "(Co-ST)";
const travellerTag = "(T)";
const AFKTag = "[AFK]";
const BRBTag = "[BRB]";
const textTag = "[TEXT]";
const newPlayerTag = "[N]";

class Nickname {
    static async change(member, to) {
        let base = Nickname.baseName(member);
        if (to == base)
            return false;
        if (to.length >= 32)
            return "This change would make your nickname longer than the maximum length!";
        return member.setNickname(to);
    }

    static baseName(member) {
        return member.nickname ?? member.user.globalName ?? member.user.username;
    }

    static hasSpecTag(name) {
        return name.toLowerCase().startsWith(specTag);
    }

    static removeStateTags(name) {
        name = Nickname.removeTravellerTag(name);
        name = Nickname.removeSpecTag(name);
        name = Nickname.removeLFGTag(name);
        name = Nickname.removeSTTag(name);
        name = Nickname.removeCoSTTag(name);
        return name;
    }

    static addSpecTag(name) {
        name = Nickname.removeStateTags(name);
        if (Nickname.hasSpecTag(name))
            return name;
        return specTag + name;
    }

    static removeSpecTag(name) {
        name = Nickname.removeLFGTag(name);
        if (!Nickname.hasSpecTag(name))
            return name;
        return name.slice(specTag.length).trim();
    }

    static hasLFGTag(name) {
        return name.toLowerCase().startsWith(LFGTag.toLowerCase());
    }

    static addLFGTag(name) {
        name = Nickname.removeStateTags(name);
        if (Nickname.hasLFGTag(name))
            return name;
        return LFGTag + " " + name;
    }

    static removeLFGTag(name) {
        if (!Nickname.hasLFGTag(name))
            return name;
        return name.slice(LFGTag.length).trim();
    }

    static hasSTTag(name) {
        return name.toLowerCase().startsWith(STTag.toLowerCase());
    }

    static addSTTag(name) {
        name = Nickname.removeStateTags(name);
        if (Nickname.hasSTTag(name))
            return name;
        return STTag + " " + name;
    }

    static removeSTTag(name) {
        if (!Nickname.hasSTTag(name))
            return name;
        return name.slice(STTag.length).trim();
    }

    static hasTravellerTag(name) {
        return name.toLowerCase().startsWith(travellerTag.toLowerCase());
    }

    static addTravellerTag(name) {
        name = Nickname.removeStateTags(name);
        if (Nickname.hasTravellerTag(name))
            return name;
        return travellerTag + " " + name;
    }

    static removeTravellerTag(name) {
        if (!Nickname.hasTravellerTag(name))
            return name;
        return name.slice(travellerTag.length).trim();
    }

    static hasCoSTTag(name) {
        return name.toLowerCase().startsWith(coSTTag.toLowerCase());
    }

    static addCoSTTag(name) {
        name = Nickname.removeStateTags(name);
        if (Nickname.hasSTTag(name))
            return name;
        return coSTTag + " " + name;
    }

    static removeCoSTTag(name) {
        if (!Nickname.hasSTTag(name))
            return name;
        return name.slice(coSTTag.length).trim();
    }

    static hasAFKTag(name) {
        return name.toLowerCase().includes(AFKTag.toLowerCase());
    }

    static addAFKTag(name) {
        name = Nickname.removeAFKOrBRBTag(name);
        if (Nickname.hasAFKTag(name))
            return name;
        return name + " " + AFKTag;
    }

    static removeAFKOrBRBTag(name) {
        if (Nickname.hasAFKTag(name) || Nickname.hasBRBTag(name))
            return name.replaceAll(" " + AFKTag, "").replaceAll(AFKTag, "").replaceAll(" " + BRBTag, "").replaceAll(BRBTag, "");
        return name;
    }

    static hasBRBTag(name) {
        return name.toLowerCase().includes(BRBTag.toLowerCase());
    }

    static addBRBTag(name) {
        name = Nickname.removeAFKOrBRBTag(name);
        if (Nickname.hasBRBTag(name))
            return name;
        return name + " " + BRBTag;
    }

    static hasTextTag(name) {
        return name.toLowerCase().includes(textTag.toLowerCase());
    }

    static addTextTag(name) {
        name = Nickname.removeAFKOrBRBTag(name);
        if (Nickname.hasTextTag(name))
            return name;
        return name + " " + textTag;
    }

    static removeTextTag(name) {
        if (Nickname.hasTextTag(name))
            return name.replaceAll(" " + textTag, "").replaceAll(textTag, "");
        return name;
    }

    static hasNewPlayerTag(name) {
        return name.toLowerCase().includes(newPlayerTag.toLowerCase());
    }

    static addNewPlayerTag(name) {
        name = Nickname.removeAFKOrBRBTag(name);
        if (Nickname.hasNewPlayerTag(name))
            return name;
        return name + " " + newPlayerTag;
    }

    static removeNewPlayerTag(name) {
        if (Nickname.hasNewPlayerTag(name))
            return name.replaceAll(" " + newPlayerTag, "").replaceAll(newPlayerTag, "");
        return name;
    }


    static hasSTOrCoSTTag(name) {
        return Nickname.hasSTTag(name) || Nickname.hasCoSTTag(name);
    }

    static isSTOrCoST(member) {
        return Nickname.hasSTOrCoSTTag(Nickname.baseName(member));
    }
}

export default Nickname;