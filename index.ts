// @ts-ignore
import libheif from "libheif-js";

const uint8ArrayUtf8ByteString = (
  array: Buffer,
  start: number,
  end: number
) => {
  return String.fromCharCode(...array.slice(start, end));
};

// brands explained: https://github.com/strukturag/libheif/issues/83
// code adapted from: https://github.com/sindresorhus/file-type/blob/6f901bd82b849a85ca4ddba9c9a4baacece63d31/core.js#L428-L438
export const isHeic = (buffer: Buffer) => {
  const brandMajor = uint8ArrayUtf8ByteString(buffer, 8, 12)
    .replace("\0", " ")
    .trim();

  switch (brandMajor) {
    case "mif1":
      return true; // {ext: 'heic', mime: 'image/heif'};
    case "msf1":
      return true; // {ext: 'heic', mime: 'image/heif-sequence'};
    case "heic":
    case "heix":
      return true; // {ext: 'heic', mime: 'image/heic'};
    case "hevc":
    case "hevx":
      return true; // {ext: 'heic', mime: 'image/heic-sequence'};
  }

  return false;
};

const decodeImage = async (image: any) => {
  const width = image.get_width();
  const height = image.get_height();

  const arrayBuffer = await new Promise((resolve, reject) => {
    image.display(
      { data: new Uint8ClampedArray(width * height * 4), width, height },
      (displayData: { data: { buffer: unknown } }) => {
        if (!displayData) {
          return reject(new Error("HEIF processing error"));
        }

        // get the ArrayBuffer from the Uint8Array
        resolve(displayData.data.buffer);
      }
    );
  });

  return { width, height, data: arrayBuffer };
};

const decodeBuffer = async ({
  buffer,
  all,
}: {
  buffer: Buffer;
  all: boolean;
}) => {
  if (!isHeic(buffer)) {
    throw new TypeError("input buffer is not a HEIC image");
  }

  const decoder = new libheif.HeifDecoder();
  // @ts-ignore
  const data = decoder.decode(buffer);

  if (!data.length) {
    throw new Error("HEIF image not found");
  }

  if (!all) {
    return await decodeImage(data[0]);
  }

  return data.map((image: any) => {
    return {
      decode: async () => await decodeImage(image),
    };
  });
};

export default decodeBuffer;
