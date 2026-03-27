import { Request, Response, Router } from "express";
import { validateComment } from "../helpers";
import { IComment } from "@Shared/types";
import { CommentCreatePayload, ICommentEntity } from "../../types";
import { v4 as uuidv4 } from "uuid";
import { connection } from "../..";
import { mapCommentsEntity } from "../services/mapping";
import { ResultSetHeader } from "mysql2";
import { COMMENT_DUPLICATE_QUERY, INSERT_COMMENT_QUERY } from "../services/queries";
import { param, validationResult } from "express-validator";

export const commentsRouter = Router();

commentsRouter.get("/", async (req: Request, res: Response) => {
	try {
		const [comments] = await connection.query<ICommentEntity[]>(
			"SELECT * FROM comments"
		);
		res.setHeader("Content-Type", "application/json");
		res.send(mapCommentsEntity(comments));
	} catch (error) {
		console.debug(error.message);
		res.status(500);
		res.send("Something went wrong");
	}
});

commentsRouter.get(
	"/:id",
	[
		param("id").isUUID().withMessage("Comment id is not UUID")
	],
	async (req: Request<{ id: string }>, res: Response) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.status(400);
				res.json({ errors: errors.array() });
				return;
			}

			const [[targetComment]] = await connection.query<ICommentEntity[]>("SELECT * FROM comments WHERE comment_id = ?", [req.params.id]);

			if (!targetComment) {
				res.status(404);
				res.send(`Comment with id ${req.params.id} not found`);
				return;
			}

			res.setHeader("Content-Type", "application/json");
			res.send(targetComment);
		} catch (error) {
			console.log(error.message);
			res.status(500);
			res.send("Something went wrong");
		}
	});

commentsRouter.post("/", async (
	req: Request<unknown, unknown, CommentCreatePayload>,
	res: Response
) => {
	const validationResult = validateComment(req.body);
	if (validationResult) {
		res.status(400);
		res.send(validationResult);
		return;
	}

	try {
		const { name, email, body, productId } = req.body;

		const [sameResult] = await connection.query<ICommentEntity[]>(
			COMMENT_DUPLICATE_QUERY,
			[email.toLowerCase(), name.toLowerCase(), body.toLowerCase(), productId]
		);

		console.log(sameResult[0]?.comment_id);

		if (sameResult.length) {
			res.status(422);
			res.send("Comment with the same fields already exists");
			return;
		}

		const id = uuidv4();

		const [info] = await connection.query<ResultSetHeader>(INSERT_COMMENT_QUERY, [
			id,
			email,
			name,
			body,
			productId,
		]);

		console.log(info);

		res.status(201);
		res.send(`Command id:${id} has been added!`);
	} catch (error) {
		console.debug(error.message);
		res.status(500);
		res.send("Server error. Comment has not been created");
	}
});

commentsRouter.patch("/", async (
	req: Request<unknown, unknown, Partial<IComment>>,
	res: Response
) => {
	try {
		let updateQuery = "UPDATE comments SET ";

		const valuesToUpdate = [];
		["name", "body", "email"].forEach(fieldName => {
			if (Object.hasOwnProperty.call(req.body, fieldName)) {
				if (valuesToUpdate.length) {
					updateQuery += ", ";
				}

				updateQuery += `${fieldName} = ?`;
				valuesToUpdate.push(req.body[fieldName]);
			}
		});

		updateQuery += " WHERE comment_id = ?";
		valuesToUpdate.push(req.body.id);

		const [info] = await connection.query<ResultSetHeader>(updateQuery, valuesToUpdate);

		if (info.affectedRows === 1) {
			res.status(200);
			res.end();
			return;
		}

		const newComment = req.body as CommentCreatePayload;
		const validationResult = validateComment(newComment);

		if (validationResult) {
			res.status(400);
			res.send(validationResult);
			return;
		}

		const id = uuidv4();
		await connection.query(
			INSERT_COMMENT_QUERY,
			[id, newComment.email, newComment.name, newComment.body, newComment.productId]
		);

		res.status(201);
		res.send({ ...newComment, id });
	} catch (error) {
		console.log(error.message);
		res.status(500);
		res.send("Server error");
	}
});

commentsRouter.delete(`/:id`, async (req: Request<{ id: string }>, res: Response) => {
	try {
		const [info] = await connection.query<ResultSetHeader>(
			"DELETE FROM comments WHERE comment_id = ?",
			[req.params.id]
		);

		if (!info.affectedRows) {
			res.status(404);
			res.send(`Comment with id ${req.params.id} not found`);
		}

		res.status(200);
		res.end();
	} catch (error) {
		console.log(error.message);
		res.status(500);
		res.send("Something went wrong");
	}
});