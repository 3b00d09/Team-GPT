import Link from "next/link"
import { dbClient } from "../db/db"
import { conversationsTable } from "../db/schema"
import { desc } from "drizzle-orm"

export default async function Conversations(){
    
    const conversations = await dbClient.select().from(conversationsTable).orderBy(desc(conversationsTable.createdAt))
    
    return(
        <div className="w-[12%] bg-[#171717] p-4">
            <div className="flex justify-between items-center">
                <Link href="/">Team GPT </Link>
            </div>

            <div className="mt-12 grid gap-2">
                {conversations.map((conversation, index) => {
                    return(
                        <Link key={index} href={`/chat/${conversation.id}`} className="bg-red-900">
                            {conversation.description} 
                        </Link>
                    )
                }
                )}
            </div>
        </div>
    )
}