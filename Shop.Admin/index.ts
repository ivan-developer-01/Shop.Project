import express, { Express, NextFunction, Request, Response } from "express";
import { authRouter } from "./controllers/auth.controller";
import { productsRouter } from "./controllers/products.controller";
import layouts from "express-ejs-layouts";
import session from "express-session";
import bodyParser from "body-parser";
import { validateSession } from "./models/auth.model";

declare module "express-session" {
	export interface SessionData {
		username?: string;
	}
}

export default function (): Express {
	const app = express();
	app.use(express.json());
	app.use(bodyParser.urlencoded({ extended: false }));

	app.set("view engine", "ejs");
	app.set("views", "Shop.Admin/views");
	app.use(layouts);
	app.use(express.static(__dirname + "/public"));

	app.use(session({
		secret: process.env.SESSION_SECRET,
		saveUninitialized: false,
		resave: false
	}));
	app.use(validateSession);
	app.use((req: Request, res: Response, next: NextFunction) => {
		res.locals.session = req.session;
		next();
	});

	app.use("/auth", authRouter);
	app.use("/", productsRouter);

	return app;
}