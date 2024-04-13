"use client"
import { useRef, useState } from "react";
import Messages from "../../lib/components/messages";
import { message } from "../../lib/types";


export default function ChatPage() {

    const inputref = useRef<HTMLInputElement>(null);
    const [conversation, setConversation] = useState<message[]>([]);

    return (
        <div className="grid flex-1 grid-rows-[10fr_1fr] relative h-screen overflow-hidden">
            <div className="flex flex-col items-center mt-12 gap-8 overflow-auto">
                <Messages messages={conversation}/>
            </div>
            <form className="self-end justify-self-center w-1/2 absolute bottom-0" action={sendMessage}>
                <input 
                    ref={inputref}
                    name="message"
                    className="w-full p-4 rounded-lg bg-transparent border border-slate-600" 
                    placeholder="Message ChatGPT..." 
                    type="text" 
                    >
                </input>
            </form>

        </div>
    );


async function sendMessage(formData: FormData) {
    const message = formData.get("message");
        if (message) {
            const req = await fetch("http://localhost:3000/api/message", {
                method: "POST",
                body: JSON.stringify({ content: message }),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const data = await req.json();

            const newMessages:message[] = [
                {
                    author: "user",
                    content: message as string
                },
                {
                    author:"asisstant",
                    content: data
                }
            ]
            
            setConversation((prev)=>[...prev, ...newMessages])
            if (inputref.current) {
                inputref.current.value = "";
            }
        }
    }
}
