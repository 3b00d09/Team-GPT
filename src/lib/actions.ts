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

type sendMessageState = {
    error: boolean
    message: string;
}

// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_KEY,
// });

export async function sendMessage(messages: CoreMessage[], convoId: number, image?:File | null) {
    //const image = formData.get("image") as File;

        // if(image && image.name !== ""){
        //     try{
        //         const res = await utapi.uploadFiles(image)
        //         console.log(res)
        //     }
        //     catch(e){
        //         console.log("failed to upload image")
        //     }
        // }

        const stream = createStreamableValue();
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
              convoId
            );
            revalidatePath(`/chat/${convoId}`)
        })();

    
         return{
            newMessage: stream.value
         } 

}


async function updateDatabase(userMessage:string, assistantMessage:string, convoId:number){
    try {
        await dbClient.transaction(async (tx) => {
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
        });
    } 
    
    catch (e) {
        console.log("error saving to database")
    }
}