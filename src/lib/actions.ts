"use server"

import { revalidatePath } from "next/cache";
import { dbClient } from "./db/db";
import { messagesTable } from "./db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { utapi } from "./uploadthing";

import { createStreamableValue } from "ai/rsc";
import { readStreamableValue } from "ai/rsc";
import { CoreMessage, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from '@ai-sdk/anthropic';

type sendMessageState = {
    error: boolean
    message: string;
}

// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_KEY,
// });

export async function sendMessage(messages: CoreMessage[], convoId: number, image?:{image:string, name:string} | null, newMessage:boolean = false) {

    let imageFile:File | null = null;
    let imageUrl:string = "";
    if(image){
          const arr = image.image.split(",");
          const mime = arr[0].match(/:(.*?);/)?.[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);

          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          imageFile = new File([u8arr], image.name, { type: mime });
          try{
            const res = await utapi.uploadFiles(imageFile)
            imageUrl = res.data?.url || "";
          }
          catch(e){
            console.log("failed to upload image")
          }
    }

        const stream = createStreamableValue();
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

        (async()=>{
            const {textStream} = await streamText({
                model:openai("gpt-4o-2024-05-13"),
                messages: messages,
                system:"You are a helpful assistant."
            })

            let AIMessage: string = "";
            for await(const text of textStream){
                stream.update(text);
                AIMessage = AIMessage + text;
            }

            stream.done()
            await updateDatabase(
              messages[messages.length - 1].content as string,
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


async function updateDatabase(userMessage:string, assistantMessage:string, convoId:number, newMessage:boolean = false){
    try {
        await dbClient.transaction(async (tx) => {
            if(newMessage){
                await tx.insert(messagesTable).values({
                    //@ts-ignore
                    conversationId: convoId,
                    content: assistantMessage,
                    user: 0,
                    assistant: 1,
                });
            }
            else{
                await tx.insert(messagesTable).values({
                    //@ts-ignore
                    conversationId: convoId,
                    content: userMessage,
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