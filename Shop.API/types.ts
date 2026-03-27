import { IAuthRequisites, IComment, IImage, IProduct, IProductFilterPayload } from "@Shared/types";
import { RowDataPacket } from "mysql2";

export interface ICommentEntity extends RowDataPacket {
    comment_id: string;
    name: string;
    email: string;
    body: string;
    product_id: string;
}

export type CommentCreatePayload = Omit<IComment, "id">;

export interface IImageEntity extends IImage, RowDataPacket {
    product_id: string;
}

export interface IProductEntity extends IProduct, RowDataPacket {
    product_id: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IProductSearchFilter extends IProductFilterPayload { }

export type ProductCreatePayload = Omit<IProduct, "id" | "comments">;
export type ProductPatchPayload = Pick<IProduct, "title" | "description" | "price">;

export interface IUserRequisitesEntity extends IAuthRequisites, RowDataPacket {
    id: number;
}