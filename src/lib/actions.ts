"use server"
type sendMessageState = {
    error: boolean
}
import { revalidatePath } from "next/cache";

export async function sendMessage(state: sendMessageState, formData: FormData): Promise<sendMessageState>{ 
    const message = formData.get("message");
    const conversationId = formData.get("conversation");
        if (message) {
            const req = await fetch("http://localhost:3000/api/message", {
                method: "POST",
                body: JSON.stringify({ content: message, conversation: conversationId, new:false}),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const data = await req.json();
            if(data.success){
                revalidatePath(`/chat/${conversationId}`);
                
                return{
                    error: false
                }
            }else{
                return{
                    error: true
                }
            }
        }
        return{
            error: true
        }
}