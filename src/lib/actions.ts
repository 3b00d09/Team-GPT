"use server"

import { revalidatePath } from "next/cache";
import { dbClient } from "./db/db";
import { messagesTable } from "./db/schema";
import { utapi } from "./uploadthing";

import { createStreamableValue } from "ai/rsc";
import { CoreMessage, ImagePart, streamText, UserContent } from "ai";
import { openai } from "@ai-sdk/openai";
import { messageRow } from "./db/schemaTypes";


// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_KEY,
// });

export async function sendMessage(messages: messageRow[], convoId: number, image?:{image:string, name:string} | null, newMessage:boolean = false) {

    let imageUrl: URL | null = null
    let imageFile: File | null = null;
    const coreMessages: CoreMessage[] = messages.map((message) => {
        return {
            content: message.content,
            role: message.user ? "user" : "assistant",
        }
    }
    )

    if (image && image.image) {
        try {
            const [header, base64Data] = image.image.split(",");
            const mime = header.match(/:(.*?);/)?.[1];

            if (!mime) {
                throw new Error("Invalid MIME type");
            }

            const binaryData = Buffer.from(base64Data, "base64");
            imageFile = new File([binaryData], image.name, { type: mime });

            const res = await utapi.uploadFiles(imageFile);
            if(res.data && res.data.url) imageUrl = new URL(res.data.url);
        } 
        catch (e) {
            console.error("Failed to upload image:", e);
        }
    }

        // this array of content will hold the image for us in case we have one
        const customContent : ImagePart[] = [];

        if(imageUrl){
            customContent.push({ type: "image" , image: imageUrl});
        }
        const stream = createStreamableValue();
        (async()=>{
            const { textStream } = await streamText({
              model: openai("gpt-4o-2024-05-13"),
              messages: [
                ...coreMessages,
                {
                  role: "user",
                  content: [...customContent],
                },
              ],
              system: "You are a helpful assistant.",
            });

            let AIMessage: string = "";
            for await(const text of textStream){
                stream.update(text);
                AIMessage = AIMessage + text;
            }

            stream.done()
            await updateDatabase(
              messages[messages.length - 1].content as string,
              imageUrl ? imageUrl.href : "",
              AIMessage,
              convoId,
              newMessage
            );
            revalidatePath(`/chat/${convoId}`)
        })();

    
         return{
            newMessage: stream.value
         } 

}


async function updateDatabase(userMessage:string, imageUrl:string, assistantMessage:string, convoId:number, newMessage:boolean = false){
    try {
        await dbClient.transaction(async (tx) => {
            if(newMessage){
                await tx.insert(messagesTable).values({
                    //@ts-ignore
                    conversationId: convoId,
                    content: assistantMessage,
                    imageUrl: imageUrl,
                    user: 0,
                    assistant: 1,
                });
            }
            else{
                await tx.insert(messagesTable).values({
                  //@ts-ignore
                  conversationId: convoId,
                  content: userMessage,
                  imageUrl: imageUrl,
                  user: 1,
                  assistant: 0,
                });
                await tx.insert(messagesTable).values({
                    //@ts-ignore
                    conversationId: convoId,
                    content: assistantMessage,
                    user: 0,
                    assistant: 1,
                });
            }
        });
        revalidatePath(`/chat/${convoId}`);
    } 
    
    catch (e) {
        console.log("error saving to database")
    }
}

// (async()=>{
//     const { textStream } = await streamText({
//       model: anthropic("claude-3-opus-20240229"),
//       messages: messages,
//         system: "You are a helpful assistant.",
//     });

//     let AIMessage: string = "";
//     for await(const text of textStream){
//         stream.update(text);
//         AIMessage = AIMessage + text;
//     }

//     stream.done()
//     await updateDatabase(
//       messages[messages.length - 1].content as string,
//       AIMessage,
//       convoId,
//       newMessage
//     );
// })();