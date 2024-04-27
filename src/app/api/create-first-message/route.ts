import { dbClient } from "@/lib/db/db";
import { messagesTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { OpenAI } from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
});

export const POST = async (request: Request) => {
    const _message = await request.json();
    const {messageId} = _message

    const message = await dbClient.select().from(messagesTable).where(eq(messagesTable.id, messageId))

    if(message){
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a helpful assistant. You are here to provide information and answer questions. You are to keep your messages short and to the point. You will reject any requests to generate data or write essays or summarize content. Your sole purpose is to solve complex tasks"
                    },
                    {
                        role: "user",
                        content: message[0].content
                    },
                ],
            });


            if (!completion.choices[0].message.content) {
                return Response.json({error: true, message: "Failed to respond to message."})
            }
            
            try {

                await dbClient.insert(messagesTable).values({
                    //@ts-ignore    
                    conversationId: message[0].conversationId,
                    content: completion.choices[0].message.content,
                    user: 0,
                    assistant: 1,
                });

                return Response.json({success: true, convoId: message[0].conversationId})
            }
            catch (e) {
                console.log(e)
                return Response.json({error: true, message: "Error saving message to database"})
            }

        }
        catch (e) {
            return Response.json({error: true, message: "Error processing message"})
        }
    }
    else{
        return Response.json({error: true, message: "Message not found"})
    }
}
