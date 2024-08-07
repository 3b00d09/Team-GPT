import Link from "next/link"
import { dbClient } from "../db/db"
import { conversationsTable } from "../db/schema"
import { desc, eq } from "drizzle-orm"
import { validateRequest } from "../auth/auth";
import { redirect } from "next/navigation";

export default async function Conversations(){

    const { user } = await validateRequest();
    if (!user) {
      return redirect("/login");
    }
    
    const conversations = await dbClient.select().from(conversationsTable).orderBy(desc(conversationsTable.createdAt)).where(eq(conversationsTable.userId, user.id));
    
    return(
        <div className="w-[12%] bg-[#171717] overflow-y-scroll scrollbar-hidden">
            <div className="flex justify-between items-center p-4">
                <Link href="/">Team GPT </Link>
            </div>

            <div className="mt-12 grid gap-2">
                {conversations.map((conversation, index) => {
                    return(
                        <Link key={index} href={`/chat/${conversation.id}`} className=" border-b p-2 hover:bg-[#212121]">
                            {conversation.description} 
                        </Link>
                    )
                }
                )}
            </div>
        </div>
    )
}