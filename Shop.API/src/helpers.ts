import { mapCommentEntity, mapImageEntity } from "./services/mapping";
import { CommentCreatePayload, ICommentEntity, IImageEntity, IProductSearchFilter } from "../types";
import { IComment, IImage, IProduct } from "@Shared/types";

const isEmpty = (obj: object) => Object.keys(obj).length === 0;
const isNullish = (value) => typeof value === "undefined" || value === null;

type CommentValidator = (comment: CommentCreatePayload) => string | null;
export const validateComment: CommentValidator = (comment: CommentCreatePayload) => {
	if (!comment || isEmpty(comment)) return "Comment is absent or empty";
	const requiredFields: Record<keyof CommentCreatePayload, string> = {
		"productId": "string",
		"name": "string",
		"email": "string",
		"body": "string"
	};

	for (const [field, type] of Object.entries(requiredFields)) {
		if (isNullish(comment[field])) return `Field ${field} is absent`;
		if (typeof comment[field] !== type) return `Field ${field} has wrong type`;
	}

	return null;
};

export const enhanceProductsComments = (
	products: IProduct[],
	commentRows: ICommentEntity[]
): IProduct[] => {
	const commentsByProductId = new Map<string, IComment[]>();

	for (const commentEntity of commentRows) {
		const comment = mapCommentEntity(commentEntity);
		if (!commentsByProductId.has(comment.productId)) {
			commentsByProductId.set(comment.productId, []);
		}

		const list = commentsByProductId.get(comment.productId);
		commentsByProductId.set(comment.productId, [...list, comment]);
	}

	for (const product of products) {
		if (commentsByProductId.has(product.id)) {
			product.comments = commentsByProductId.get(product.id);
		}
	}

	return products;
};

export const enhanceProductsImages = (
	products: IProduct[],
	imageRows: IImageEntity[]
): IProduct[] => {
	const imagesByProductId = new Map<string, IImage[]>();
	const thumbnailByProductId = new Map<string, IImage>();

	for (const imageEntity of imageRows) {
		const image = mapImageEntity(imageEntity);
		if (!imagesByProductId.has(image.productId)) {
			imagesByProductId.set(image.productId, []);
		}

		const list = imagesByProductId.get(image.productId);
		imagesByProductId.set(image.productId, [...list, image]);
	}

	for (const [productId, images] of imagesByProductId) {
		const targetThumbnail = getProductThumbnail(images);
		if (targetThumbnail) thumbnailByProductId.set(productId, getProductThumbnail(images));
	}

	for (const product of products) {
		if (imagesByProductId.has(product.id)) {
			product.images = imagesByProductId.get(product.id);
		}

		if (thumbnailByProductId.has(product.id)) {
			product.thumbnail = thumbnailByProductId.get(product.id);
		}
	}

	return products;
};

export const getProductThumbnail = (
	images: IImage[]
): IImage | null => {
	if (!images.length) return null;
	if (images.length === 1) return images[0];
	const targetThumbnail = images.find(image => image.main);
	if (targetThumbnail) return targetThumbnail;
	return images[0];
};

export const getProductsFilterQuery = (
	filter: IProductSearchFilter
): [string, string[]] => {
	const { title, description, priceFrom, priceTo } = filter;

	let query = "SELECT * FROM products WHERE ";
	const values = [];

	if (title) {
		query += "title LIKE ? ";
		values.push(`%${title}%`);
	}

	if (description) {
		if (values.length) {
			query += " OR ";
		}

		query += "description LIKE ? ";
		values.push(`%${description}%`);
	}

	if (priceFrom || priceTo) {
		if (values.length) {
			query += " OR ";

			query += `(price > ? AND price < ?)`;
			values.push(priceFrom || 0);
			values.push(priceTo || (999999 * 2.000003) * 4);
		}
	}

	return [query, values];
};