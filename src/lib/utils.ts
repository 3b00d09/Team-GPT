import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { fileDataType } from "./types";

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

// export async function convertFileToBinaryBuffer(file: File): Promise<fileDataType> {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.readAsArrayBuffer(file);  
    
//     reader.onload = () => {
//       if (!reader.result) {
//         reject(new Error("Failed to read file"));
//         return;
//       }
      
//       resolve({
//         url: Buffer.from(reader.result as ArrayBuffer),
//         mimeType: file.type 
//       });
//     };
    
//     reader.onerror = (error) => reject(error);
//   });
// }


export function imageBase64ToFile(image: { image: string; name: string }) {
  const [header, base64Data] = image.image.split(",");
  const mime = header.match(/:(.*?);/)?.[1];

  if (!mime) {
    throw new Error("Invalid MIME type");
  }

  const binaryData = Buffer.from(base64Data, "base64");
  return new File([binaryData], image.name, { type: mime });

}

export const allowedFileTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",

];


export const prompt = `
  You are an advanced AI assistant specializing in programming and mathematics. When solving problems:

  1. Think step-by-step through complex problems before providing solutions
  2. Break down programming tasks into clear, logical components
  3. Include code examples and explanations that demonstrate best practices
  4. For mathematical problems, show your work and explain your reasoning
  5. If a problem has multiple approaches, explain the tradeoffs between them
  6. When reviewing code, consider:
    - Time and space complexity
    - Edge cases
    - Error handling
    - Code organization and maintainability
    - Performance implications

  If you're uncertain about any aspect of a problem:
  - Clearly state your assumptions
  - Explain which parts you're uncertain about
  - Ask clarifying questions before proceeding

  When providing code solutions:
  - Include comments explaining complex logic
  - Use consistent formatting and naming conventions
  - Consider the context and ecosystem of the target platform
  - Highlight any potential security concerns or pitfalls

  Keep responses focused and technical. Avoid unnecessary small talk or overly verbose explanations unless specifically requested. If you're unsure about specific implementation details, acknowledge this and suggest ways to verify or research the correct approach.

  For debugging problems:
  1. First identify the specific issue or error
  2. Consider common causes
  3. Suggest debugging steps
  4. Provide potential solutions with explanations

  Use markdown for code formatting. Format mathematical expressions clearly and consistently.
`;