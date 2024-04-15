"use server"
import Messages from "@/lib/components/messages";
import { dbClient } from "@/lib/db/db";
import { conversationsTable, messagesTable } from "@/lib/db/schema";
import { getTableColumns, asc } from "drizzle-orm";
import { eq } from "drizzle-orm/sqlite-core/expressions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type props = {
    params:{
        id: string
    },
    searchParams: { [key: string]: string | undefined } 
}

export default async function MessagesContainer(props: props){
    const messages = await dbClient
    .select({
        ...getTableColumns(messagesTable),
    })
    .from(messagesTable)
    .where(eq(conversationsTable.id, parseInt(props.params.id)))
    .leftJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
    .orderBy(asc(messagesTable.createdAt));


    if(props.searchParams["new"] && props.searchParams["message"]){
        const messageId = props.searchParams["message"];
        const messageContent = await dbClient.select({content: messagesTable.content}).from(messagesTable).where(eq(messagesTable.id, parseInt(messageId!)));
        const req = await fetch("http://localhost:3000/api/message", {
            method: "POST",
            body: JSON.stringify({ content: messageContent[0].content, conversation: props.params.id, new:true}),
            headers: {
                "Content-Type": "application/json",
            },
        });

        const res = await req.json();

        if(res.success){
            revalidatePath(`/chat/${props.params.id}`);
            revalidatePath("/")
            redirect(`/chat/${props.params.id}`);
        }
    }

    return (
        <Messages messages={messages}/>
    )
}