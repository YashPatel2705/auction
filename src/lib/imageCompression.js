const MB = 1024 * 1024;

export const MAX_INPUT_BYTES = 10 * MB;
export const MAX_OUTPUT_BYTES = 2 * MB;
const INITIAL_MAX_DIMENSION = 1600;
const DIMENSION_STEPS = [1600, 1400, 1200, 1000, 900, 800, 720, 640];
const QUALITY_STEPS = [0.9, 0.82, 0.74, 0.66, 0.58, 0.5, 0.42, 0.34];
const SUPPORTED_OUTPUT_TYPES = ["image/webp", "image/jpeg"];

function getFileExtensionFromMime(mimeType) {
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  return "bin";
}

function getOutputMimePriority() {
  const canvas = document.createElement("canvas");
  const probe = canvas.toDataURL("image/webp", 0.8);
  if (probe.startsWith("data:image/webp")) {
    return ["image/webp", "image/jpeg"];
  }
  return ["image/jpeg"];
}

function parseImageFile(file) {
  if (!(file instanceof File)) {
    throw new Error("Please select an image file.");
  }

  if (!file.type || !file.type.startsWith("image/")) {
    throw new Error("Unsupported file type. Use an image file.");
  }

  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Image too large. Max source size is 10MB.");
  }

  return file;
}

async function loadImageSource(file) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: (ctx, width, height) =>
          ctx.drawImage(bitmap, 0, 0, width, height),
        close: () => bitmap.close(),
      };
    } catch {
      // Fallback to Image element below.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Failed to read image."));
      image.src = objectUrl;
    });

    return {
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      draw: (ctx, width, height) => ctx.drawImage(img, 0, 0, width, height),
      close: () => {},
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function computeTargetDimensions(width, height, maxDimension) {
  if (!width || !height) {
    throw new Error("Invalid image dimensions.");
  }
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const scale = Math.min(maxDimension / width, maxDimension / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Unable to initialize image processor.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { canvas, ctx };
}

async function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Image encode failed."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

function makeOutputFile(blob, originalName, mimeType) {
  const ext = getFileExtensionFromMime(mimeType);
  const baseName = originalName.replace(/\.[^.]+$/, "") || "photo";
  const name = `${baseName}.${ext}`;
  return new File([blob], name, { type: mimeType });
}

/**
 * Compress image under 2MB, preferring webp when supported.
 * @param {File} rawFile
 * @returns {Promise<{ file: File; mimeType: string; bytes: number; width: number; height: number; quality: number; attempts: number; sourceBytes: number }>}
 */
export async function compressImageToTarget(rawFile) {
  const file = parseImageFile(rawFile);
  const image = await loadImageSource(file);

  const mimePriority = getOutputMimePriority().filter((type) =>
    SUPPORTED_OUTPUT_TYPES.includes(type),
  );

  let bestCandidate = null;
  let attempts = 0;

  try {
    for (const maxDimension of DIMENSION_STEPS) {
      const dimensionCap = Math.min(maxDimension, INITIAL_MAX_DIMENSION);
      const { width, height } = computeTargetDimensions(
        image.width,
        image.height,
        dimensionCap,
      );
      const { canvas, ctx } = createCanvas(width, height);
      image.draw(ctx, width, height);

      for (const mimeType of mimePriority) {
        for (const quality of QUALITY_STEPS) {
          attempts += 1;
          let blob;
          try {
            blob = await canvasToBlob(canvas, mimeType, quality);
          } catch {
            continue;
          }

          const candidate = {
            blob,
            mimeType,
            bytes: blob.size,
            width,
            height,
            quality,
          };

          if (!bestCandidate || candidate.bytes < bestCandidate.bytes) {
            bestCandidate = candidate;
          }

          if (candidate.bytes <= MAX_OUTPUT_BYTES) {
            return {
              file: makeOutputFile(blob, file.name, mimeType),
              mimeType,
              bytes: blob.size,
              width,
              height,
              quality,
              attempts,
              sourceBytes: file.size,
            };
          }
        }
      }
    }
  } finally {
    image.close();
  }

  if (bestCandidate) {
    throw new Error(
      `Could not compress under 2MB. Best result was ${(
        bestCandidate.bytes /
        (1024 * 1024)
      ).toFixed(2)}MB.`,
    );
  }

  throw new Error("Could not compress image. Try a different photo.");
}
