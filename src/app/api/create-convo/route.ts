import { validateRequest } from "@/lib/auth/auth";
import { dbClient } from "@/lib/db/db";
import { conversationsTable, messagesTable } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import OpenAI from "openai";

const openai = new OpenAI({
apiKey: process.env.OPENAI_KEY,
});

export const POST = async (request: Request) => {
    const { user } = await validateRequest();
    if (!user) {
      return redirect("/login");
    }
    
    const data = await request.json();
    const message = data.content;

    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content:
                    "The message you are going to receive is the first question to a conversation. Summarize the message into a maximum of 8 words and make sure it covers the topic of the upcoming conversation",
            },
            {
                role: "user",
                content: message as string,
            },
        ],
    });

    const convoTopic = completion.choices[0].message.content;

    if(!convoTopic) return Response.json({ message: "Error creating conversation" });

    try{
        const newRow = await dbClient.insert(conversationsTable).values({
            description: convoTopic,
            userId: user.id,
        }).returning({ newId: conversationsTable.id })

        const newMessage = await dbClient.insert(messagesTable).values({
            //@ts-ignore
            // dunno why this is erroring
            conversationId: newRow[0].newId,
            content: message,
            user: 1,
            assistant: 0,
        }).returning({ newId: messagesTable.id })

        revalidatePath("/", "layout");
        return Response.json({ success: true, id: newRow[0].newId, newMessageId: newMessage[0].newId});
    }
    catch(err){
        return Response.json({ message: "Error creating conversation" });
    }

}