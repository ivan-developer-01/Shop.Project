import dotenv from "dotenv";
dotenv.config();
import { Express } from "express";
import { Connection } from "mysql2/promise";
import { initDataBase } from "./Server/services/db";
import { initServer } from "./Server/services/server";
import { Server } from "socket.io";
import { initSocketServer } from "./Server/services/socket";
import ShopAPI from "./Shop.API";
import ShopAdmin from "./Shop.Admin";

export let server: Express;
export let connection: Connection;
export let ioServer: Server;

async function launchApplication() {
	server = initServer();
	connection = await initDataBase();
	ioServer = initSocketServer(server);

	initRouter();
}

function initRouter() {
	const shopApi = ShopAPI(connection);
	server.use("/api", shopApi);

	const shopAdmin = ShopAdmin();
	server.use("/admin", shopAdmin);

	server.get("/", (req, res) => {
		res.send("Not a React App");
	});
}

launchApplication();