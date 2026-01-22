import { Request, Response } from "express";
import { SuccessResponse, ErrorResponse } from "../utils/responses";
import logger from "../utils/logger";
import * as postRepository from "../repositories/post.repository";
export const createPost = async (req: Request, res: Response) => {
    try {
        if (!req.auth) {
            return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
        }
        return new ErrorResponse("Not implemented", { status: 501 }).send(res);
    } catch (error) {
        logger.error("Create post error", error);
        return new ErrorResponse("Failed to create post").send(res);
    }
};

export const getPostStatus = async (req: Request, res: Response) => {
    try {
        if (!req.auth) {
            return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
        }
        const { postId } = req.params;
        const userId = req.auth.id;
        const post = await postRepository.findById(postId);

        if (!post) {
            return new ErrorResponse("Post not found", { status: 404 }).send(res);
        }

        // Security check: ensure the post belongs to the user
        if (post.userId.toString() !== userId) {
            return new ErrorResponse("Unauthorized", { status: 403 }).send(res);
        }

        return new SuccessResponse("Post status fetched", {
            data: {
                postId: post._id,
                status: post.status,
                platformStatuses: post.platformStatuses,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt
            }
        }).send(res);
    } catch (error) {
        logger.error("Get post status error", error);
        return new ErrorResponse("Failed to get post status").send(res);
    }
};

export const getUserPosts = async (req: Request, res: Response) => {
    try {
        if (!req.auth) {
            return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
        }
        return new ErrorResponse("Not implemented", { status: 501 }).send(res);
    } catch (error) {
        logger.error("Get user posts error", error);
        return new ErrorResponse("Failed to get posts").send(res);
    }
};

export const cancelPost = async (req: Request, res: Response) => {
    try {
        if (!req.auth) {
            return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
        }
        return new ErrorResponse("Not implemented", { status: 501 }).send(res);
    } catch (error) {
        logger.error("Cancel post error", error);
        return new ErrorResponse("Failed to cancel post").send(res);
    }
};

export const retryPost = async (req: Request, res: Response) => {
    try {
        if (!req.auth) {
            return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
        }
        return new ErrorResponse("Not implemented", { status: 501 }).send(res);
    } catch (error) {
        logger.error("Retry post error", error);
        return new ErrorResponse("Failed to retry post").send(res);
    }
};

export const getUploadUrls = async (req: Request, res: Response) => {
    try {
        if (!req.auth) {
            return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
        }
        return new ErrorResponse("Not implemented", { status: 501 }).send(res);
    } catch (error) {
        logger.error("Get upload URLs error", error);
        return new ErrorResponse("Failed to generate upload URLs").send(res);
    }
};

export const deleteMedia = async (req: Request, res: Response) => {
    try {
        if (!req.auth) {
            return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
        }
        return new ErrorResponse("Not implemented", { status: 501 }).send(res);
    } catch (error) {
        logger.error("Delete media error", error);
        return new ErrorResponse("Failed to delete media").send(res);
    }
};
