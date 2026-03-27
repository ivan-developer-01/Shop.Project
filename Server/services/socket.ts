import { createServer } from "http";
import { Express } from "express";
import { Server } from "socket.io";

const log = (message) => console.log(`Socket.IO: ${message}`);

export function initSocketServer(applicationServer: Express): Server {
	const httpServer = createServer(applicationServer);

	const io = new Server(httpServer, {
		cors: {
			origin: "http://localhost:5000"
		}
	});

	io.on("connection", () => {
		log("A client is connected");
	});

	httpServer.listen(3001, () => {
		log("server is running on port 3001");
	});

	return io;
}