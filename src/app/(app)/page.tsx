"use client"
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input"
import React, { useRef } from "react";

import { InsertErrorResponse, InsertSuccessResponse } from "../api/create-convo/route";

export default function Home() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const {toast} = useToast()
  
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
          const res: InsertErrorResponse | InsertSuccessResponse = await req.json();

          if(res.success){
            router.push(`/chat/${res.convoId}`)
          }
          else{
            if(inputRef.current) inputRef.current.disabled = false;
            toast({
              title: "Error",
              description: res.message + "\n" + res.err,
              duration:1000,
              variant:"destructive"
            })
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
          autoComplete="off"
          type="text"
        ></Input>
      </form>
    </div>
  );
}