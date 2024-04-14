"use client"
import { useRouter } from "next/navigation";
import React from "react";


export default function Home() {
  const router = useRouter();
  
  async function createConversation(formData: FormData) {
  const message = formData.get("message");
      if (message) {
          const req = await fetch("http://localhost:3000/api/create-convo", {
              method: "POST",
              body: JSON.stringify({ content: message }),
              headers: {
                  "Content-Type": "application/json",
              },
          });

          const res = await req.json();

          if(res.success){
            router.push(`/chat/${res.id}/?message=${res.newMessageId}&new=true`)
          }
      }
  }
  return (
    <div className="flex-1 flex flex-col justify-between">
        <div className="flex-1 grid place-items-center">
            A bunch of stuff here?
        </div>
        <form className="self-center w-1/2" action={createConversation}>
            <input 
                name="message"
                className="w-full p-4 rounded-lg bg-transparent border border-slate-600" 
                placeholder="Message ChatGPT..." 
                type="text" 
                >
            </input>
        </form>
      </div>
  );
}
  