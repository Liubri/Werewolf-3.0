"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleType = exports.Team = exports.GamePhase = void 0;
var GamePhase;
(function (GamePhase) {
    GamePhase["LOBBY"] = "LOBBY";
    GamePhase["NIGHT"] = "NIGHT";
    GamePhase["DAY"] = "DAY";
    GamePhase["VOTING"] = "VOTING";
    GamePhase["GAME_OVER"] = "GAME_OVER";
})(GamePhase || (exports.GamePhase = GamePhase = {}));
var Team;
(function (Team) {
    Team["VILLAGER"] = "VILLAGER";
    Team["WEREWOLF"] = "WEREWOLF";
})(Team || (exports.Team = Team = {}));
var RoleType;
(function (RoleType) {
    RoleType["WEREWOLF"] = "WEREWOLF";
    RoleType["VILLAGER"] = "VILLAGER";
    RoleType["SEER"] = "SEER";
    RoleType["WITCH"] = "WITCH";
    RoleType["DREAMKEEPER"] = "DREAMKEEPER";
    RoleType["HUNTER"] = "HUNTER";
    RoleType["WOLFBEAUTY"] = "WOLFBEAUTY";
    RoleType["MAGICIAN"] = "MAGICIAN";
})(RoleType || (exports.RoleType = RoleType = {}));
