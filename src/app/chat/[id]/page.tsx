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


export default async function Page(props: props) {

    const messages = await dbClient
    .select({
        ...getTableColumns(messagesTable),
    })
    .from(messagesTable)
    .where(eq(conversationsTable.id, parseInt(props.params.id)))
    .leftJoin(conversationsTable, eq(messagesTable.conversationId, conversationsTable.id))
    .orderBy(asc(messagesTable.createdAt));


    if(props.searchParams["new"] === "true" && props.searchParams["message"]){
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

    
    async function sendMessage(formData: FormData) {
        "use server"
        const message = formData.get("message");
            if (message) {
                const req = await fetch("http://localhost:3000/api/message", {
                    method: "POST",
                    body: JSON.stringify({ content: message, conversation: props.params.id, new:false}),
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                const data = await req.json();
                if(data.success){
                    revalidatePath(`/chat/${props.params.id}`);
                }
            }
    }

    return(
        <div className="grid flex-1 grid-rows-[10fr_1fr] relative h-screen overflow-hidden">
            <div className="flex flex-col items-center mt-12 gap-8 overflow-auto">
                <Messages messages={messages}/>
            </div>
            <form className="self-end justify-self-center w-1/2 absolute bottom-0" action={sendMessage}>
                <input 
                    name="message"
                    className="w-full p-4 rounded-lg bg-transparent border border-slate-600" 
                    placeholder="Message ChatGPT..." 
                    type="text" 
                    >
                </input>
            </form>

        </div>
    )

}