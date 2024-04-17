import { dbClient } from "@/lib/db/db";
import { messagesTable } from "@/lib/db/schema";
import OpenAI from "openai";
import { eq } from "drizzle-orm";

const openai = new OpenAI({
apiKey: process.env.OPENAI_KEY,
});

export const POST = async (request: Request) => {
    const data = await request.json();
    const message = data.content;
    const conversation = data.conversation;
    const newEntry = data.new;

    // to optimize later
    const chatHistory = await dbClient.select().from(messagesTable).where(eq(messagesTable.conversationId, conversation))

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
                content:"The following is the current conversation history. Use it to assist in your response. \n" + chatHistory.map((message)=> message.content).join("\n") + "\n"
            },
            {
                role: "user",
                content: message as string,
            },
            ],
    });

    if(!completion.choices[0].message.content) return Response.json({ message: "Error creating message" });
    
    try{
        await dbClient.transaction(async(tx)=>{

            if(!newEntry){
                await tx.insert(messagesTable).values({
                    //@ts-ignore
                    conversationId: conversation,
                    content: message,
                    user: 1,
                    assistant: 0,
                });
            }
       
            await tx.insert(messagesTable).values({
                //@ts-ignore    
                conversationId: conversation,
                content: completion.choices[0].message.content,
                user: 0,
                assistant: 1,
            });
        
        })

        return Response.json({success: true});
    }catch(err){
        return Response.json({ message: "Error creating message" });
    }
    
}