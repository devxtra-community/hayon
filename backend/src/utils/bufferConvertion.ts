function parseBase64Image(dataString: string) {
  const matches = dataString.match(/^data:(image\/\w+);base64,(.+)$/);

  if (!matches) {
    throw new Error("Invalid base64 image");
  }

  return {
    contentType: matches[1],
    buffer: Buffer.from(matches[2], "base64"),
  };
}
export { parseBase64Image };
