"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import {  sendMessage } from "../actions";
import { useRef } from "react";
import Messages from "@/lib/components/Messages";
import { faWheelchairMove } from "@fortawesome/free-solid-svg-icons";
import { StreamableValue, readStreamableValue } from 'ai/rsc';
import { useIntersection } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import { LatestMessage } from "@/lib/components/Messages";
import { convertToBase64 } from "../utils";
import ChatForm from "./ChatForm";
import { fileDataType, MessagesData } from "../types";

type props = {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | undefined };
  messages: MessagesData[];
  stream?: StreamableValue<any, any> | null;
};

export default function ChatWrapper(props: props) {  

    const router = useRouter();
    const [messages, setMessages] = useState<MessagesData[]>(props.messages);
    const [showScrollBtn, setShowScrollBtn] = useState<boolean>(true)
    const [latestMessage, setLatestMessage] = useState<string>("")

    const messagesContainer = useRef<HTMLDivElement>(null);
    const mainContainer = useRef<HTMLDivElement>(null);

    const {ref, entry} = useIntersection({
        root: mainContainer.current,
        threshold: 0
    })

    const handleFormSubmit = async (file: File | null, userLatestMessage: string) => {
      router.refresh();
      // prevent the scroll btn to spam while we are autoscrolling inside the readStreamableValue loop
      setShowScrollBtn(false);

      let newFile:fileDataType = null;

      if(file){
        newFile = {
          url: await convertToBase64(file),
          mimeType: file.type
        }
      }
      
      const newMsg = {
        content: userLatestMessage,
        user: true,
        assistant: false,
        file: newFile,
      };

      // usestate isnt fast enough to update the messages array before the readStreamableValue loop so we'll initiate a new array
      const newMessages: MessagesData[] = [...messages, newMsg];
      setMessages(newMessages);

      const { newMessage } = await sendMessage(
        newMessages,
        newMsg,
        parseInt(props.params.id),
      );

      // append the stream of content to the same string
      let streamedContent = "";
      for await (const content of readStreamableValue(newMessage)) {
        streamedContent += content;
        setLatestMessage((prev) => prev + content);
      }


      const AiMessage: MessagesData = {
        content: streamedContent,
        user: false,
        assistant: true,
      };
      setMessages([...newMessages, AiMessage]);
      setLatestMessage("");
      setShowScrollBtn(true);
      navigateToBottom();
      
    };

    const navigateToBottom = ()=>{
        if(messagesContainer && messagesContainer.current){
            messagesContainer.current.scrollTo({
                top: messagesContainer.current.scrollHeight,
                behavior: "smooth"
            })
        }
    }

    // the parent page will pass a stream to us if we only have 1 message which means its a new conversation that was created at the home page
    useEffect(()=>{
        if(props.stream){
            (async()=>{
                let streamedContent = "";
                for await (const content of readStreamableValue(props.stream!)) {
                    streamedContent += content;
                    setLatestMessage((prev) => prev + content);
                }
                const AiMessage: MessagesData = {
                  content: streamedContent,
                  user: false,
                  assistant: true,
                };
                setMessages([props.messages[0], AiMessage]);
                setLatestMessage("");
            })()
        }
    },[])
        

    // autoscroll to the bottom of the chat on first render
    useEffect(()=>{
        setTimeout(() => {
            navigateToBottom()
        }, props.messages.length * 10);
    },[])



     const timeoutRef = useRef<number|null>(null)
     // claude did this for me :D
     // debounce limits how many times the function is called so we dont spam scroll
     useEffect(() => {
    if(latestMessage.length === 0) return;
       const debouncedNavigateToBottom = () => {
         if (timeoutRef.current) {
           clearTimeout(timeoutRef.current);
         }

         timeoutRef.current = window.setTimeout(() => {
           navigateToBottom();
           timeoutRef.current = null;
         }, 50);
       };

       debouncedNavigateToBottom();

       return () => {
         if (timeoutRef.current) {
           clearTimeout(timeoutRef.current);
         }
       };
     }, [messagesContainer.current?.scrollHeight]);


    return (
      <div
        className="grid flex-1 grid-rows-[10fr_1fr] overflow-y-auto"
        ref={mainContainer}
      >
        <div
          className="overflow-auto"
          id="messages-container"
          ref={messagesContainer}
        >
          <Messages messages={messages} />

          {/* ai message that is being streamed in shows here */}
          {latestMessage.length > 0 && (
            <LatestMessage content={latestMessage} />
          )}
          <div ref={ref} className="h-[1px]"></div>
        </div>

        {!entry?.isIntersecting && showScrollBtn && (
          <NavigateToBottom navigateToBottom={navigateToBottom} />
        )}

        <ChatForm formSubmit={handleFormSubmit}/>
      </div>
    );
}   

function LoadingSpinner(){
    return (
        <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
        </div>
    );
}

const NavigateToBottom = ({navigateToBottom} : any) => {   
    return (
        <div className="fixed bottom-20">
            <button onClick={navigateToBottom} className="bg-blue-500 text-white p-2 rounded-full">
                <FontAwesomeIcon icon={faWheelchairMove}/>
            </button>
        </div>
    )
}