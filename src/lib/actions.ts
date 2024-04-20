"use server"

import { revalidatePath } from "next/cache";
import { dbClient } from "./db/db";
import { messagesTable } from "./db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

type sendMessageState = {
    error: boolean
    message: string;
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
});

export async function sendMessage(state: sendMessageState, formData: FormData): Promise<sendMessageState> {
    const message = formData.get("message");
    const conversationId = formData.get("conversation");
    const image = formData.get("image") as File;

    if (message && conversationId) {
        const convoId = parseInt(conversationId.toString());
        // to optimize later
        const chatHistory = await dbClient.select().from(messagesTable).where(eq(messagesTable.conversationId, convoId))
        
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4-turbo",
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a helpful assistant. You are here to provide information and answer questions. You are to keep your messages short and to the point. You will reject any requests to generate data or write essays or summarize content. Your sole purpose is to solve complex tasks"
                    },
                    {
                        role: "system",
                        content: "The following is the current conversation history. Use it to assist in your response. \n" + chatHistory.map((message) => message.content).join("\n") + "\n"
                    },
                    {
                        role: "user",
                        content: [{
                            type: "image_url",
                            image_url: {
                                url: image ? "https://ikcxvcutdjftdsvbpwsa.supabase.co/storage/v1/object/public/test2/image_9cb62926-1623-4c38-91e7-f6d9b06daa49.JPG" : "",
                            }

                        }]
                    },
                    {
                        role: "user",
                        content: message as string,
                    },
                ],
            });


            if (!completion.choices[0].message.content) {
                state.error = true;
                state.message = "Failed to respond to message."
                return state;
            }
            try {
                await dbClient.transaction(async (tx) => {
                    await tx.insert(messagesTable).values({
                        //@ts-ignore
                        conversationId: convoId,
                        content: message,
                        user: 1,
                        assistant: 0,
                    });
                    await tx.insert(messagesTable).values({
                        //@ts-ignore    
                        conversationId: convoId,
                        content: completion.choices[0].message.content,
                        user: 0,
                        assistant: 1,
                    });
                })
                revalidatePath(`/chat/${conversationId}`);
                return {
                    error: false,
                    message: ""

                }
            }
            catch (e) {

                state.error = true;
                state.message = "Error saving message to database";
                return state;
            }

        }
        catch (e) {
            console.log(e)
            return{
                error: true,
                message: "Error processing message"
            }
        }

    }

    else {
        return {
            error: true,
            message: "No message provided"
        }
    }

}