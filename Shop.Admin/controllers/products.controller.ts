import { Router, Request, Response } from "express";
import { getProduct, getProducts, removeProduct, searchProducts, updateProduct } from "../models/products.model";
import { IProductFilterPayload } from "@Shared/types";
import { IProductEditData } from "Shop.Admin/types";
import { throwServerError } from "./helper";

export const productsRouter = Router();

productsRouter.get("/", async (req: Request, res: Response) => {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		console.log((req.session as any).username);
		const products = await getProducts();
		res.render("products", {
			items: products,
			queryParams: {}
		});
	} catch (error) {
		throwServerError(res, error);
	}
});

productsRouter.get("/:id", async (
	req: Request<{ id: string }>,
	res: Response
) => {
	try {
		const product = await getProduct(req.params.id);
		if (product) {
			res.render("product/product", {
				item: product
			});
		} else {
			res.render("product/empty-product", {
				id: req.params.id
			});
		}
	} catch (error) {
		throwServerError(res, error);
	}
});

productsRouter.get("/search", async (
	req: Request<unknown, unknown, unknown, IProductFilterPayload>,
	res: Response
) => {
	try {
		const products = await searchProducts(req.query);
		res.render("products", {
			items: products,
			queryParams: req.query
		});
	} catch (error) {
		throwServerError(res, error);
	}
});

productsRouter.get("/remove-product/:id", async (
	req: Request<{ id: string }>,
	res: Response
) => {
	try {
		if (req.session.username !== "admin") {
			res.status(403);
			res.send("Forbidden");
			return;
		}
		await removeProduct(req.params.id);
		res.redirect(`/${process.env.ADMIN_PATH}`);
	} catch (error) {
		throwServerError(res, error);
	}
});

productsRouter.post("/save/:id", async (
	req: Request<{ id: string }, unknown, IProductEditData>,
	res: Response
) => {
	try {
		const updatedProduct = await updateProduct(req.params.id, req.body);
		if (updatedProduct) res.redirect(`../${req.params.id}`);
		else res.send("Something went wrong!");
	} catch (error) {
		throwServerError(res, error);
	}
});