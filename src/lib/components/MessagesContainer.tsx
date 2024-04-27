"use server"
import Messages from "@/lib/components/Messages";
import { dbClient } from "@/lib/db/db";
import { conversationsTable, messagesTable } from "@/lib/db/schema";
import { getTableColumns, asc } from "drizzle-orm";
import { eq } from "drizzle-orm/sqlite-core/expressions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendMessage } from "../actions";

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


    //https://github.com/remarkjs/react-markdown/issues/785#issuecomment-1966495891
    messages.forEach((message)=>{
        message.content = message.content.replace(
            /\\\[(.*?)\\\]/gs,
            (_, equation) => `$$${equation}$$`,
        );

        message.content = message.content.replace(
            /\\\((.*?)\\\)/gs,
            (_, equation) => `$${equation}$`
        )
    })

    return (
        <Messages messages={messages}/>
    )
}