/**
 * Compresses an image file client-side to an optimized base64 JPEG data URL.
 * Keeps file sizes lightweight (~60-150KB) while maintaining sharp receipt readability.
 */
export async function compressImageToDataUrl(file: File, maxDimension = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selected file must be an image"))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Failed to read image file"))
    reader.onload = (event) => {
      const img = new Image()
      img.onerror = () => reject(new Error("Failed to load image element"))
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not initialize 2D canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality)
        resolve(compressedDataUrl)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}
