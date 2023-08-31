"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMessagesForUser = exports.saveMessageToDb = exports.getSocketServerFromRedis = exports.removeSocketServerToRedis = exports.addSocketServerToRedis = exports.findSocketServerIdForUser = exports.registerUserSocketServerMap = exports.removeUserFromSocketServerMap = exports.getUniqueID = void 0;
const __1 = require("..");
const getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};
exports.getUniqueID = getUniqueID;
/**
 * all webservers when joined will
 *
 *
 */
function removeUserFromSocketServerMap(userid) {
    return __awaiter(this, void 0, void 0, function* () {
        return __1.redis_client.DEL('user-' + userid);
    });
}
exports.removeUserFromSocketServerMap = removeUserFromSocketServerMap;
function registerUserSocketServerMap(userid, socketserverid, webserverid) {
    return __awaiter(this, void 0, void 0, function* () {
        //later on replace this with redis
        __1.redis_client.SET('user-' + userid, JSON.stringify({
            socketserverid, webserverid, userid
        }));
        // const res = await pg_client.query(`insert into user_socket_server_mapping values(${userid},${socketserverid})`)
        // console.log("saved saveUserSocketServerMapping", res)
        // return res;
    });
}
exports.registerUserSocketServerMap = registerUserSocketServerMap;
function findSocketServerIdForUser(userid) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield __1.redis_client.GET('user-' + userid);
        console.log("findSocketServerIdForUser", res);
        let client = null;
        if (res) {
            client = JSON.parse(res);
        }
        return client;
    });
}
exports.findSocketServerIdForUser = findSocketServerIdForUser;
// Save client to redis
function addSocketServerToRedis(webserverid, socketserverid) {
    return __awaiter(this, void 0, void 0, function* () {
        yield __1.redis_client.set('socketserver-' + socketserverid, JSON.stringify({
            socketserverid, webserverid
        }));
    });
}
exports.addSocketServerToRedis = addSocketServerToRedis;
function removeSocketServerToRedis(webserverid, socketserverid) {
    return __awaiter(this, void 0, void 0, function* () {
        yield __1.redis_client.del('socketserver-' + socketserverid);
    });
}
exports.removeSocketServerToRedis = removeSocketServerToRedis;
function getSocketServerFromRedis(socketserverid) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield __1.redis_client.get('socketserver-' + socketserverid);
        if (res) {
            return JSON.parse(res);
        }
        else {
            console.error("socketserver not found i redis");
            return undefined;
        }
    });
}
exports.getSocketServerFromRedis = getSocketServerFromRedis;
function getAllUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        return __1.redis_client.GET('user-*');
    });
}
function saveMessageToDb(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("saveMessageToDb", msg);
        yield __1.pg_client.query(`insert into private_chat values (${msg.from},${msg.for},${msg.msg_id},${''},${msg.msg})`);
    });
}
exports.saveMessageToDb = saveMessageToDb;
function getAllMessagesForUser(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const resp = yield __1.pg_client.query(`select * from private_chat where userid1='${id}';`);
        return resp === null || resp === void 0 ? void 0 : resp.rows;
    });
}
exports.getAllMessagesForUser = getAllMessagesForUser;
