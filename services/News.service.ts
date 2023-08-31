import { pg_client, redis_client } from "..";
export const getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};
/**
 * all webservers when joined will 
 * 
 * 
 */

export async function removeUserFromSocketServerMap(userid: string){
    return redis_client.DEL('user-' + userid)
}

export async function registerUserSocketServerMap(userid: string, socketserverid: string, webserverid: string) {
    //later on replace this with redis
    redis_client.SET('user-' + userid, JSON.stringify({
        socketserverid, webserverid, userid
    }))
    // const res = await pg_client.query(`insert into user_socket_server_mapping values(${userid},${socketserverid})`)
    // console.log("saved saveUserSocketServerMapping", res)
    // return res;
}

export async function findSocketServerIdForUser(userid: string) {
    const res = await redis_client.GET('user-' + userid)
    console.log("findSocketServerIdForUser", res)
    let client = null
    if (res) { client = JSON.parse(res) as { userid: string, socketserverid: string, webserverid: string } }
    return client

}

// Save client to redis
export async function addSocketServerToRedis(webserverid: string, socketserverid: string) {
    await redis_client.set('socketserver-' + socketserverid, JSON.stringify({
        socketserverid, webserverid
    }))
}
export async function removeSocketServerToRedis(webserverid: string, socketserverid: string) {
    await redis_client.del('socketserver-' + socketserverid)
}

export async function getSocketServerFromRedis(socketserverid: string) {
    const res = await redis_client.get('socketserver-' + socketserverid)
    if (res) {
        return JSON.parse(res) as { socketserverid: string, webserverid: string }
    } else {
        console.error("socketserver not found i redis")
        return undefined
    }
}

async function getAllUsers() {
    return redis_client.GET('user-*')
}


export async function saveMessageToDb(msg: { type: string, from: string, msg_id: string, for: string, socketserverid: string, msg: string }) {
    console.log("saveMessageToDb", msg)
    await pg_client.query(`insert into private_chat values (${msg.from},${msg.for},${msg.msg_id},${''},${msg.msg})`)
}

export async function getAllMessagesForUser(id:string) {
    const resp = await pg_client.query(`select * from private_chat where userid1='${id}';`)
    return resp?.rows
}