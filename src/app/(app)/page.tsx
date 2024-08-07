"use client"
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input"
import React, { useRef } from "react";

export default function Home() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  
  async function createConversation(formData: FormData) {
    if(inputRef.current) inputRef.current.disabled = true;
    const message = formData.get("message");
      if (message) {

          const req = await fetch("/api/create-convo", {
              method: "POST",
              body: JSON.stringify({ content: message }),
              headers: {
                  "Content-Type": "application/json",
              },
          });
          const res = await req.json();

          if(res.success){
            router.push(`/chat/${res.id}`)
          }
          else{
            if(inputRef.current) inputRef.current.disabled = false;
          }
      }
  }
  return (
    <div className="flex-1 flex flex-col justify-between">
        <div className="flex-1 grid place-items-center">
            A bunch of stuff here?
        </div>
        <form className="self-center w-1/2" action={createConversation}>
            <Input 
                ref={inputRef}
                name="message"
                className="w-full p-4 rounded-lg bg-transparent border border-slate-600" 
                placeholder="Message ChatGPT..." 
                type="text" 
                >
            </Input>
        </form>
      </div>
  );
}
  