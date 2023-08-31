import express, { Express } from 'express';
import dotenv from 'dotenv'
// const redis = require("redis");
import { createClient, RedisClientType } from 'redis';
import cors from 'cors'
dotenv.config({ path: './.env' });
// {path:'./config.env'}
import { Client as PgClient } from 'pg'
// const errorHandler = require('./middleware/error')
const PORT = process.env.PORT || 9002;
import { Server, WebSocket } from 'ws'
import { removeUserFromSocketServerMap, addSocketServerToRedis, findSocketServerIdForUser, getAllMessagesForUser, getSocketServerFromRedis, getUniqueID, registerUserSocketServerMap, saveMessageToDb, removeSocketServerToRedis } from './services/News.service';


export const pg_client = new PgClient({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Sidhu@123',
  database: 'whats_app_temp'
})
const app: Express = express();
app.use(express.json());
app.use(cors())
export let redis_client: RedisClientType
app.use(function (err: any, req: any, res: any, next: any) {
  if (res.headersSent) {
    return next(err);
  }
  console.log("erorr middleware", err)
  return res.status(err.status || 500).render('500');
});
app.use("/content", require("./routes/news"));

//ErrorHandler (Should be last piece of middleware)
// app.use(errorHandler);
const start = async () => {
  try {
    redis_client = createClient();
    redis_client.on('error', (err: any) => console.log('Redis Client Error', err));
    await redis_client.connect();
    await pg_client.connect()
    app.listen(PORT, () => console.log("Server started on port " + PORT));
    process.on("unhandledRejection", (error, promise) => {
      console.log(`Logged Error: ${error}`);
      return
      // throw new Error(error)
      // server.close(() => process.exit(1))
    })
    let webserverid = 'webserver' + getUniqueID()
    // WS
    const sockserver = new Server({ port: 443 });
    sockserver.on('connection', async (ws, req) => {
      console.log("Url=", req.url)
      const url_params = req.url?.split('/?')[1].split('&').map(x => {
        let y = x.split('=')
        let k = y[0]
        let v = y[1]
        return { [k]: v }
      })
      // @ts-ignore
      ws.socketserverid = url_params[0]['socketserverid']
      console.log(ws.socketserverid)
      await addSocketServerToRedis(webserverid, ws.socketserverid)
      //save this detail into redis
      console.log('New client connected!');
      console.log("CLiet", sockserver.clients.forEach(c => console.log(c.socketserverid)))
      ws.on('close', async () => {
        console.log('Client has disconnected!')
        // we will remove the socketserver mapping as well
        await removeSocketServerToRedis(webserverid, ws.socketserverid)
      });
      ws.on('message', async (msg) => {
        console.log("message recieved from socketserver", JSON.parse(msg.toString()))
        const msg_res = JSON.parse(msg.toString()) as { type: string, from: string, msg_id: string, for: string, socketserverid: string, msg: string }
        //  New user is added to socketserver , we save the mapping into redis
        if (msg_res.type == 'saveusersocketservermapping') {
          let client = findClientWithinMe(sockserver, msg_res.socketserverid)
          if (!client) {
            //also find in redis since this is in cluster mode
            const res = await getSocketServerFromRedis(msg_res.socketserverid)
            if (res) {
              //means this scoketserver is not with me but in other webservers
              //redoirect it to them
              //todo
            } else {
              console.error("Something wrong happened client not found in all web servers", msg_res.socketserverid)
            }
          }
          if (client) {
            await registerUserSocketServerMap(msg_res.for, msg_res.socketserverid, webserverid)
          } else {
            console.log("Socket server is not registered!!!!", msg_res.socketserverid)
          }

        }
        // Message comes for finding the user
        if (msg_res.type == 'findsocketserverid') {
          const client_res = await findSocketServerIdForUser(msg_res.for)
          if (client_res) {
            if (client_res.webserverid == webserverid) {
              //found with me
              const socketserver = findClientWithinMe(sockserver, client_res.socketserverid)
              if (socketserver) {
                socketserver.send(msg)
              } else {
                //something 
                console.log("socketserverid not found in me", client_res.socketserverid)
                await saveMessageToDb(msg_res)
              }
            } else {
              //redirect to different webserverid
              await saveMessageToDb(msg_res)
            }
          } else {
            console.error("client not found", msg)
            await saveMessageToDb(msg_res)
          }
        }
        if (msg_res.type == 'getallusermessages') {
          const messages = await getAllMessagesForUser(msg_res.for)
          const client_res = await findSocketServerIdForUser(msg_res.for)
          console.log("getallusermessages",messages,client_res)
          if (client_res) {
            if (client_res.webserverid == webserverid) {
              //found with me
              const socketserver = findClientWithinMe(sockserver, client_res.socketserverid)
              console.log("getallusermessages socketserver",socketserver)
              if (socketserver) {
                for (const msg of messages) {
                  socketserver.send(JSON.stringify({
                    type: 'send_message_to', msg_id: '', from: msg.userid1, for: msg.userid2, msg: msg.message
                  }))
                }
              } else {
                //something 
                console.log("socketserverid not found in me", client_res.socketserverid)
              }
            } else {
              //redirect to different webserverid
              console.error("different ebserver than this need to redirect")
            }
          } else {
            console.error("client not found", msg)
          }
        }

        if (msg_res.type == 'removeusersocketservermapping') {
          await removeUserFromSocketServerMap(msg_res.for)
        }
      })
    });



  } catch (error) {
    console.error(error);
    // process.exit(1);
  }
};
start();


function findClientWithinMe(sockserver: Server<WebSocket>, socketserverid: string) {
  let client = Array.from(sockserver.clients)?.find(cl => cl.socketserverid == socketserverid)
  return client
}