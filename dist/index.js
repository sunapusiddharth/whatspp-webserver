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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis_client = exports.pg_client = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
// const redis = require("redis");
const redis_1 = require("redis");
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config({ path: './.env' });
// {path:'./config.env'}
const pg_1 = require("pg");
// const errorHandler = require('./middleware/error')
const PORT = process.env.PORT || 9002;
const ws_1 = require("ws");
const News_service_1 = require("./services/News.service");
exports.pg_client = new pg_1.Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'Sidhu@123',
    database: 'whats_app_temp'
});
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use(function (err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    console.log("erorr middleware", err);
    return res.status(err.status || 500).render('500');
});
app.use("/content", require("./routes/news"));
//ErrorHandler (Should be last piece of middleware)
// app.use(errorHandler);
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        exports.redis_client = (0, redis_1.createClient)();
        exports.redis_client.on('error', (err) => console.log('Redis Client Error', err));
        yield exports.redis_client.connect();
        yield exports.pg_client.connect();
        app.listen(PORT, () => console.log("Server started on port " + PORT));
        process.on("unhandledRejection", (error, promise) => {
            console.log(`Logged Error: ${error}`);
            return;
            // throw new Error(error)
            // server.close(() => process.exit(1))
        });
        let webserverid = 'webserver' + (0, News_service_1.getUniqueID)();
        // WS
        const sockserver = new ws_1.Server({ port: 443 });
        sockserver.on('connection', (ws, req) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            console.log("Url=", req.url);
            const url_params = (_a = req.url) === null || _a === void 0 ? void 0 : _a.split('/?')[1].split('&').map(x => {
                let y = x.split('=');
                let k = y[0];
                let v = y[1];
                return { [k]: v };
            });
            // @ts-ignore
            ws.socketserverid = url_params[0]['socketserverid'];
            console.log(ws.socketserverid);
            yield (0, News_service_1.addSocketServerToRedis)(webserverid, ws.socketserverid);
            //save this detail into redis
            console.log('New client connected!');
            console.log("CLiet", sockserver.clients.forEach(c => console.log(c.socketserverid)));
            ws.on('close', () => __awaiter(void 0, void 0, void 0, function* () {
                console.log('Client has disconnected!');
                // we will remove the socketserver mapping as well
                yield (0, News_service_1.removeSocketServerToRedis)(webserverid, ws.socketserverid);
            }));
            ws.on('message', (msg) => __awaiter(void 0, void 0, void 0, function* () {
                console.log("message recieved from socketserver", JSON.parse(msg.toString()));
                const msg_res = JSON.parse(msg.toString());
                //  New user is added to socketserver , we save the mapping into redis
                if (msg_res.type == 'saveusersocketservermapping') {
                    let client = findClientWithinMe(sockserver, msg_res.socketserverid);
                    if (!client) {
                        //also find in redis since this is in cluster mode
                        const res = yield (0, News_service_1.getSocketServerFromRedis)(msg_res.socketserverid);
                        if (res) {
                            //means this scoketserver is not with me but in other webservers
                            //redoirect it to them
                            //todo
                        }
                        else {
                            console.error("Something wrong happened client not found in all web servers", msg_res.socketserverid);
                        }
                    }
                    if (client) {
                        yield (0, News_service_1.registerUserSocketServerMap)(msg_res.for, msg_res.socketserverid, webserverid);
                    }
                    else {
                        console.log("Socket server is not registered!!!!", msg_res.socketserverid);
                    }
                }
                // Message comes for finding the user
                if (msg_res.type == 'findsocketserverid') {
                    const client_res = yield (0, News_service_1.findSocketServerIdForUser)(msg_res.for);
                    if (client_res) {
                        if (client_res.webserverid == webserverid) {
                            //found with me
                            const socketserver = findClientWithinMe(sockserver, client_res.socketserverid);
                            if (socketserver) {
                                socketserver.send(msg);
                            }
                            else {
                                //something 
                                console.log("socketserverid not found in me", client_res.socketserverid);
                                yield (0, News_service_1.saveMessageToDb)(msg_res);
                            }
                        }
                        else {
                            //redirect to different webserverid
                            yield (0, News_service_1.saveMessageToDb)(msg_res);
                        }
                    }
                    else {
                        console.error("client not found", msg);
                        yield (0, News_service_1.saveMessageToDb)(msg_res);
                    }
                }
                if (msg_res.type == 'getallusermessages') {
                    const messages = yield (0, News_service_1.getAllMessagesForUser)(msg_res.for);
                    const client_res = yield (0, News_service_1.findSocketServerIdForUser)(msg_res.for);
                    console.log("getallusermessages", messages, client_res);
                    if (client_res) {
                        if (client_res.webserverid == webserverid) {
                            //found with me
                            const socketserver = findClientWithinMe(sockserver, client_res.socketserverid);
                            console.log("getallusermessages socketserver", socketserver);
                            if (socketserver) {
                                for (const msg of messages) {
                                    socketserver.send(JSON.stringify({
                                        type: 'send_message_to', msg_id: '', from: msg.userid1, for: msg.userid2, msg: msg.message
                                    }));
                                }
                            }
                            else {
                                //something 
                                console.log("socketserverid not found in me", client_res.socketserverid);
                            }
                        }
                        else {
                            //redirect to different webserverid
                            console.error("different ebserver than this need to redirect");
                        }
                    }
                    else {
                        console.error("client not found", msg);
                    }
                }
                if (msg_res.type == 'removeusersocketservermapping') {
                    yield (0, News_service_1.removeUserFromSocketServerMap)(msg_res.for);
                }
            }));
        }));
    }
    catch (error) {
        console.error(error);
        // process.exit(1);
    }
});
start();
function findClientWithinMe(sockserver, socketserverid) {
    var _a;
    let client = (_a = Array.from(sockserver.clients)) === null || _a === void 0 ? void 0 : _a.find(cl => cl.socketserverid == socketserverid);
    return client;
}
