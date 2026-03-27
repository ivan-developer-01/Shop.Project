import { Request, Response, Router } from "express";
import { throwServerError } from "./helper";
import { IAuthRequisites } from "@Shared/types";
import { verifyRequisites } from "../models/auth.model";

export const authRouter = Router();

authRouter.get("/login", async (req: Request, res: Response) => {
	try {
		res.render("login");
	} catch (error) {
		throwServerError(res, error);
	}
});

authRouter.post("/authenticate", async (
	req: Request<unknown, unknown, IAuthRequisites>,
	res: Response
) => {
	try {
		const verified = await verifyRequisites(req.body);

		if (verified) {
			req.session.username = req.body.username;
			res.redirect(`/${process.env.ADMIN_PATH}`);
		} else {
			res.redirect(`/${process.env.ADMIN_PATH}/auth/login`);
		}
	} catch (error) {
		throwServerError(res, error);
	}
});

authRouter.get("/logout", (req, res) => {
	req.session.destroy(() => {
		res.status(200);
		res.redirect(`/${process.env.ADMIN_PATH}/auth/login`);
	});
});