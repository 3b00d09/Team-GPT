import { validateRequest } from "@/lib/auth/auth";
import { dbClient } from "@/lib/db/db";
import { conversationsTable, messagesTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const GET = async (request: Request, {params}:{params:{id:string}}) => {
    const { user } = await validateRequest();
    if (!user) return redirect("/login");
    
    const conversation = await dbClient.select({authorId:conversationsTable.userId}).from(conversationsTable).where(eq(conversationsTable.id, parseInt(params.id)))
    if(conversation[0].authorId != user.id){
        return Response.json({error:true, message:"Unauthorized Action."})
    }
    
    try{
        await dbClient.delete(conversationsTable).where(eq(conversationsTable.id, parseInt(params.id)))
        revalidatePath("/", "layout")
        return Response.json({success:true, message:"Conversation Deleted Successfully."})
    }
    catch(e){
        console.log(e)
        return Response.json({error: true, message: "Something went wrong. Please try again later."})
    }

}