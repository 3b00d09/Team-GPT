import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function convertToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export function imageBase64ToFile(image: { image: string; name: string }) {
  const [header, base64Data] = image.image.split(",");
  const mime = header.match(/:(.*?);/)?.[1];

  if (!mime) {
    throw new Error("Invalid MIME type");
  }

  const binaryData = Buffer.from(base64Data, "base64");
  return new File([binaryData], image.name, { type: mime });

}