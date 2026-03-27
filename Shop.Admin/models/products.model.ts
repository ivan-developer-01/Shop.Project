import axios from "axios";
import { IProduct, IProductFilterPayload } from "@Shared/types";
import { IProductEditData } from "Shop.Admin/types";
import { API_HOST } from "./const";

export async function getProducts(): Promise<IProduct[]> {
	const { data } = await axios.get<IProduct[]>(`${API_HOST}/products`);
	return data || [];
}

export async function getProduct(
	id: string
): Promise<IProduct | null> {
	try {
		const { data } = await axios.get<IProduct>(
			`${API_HOST}/products/${id}`
		);
		return data;
	} catch {
		return null;
	}
}

export async function searchProducts(
	filter: IProductFilterPayload
): Promise<IProduct[]> {
	const { data } = await axios.get<IProduct[]>(
		`${API_HOST}/products/search`,
		{ params: filter }
	);
	return data || [];
}

export async function removeProduct(id: string): Promise<void> {
	await axios.delete(`${API_HOST}/products/${id}`);
}

export async function updateProduct(
	productId: string,
	formData: IProductEditData
): Promise<IProduct | null> {
	try {
		const promises: Promise<unknown>[] = [];
		const { data: currentProduct } = await axios.get<IProduct>(`${API_HOST}/products/${productId}`);

		if (formData.commentsToRemove) {
			if (typeof formData.commentsToRemove === "string")
				formData.commentsToRemove = [formData.commentsToRemove];
			for (const commentId of formData.commentsToRemove) {
				promises.push(axios.delete(`${API_HOST}/comments/${commentId}`));
			}
		}

		if (formData.imagesToRemove) {
			if (typeof formData.imagesToRemove === "string")
				formData.imagesToRemove = [formData.imagesToRemove];
			promises.push(axios.post(
				`${API_HOST}/products/delete-images/${productId}`,
				formData.imagesToRemove
			));
		}

		if (formData.newImages) {
			// превратите строку newImages в массив строк, разделитель это перенос строки или запятая
			// для добавления изображений используйте Products API "add-images" метод
			const splitArray = formData.newImages
				.replace(/ /g, "")
				.split(/[(\r\n)|(,)]/)
				.filter(Boolean);
			const currentThumbnail = currentProduct.thumbnail;
			const payload = splitArray.map((imageUrl, i) => ({
				url: imageUrl,
				main: currentThumbnail ? false : (i === 0)
			}));
			if (splitArray.length) {
				promises.push(axios.post(
					`${API_HOST}/products/add-images/${productId}`,
					payload
				));
			}
		}

		if (formData.mainImage && formData.mainImage !== currentProduct?.thumbnail?.id) {
			// если при редактировании товара было выбрано другое изображение для обложки,
			// то нужно обратиться к Products API "update-thumbnail" методу
			promises.push(axios.post(
				`${API_HOST}/products/update-thumbnail/${productId}`,
				{ id: formData.mainImage }
			));
		}

		// обращаемся к Products API методу PATCH для обновления всех полей, которые есть в форме
		// в ответ получаем обновленный товар и возвращаем его из этой функции
		promises.push(axios.patch(
			`${API_HOST}/products/${productId}`,
			{
				title: formData.title,
				description: formData.description,
				price: formData.price
			}
		));

		const promiseResults = await Promise.all(promises);
		return promiseResults[promiseResults.length - 1] as IProduct;
	} catch (error) {
		console.log(error);
	}
}