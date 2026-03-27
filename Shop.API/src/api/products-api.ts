import { ioServer } from './../../../index';
import { Request, Response, Router } from "express";
import { mapCommentsEntity, mapImagesEntity, mapProductsEntity } from "../services/mapping";
import { connection } from "../..";
import { IImage } from "@Shared/types";
import { ICommentEntity, IImageEntity, IProductEntity, IProductSearchFilter, ProductCreatePayload, ProductPatchPayload } from "../../types";
import { enhanceProductsComments, enhanceProductsImages, getProductsFilterQuery, getProductThumbnail } from "../helpers";
import { v4 as uuidv4 } from "uuid";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { INSERT_PRODUCT_QUERY } from "../services/queries";
import { body, param } from "express-validator";

export const productsRouter = Router();

const throwServerError = (res: Response, error: Error) => {
	console.debug(error.message);
	res.status(500);
	res.send("Something went wrong");
};

productsRouter.get("/", async (req: Request, res: Response) => {
	try {
		const [productRows] = await connection.query<IProductEntity[]>(
			"SELECT * FROM products"
		);

		const [commentRows] = await connection.query<ICommentEntity[]>(
			"SELECT * FROM comments"
		);

		const [imageRows] = await connection.query<IImageEntity[]>(
			"SELECT * FROM images"
		);

		const products = mapProductsEntity(productRows);
		const withComments = enhanceProductsComments(products, commentRows);
		const result = enhanceProductsImages(withComments, imageRows);

		res.send(result);
	} catch (error) {
		throwServerError(res, error);
	}
});

productsRouter.get("/search", async (
	req: Request<unknown, unknown, unknown, IProductSearchFilter>,
	res: Response
) => {
	try {
		const [query, values] = getProductsFilterQuery(req.query);
		const [rows] = await connection.query<IProductEntity[]>(query, values);

		if (!rows?.length) {
			res.status(404);
			res.send(`No products matching the filter were found`);
			return;
		}

		const [commentRows] = await connection.query<ICommentEntity[]>(
			"SELECT * FROM comments"
		);

		const [imageRows] = await connection.query<IImageEntity[]>(
			"SELECT * FROM images"
		);

		const products = mapProductsEntity(rows);
		const withComments = enhanceProductsComments(products, commentRows);
		const result = enhanceProductsImages(withComments, imageRows);

		res.send(result);
	} catch (error) {
		throwServerError(res, error);
	}
});

productsRouter.get("/:id", async (
	req: Request<{ id: string }>,
	res: Response
) => {
	try {
		const [rows] = await connection.query<IProductEntity[]>(
			"SELECT * FROM products WHERE product_id = ?",
			[req.params.id]
		);

		if (!rows?.[0]) {
			res.status(404);
			res.send(`Product with id ${req.params.id} is not found`);
			return;
		}

		const [comments] = await connection.query<ICommentEntity[]>(
			"SELECT * FROM comments WHERE product_id = ?",
			[req.params.id]
		);

		const [images] = await connection.query<IImageEntity[]>(
			"SELECT * FROM images WHERE product_id = ?",
			[req.params.id]
		);

		const product = mapProductsEntity(rows)[0];

		if (comments.length) {
			product.comments = mapCommentsEntity(comments);
		}

		if (images.length) {
			product.images = mapImagesEntity(images);
			const targetThumbnail = getProductThumbnail(product.images);
			if (targetThumbnail) product.thumbnail = targetThumbnail;
		}

		res.send(product);
	} catch (error) {
		throwServerError(res, error);
	}
});

productsRouter.post("/", async (
	req: Request<unknown, unknown, ProductCreatePayload>,
	res: Response
) => {
	try {
		console.log(req.body);
		const { title, description, price, images } = req.body;
		const id = uuidv4();
		await connection.query<ResultSetHeader>(
			INSERT_PRODUCT_QUERY,
			[id, title || null, description || null, price || null]
		);

		if (images) {
			await connection.query<ResultSetHeader>(
				`INSERT INTO images (image_id, url, product_id, main) VALUES ?`,
				[images.map(({ main, url }) => [uuidv4(), url, id, main || false])]
			);
		}

		const [products] = await connection.query<RowDataPacket[]>("SELECT * FROM products");
		ioServer.emit("update products count", products?.length ?? 0);
		res.status(201);
		res.send(`Product id:${id} has been added!`);
	} catch (error) {
		throwServerError(res, error);
	}
});

productsRouter.post("/add-images/:id", async (
	req: Request<{ id: string }, unknown, IImage[]>,
	res: Response
) => {
	try {
		await connection.query<ResultSetHeader>(
			"INSERT INTO images (image_id, url, product_id, main) VALUES ?",
			[req.body.map(({ main, url }) => [uuidv4(), url, req.params.id, main || false])]
		);

		res.status(200);
		res.end();
	} catch (error) {
		throwServerError(res, error);
	}
});

productsRouter.post("/delete-images/:id", async (
	req: Request<{ id: string }, unknown, string[]>,
	res: Response
) => {
	try {
		const [info] = await connection.query<ResultSetHeader>(
			"DELETE FROM images WHERE product_id = ? AND image_id IN ?",
			[req.params.id, [req.body]]
		);

		if (info.affectedRows === 0) {
			res.status(404);
			res.send(`No images matching given IDs were found.`);
			return;
		}

		res.status(200);
		res.send(`${info.affectedRows} out of ${req.body.length} requested images were deleted.`);
	} catch (error) {
		throwServerError(res, error);
	}
});

productsRouter.post("/update-thumbnail/:id",
	[
		param("id").isUUID().withMessage("Product id is not UUID"),
		body("id").notEmpty().isUUID().withMessage("New thumbnail id is empty or not UUID")
	], async (
		req: Request<{ id: string }, unknown, { id: string }>,
		res: Response
	) => {
	try {
		const [thumbnailRes] = await connection.query<IImageEntity[]>(
			"SELECT * FROM images WHERE product_id = ? AND main = 1",
			[req.params.id]
		);

		if (!thumbnailRes?.[0]) {
			res.status(400);
			res.end("Post does not yet have a thumbnail?!?!");
		}

		const [newImageRes] = await connection.query<IImageEntity[]>(
			"SELECT * FROM images WHERE product_id = ? AND image_id = ?",
			[req.params.id, req.body.id]
		);

		if (!newImageRes?.[0]) {
			res.status(400);
			res.send(`No image with ID ${req.body.id} found`);
		}

		await connection.query<ResultSetHeader>(
			`
                UPDATE images
                SET main =  CASE
                                WHEN image_id = ? THEN 0
                                WHEN image_id = ? THEN 1
                                ELSE main
                            END
                WHERE product_id = ?
            `,
			[thumbnailRes[0].image_id, req.body.id, req.params.id]
		);

		res.status(200);
		res.end();
	} catch (error) {
		throwServerError(res, error);
	}
});

productsRouter.patch("/:id", async (
	req: Request<{ id: string }, unknown, ProductPatchPayload>,
	res: Response
) => {
	try {
		const [productRes] = await connection.query<IProductEntity[]>(
			"SELECT product_id FROM products WHERE product_id = ?",
			[req.params.id]
		);

		if (!productRes?.[0]) {
			res.status(404);
			res.end();
			return;
		}

		const body = { ...req.body };
		body.price = +body.price;
		if (Number.isNaN(body.price)) {
			res.status(400);
			res.send("Price expected to be a number");
			return;
		}

		await connection.query<ResultSetHeader>(
			"UPDATE products SET title = ?, description = ?, price = ? WHERE product_id = ?",
			[body.title, body.description, body.price, req.params.id]
		);

		const [[currentProduct]] = await connection.query<IProductEntity[]>(
			"SELECT * FROM products WHERE product_id = ?",
			[req.params.id]
		);

		res.status(200);
		res.send(mapProductsEntity([currentProduct])[0]);
	} catch (error) {
		throwServerError(res, error);
	}
});

productsRouter.delete("/:id", async (
	req: Request<{ id: string }>,
	res: Response
) => {
	try {
		["comments", "images"].forEach(async (table) => await connection.query<ResultSetHeader>(
			`DELETE FROM ${table} WHERE product_id = ?`,
			[req.params.id]
		));

		const [info] = await connection.query<ResultSetHeader>(
			"DELETE FROM products WHERE product_id = ?",
			[req.params.id]
		);

		if (info.affectedRows === 0) {
			res.status(404);
			res.send(`Product with id ${req.params.id} not found`);
			return;
		}

		res.status(200);
		res.end();
	} catch (error) {
		throwServerError(res, error);
	}
});