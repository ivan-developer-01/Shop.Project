import express, { Express } from "express";
export function initServer(): Express {
	const app = express();
	const PORT = Number(process.env.LOCAL_PORT);

	app.use(express.json());
	app.use((req, res, next) => {
		res.header("Access-Control-Allow-Origin", "http://localhost:5000");
		res.header("Access-Control-Allow-Headers", "Content-Type");
		next();
	});

	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});

	return app;
}