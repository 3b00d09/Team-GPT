"use client"
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input"
import React, { useRef } from "react";

import { InsertErrorResponse, InsertSuccessResponse } from "../api/create-convo/route";
import ChatWrapper from "@/lib/components/ChatWrapper";
import Messages from "@/lib/components/Messages";
import { MessagesData } from "@/lib/types";
import ChatForm from "@/lib/components/ChatForm";
import { initiateConversation } from "@/lib/actions";
import { convertToBase64 } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const {toast} = useToast()

  async function handleChatSubmit (file: File | null, userMessage: string){
    let base64Image = "";
    if (file) base64Image = await convertToBase64(file);
    const conversationInit = await initiateConversation(userMessage, base64Image && file ? { image: base64Image, name: file.name } : null)
    if(conversationInit.convoId){
      router.push(`/chat/${conversationInit.convoId}`)
    }
  }


  return (
    <div className="grid flex-1 grid-rows-[90% 10%] overflow-y-none">
      <ChatForm formSubmit={handleChatSubmit} />
    </div>
  );
}