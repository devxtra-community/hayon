// src/services/image.service.ts

export type GeminiPart =
  | {
      inlineData: {
        mimeType: string;
        data: string;
      };
    }
  | {
      text: string;
    };

function parseBase64Image(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);

  if (!match) return null;

  return {
    mimeType: match[1],
    data: match[2],
  };
}

export function buildImageParts(media: string[]): GeminiPart[] {
  return media
    .map(parseBase64Image)
    .filter(Boolean)
    .map((img: any) => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.data,
      },
    }));
}
