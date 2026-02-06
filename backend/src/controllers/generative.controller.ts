import { ENV } from "../config/env";
import { GoogleGenAI } from "@google/genai";
import { ErrorResponse, SuccessResponse } from "../utils/responses";
import logger from "../utils/logger";
import { Request, Response } from "express";
import { buildPlatformPrompt } from "../ai/prompts";
import { buildImageParts } from "../services/image.service";

export const generateCaptions = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
    }

    const { prompt, media } = req.body;

    const textPrompt = `
        You are a professional social media content creator.

        User intent (optional):
        ${prompt || "Not provided"}

        Task:
        Analyze the provided image(s).

        Generate:

        - One engaging Instagram caption (2–3 short lines max).
        - Use the user intent if provided.
        - Match the vibe of the image.
        - Sound natural and human.

        Then generate:
        - 5 relevant niche hashtags based on the image.
        - 3 general Instagram hashtags.

        Rules:
        - No emojis.
        - No markdown.
        - No explanations.
        - Do NOT include labels like "Caption:" or "Hashtags:".
        - Return plain text only.

        Output format:

        <caption text>

        #tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8
        `;

    const imageParts = buildImageParts(media);

    imageParts.push({
      text: textPrompt,
    });

    const GenAi = new GoogleGenAI({
      apiKey: ENV.GEMINI.API_KEY,
    });

    const result = await GenAi.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: imageParts,
        },
      ],
    });

    // console.log("model result :", result);
    return new SuccessResponse("Captions generated successfully", { data: result }).send(res);
  } catch (error) {
    logger.error("Generate captions error", error);
    return new ErrorResponse("Failed to generate captions").send(res);
  }
};

export const generateCaptionsForSpecificPlatform = async (req: Request, res: Response) => {
  try {
    const { media, prompt } = req.body;
    const platform = req.params.platform;

    const promptText = await buildPlatformPrompt(platform, prompt);
    const imageParts = buildImageParts(media);

    imageParts.push({ text: promptText });

    const GenAi = new GoogleGenAI({
      apiKey: ENV.GEMINI.API_KEY,
    });

    const result = await GenAi.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: imageParts,
        },
      ],
    });

    return new SuccessResponse("Captions are generated", { data: result }).send(res);
  } catch (error) {
    logger.error(error);
    return new ErrorResponse("cannot create caption").send(res);
  }
};
