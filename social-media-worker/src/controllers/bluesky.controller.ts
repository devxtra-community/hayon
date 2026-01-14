import { BskyAgent } from "@atproto/api";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

export const postToBluesky = async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken, did, handle, content } = req.body;

    const agent = new BskyAgent({
      service: "https://bsky.social",
    });

    // ✅ restore session properly
    await agent.resumeSession({
      accessJwt: accessToken,
      refreshJwt: refreshToken,
      did,
      handle,
      active: true,
    });

    await agent.post({
      text: content,
      createdAt: new Date().toISOString(),
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};




//     const response = await fetch(
//   "https://bsky.social/xrpc/com.atproto.repo.createRecord",
//   {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       repo: bid,
//       collection: "app.bsky.feed.post",
//       record: {
//         text: content,
//         createdAt: new Date().toISOString(),
//       },
//     }),
//   }
// );
//    console.log("Bluesky response status:", response.status);
//     res.status(200).json(response);


export const postToBlueskyWithImage = async (
  req: Request,
  res: Response
) => {
  try {
    const { content, did, handle, accessJwt, refreshJwt } = req.body;
    const file = req.file;
    // console.log("Receivedbody:", req.body);

    if (!file) {
      return res.status(400).json({ error: "Image is required" });
    }

    // 🔹 Fetch from DB (DO NOT trust client)
    

    const agent = new BskyAgent({
      service: "https://bsky.social",
    });


    

    // ✅ Restore session (CORRECT)
    await agent.resumeSession({
      accessJwt,
      refreshJwt,
      did,
      handle,
      active: true,
    });

    // ✅ Upload image
    const uploadRes = await agent.uploadBlob(file.buffer, {
      encoding: file.mimetype, // image/jpeg | image/png
    });


    // ✅ Post with image
   const datat = await agent.post({
      text: content,
      createdAt: new Date().toISOString(),
      embed: {
        $type: "app.bsky.embed.images",
        images: [
          {
            image: uploadRes.data.blob,
            alt: content || "Uploaded image",
          },
        ],
      },
    });

    res.json({ success: datat});
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
