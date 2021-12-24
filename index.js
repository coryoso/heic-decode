"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeBuffer = exports.isHeic = void 0;
// @ts-ignore
const libheif_js_1 = __importDefault(require("libheif-js"));
const uint8ArrayUtf8ByteString = (array, start, end) => {
    return String.fromCharCode(...array.slice(start, end));
};
// brands explained: https://github.com/strukturag/libheif/issues/83
// code adapted from: https://github.com/sindresorhus/file-type/blob/6f901bd82b849a85ca4ddba9c9a4baacece63d31/core.js#L428-L438
const isHeic = (buffer) => {
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
exports.isHeic = isHeic;
const decodeImage = (image) => __awaiter(void 0, void 0, void 0, function* () {
    const width = image.get_width();
    const height = image.get_height();
    const arrayBuffer = yield new Promise((resolve, reject) => {
        image.display({ data: new Uint8ClampedArray(width * height * 4), width, height }, (displayData) => {
            if (!displayData) {
                return reject(new Error("HEIF processing error"));
            }
            // get the ArrayBuffer from the Uint8Array
            resolve(displayData.data.buffer);
        });
    });
    return { width, height, data: arrayBuffer };
});
const decodeBuffer = ({ buffer, all, }) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(0, exports.isHeic)(buffer)) {
        throw new TypeError("input buffer is not a HEIC image");
    }
    const decoder = new libheif_js_1.default.HeifDecoder();
    // @ts-ignore
    const data = decoder.decode(buffer);
    if (!data.length) {
        throw new Error("HEIF image not found");
    }
    if (!all) {
        return yield decodeImage(data[0]);
    }
    return data.map((image) => {
        return {
            decode: () => __awaiter(void 0, void 0, void 0, function* () { return yield decodeImage(image); }),
        };
    });
});
exports.decodeBuffer = decodeBuffer;
