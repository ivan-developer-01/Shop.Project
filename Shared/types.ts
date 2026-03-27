export interface IComment {
	productId: string;
	id: string;
	name: string;
	email: string;
	body: string;
}

export interface IImage {
	id: string;
	productId: string;
	main: boolean;
	url: string;
}

export interface IProduct {
	id: string;
	title: string;
	description: string;
	price: number;
	comments?: IComment[];
	images?: IImage[];
	thumbnail?: IImage;
}

export interface IProductFilterPayload {
	title?: string;
	description?: string;
	priceFrom?: number;
	priceTo?: number;
}

export interface IAuthRequisites {
	username: string;
	password: string;
}
