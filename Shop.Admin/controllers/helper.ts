import { Response } from "express";

export const throwServerError = (res: Response, error: Error) => {
    console.debug(error.message);
    res.status(500);
    res.send("Something went wrong");
};