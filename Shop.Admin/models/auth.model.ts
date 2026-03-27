import axios from "axios";
import { IAuthRequisites } from "@Shared/types";
import { API_HOST } from "./const";
import { NextFunction, Request, Response } from "express";

export async function verifyRequisites(
	requisites: IAuthRequisites
): Promise<boolean> {
	try {
		const { status } = await axios.post(
			`${API_HOST}/auth`,
			requisites
		);

		return status === 200;
	} catch {
		return false;
	}
}

export const validateSession = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	if (req.path.includes("/login") || req.path.includes("authenticate")) {
		next();
		return;
	}

	if (req.session?.username) {
		next();
	} else {
		res.redirect(`/${process.env.ADMIN_PATH}/auth/login`);
	}
};