"use client"

import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { sendClaudeMessage, sendMessage } from "../actions";
import { useRef } from "react";
import Messages from "@/lib/components/Messages";
import { faArrowUpFromBracket, faWheelchairMove, faBan } from "@fortawesome/free-solid-svg-icons";
import { StreamableValue, readStreamableValue } from 'ai/rsc';
import { useIntersection } from "@mantine/hooks";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { messageRow } from "../db/schemaTypes";
import { LatestMessage } from "@/lib/components/Messages";

import { convertToBase64 } from "../utils";

type props = {
    params:{
        id: string
    },
    searchParams: { [key: string]: string | undefined } ,
    messages: messageRow[],
    stream?: StreamableValue<any,any> | null

}

export default function Something(props: props) {  

    const router = useRouter();
    const [messages, setMessages] = useState<messageRow[]>(props.messages)
    const [file, setFile] = useState<File | null>(null)
    const [showScrollBtn, setShowScrollBtn] = useState<boolean>(true)
    const [previewImage, setPreviewImage] = useState<string>("")
    const [latestMessage, setLatestMessage] = useState<string>("")

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const messagesContainer = useRef<HTMLDivElement>(null);
    const chatForm = useRef<HTMLFormElement>(null);
    const mainContainer = useRef<HTMLDivElement>(null);
    const fileUploadRef = useRef<HTMLInputElement>(null);

    const {ref, entry} = useIntersection({
        root: mainContainer.current,
        threshold: 0
    })

    const handleFileSubmission = (e: React.MouseEvent<HTMLInputElement>) => {  
        if(fileUploadRef.current){  
            setFile(fileUploadRef.current.files![0])
            setPreviewImage(URL.createObjectURL(fileUploadRef.current.files![0]))
        }
    }

    const forwardFileEvent =  (e: React.MouseEvent<SVGSVGElement>) =>{
        if(fileUploadRef.current){
            fileUploadRef.current.click()
        }
    }

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      router.refresh();
      // prevent the scroll btn to spam while we are autoscrolling inside the readStreamableValue loop
      setShowScrollBtn(false);
      e.preventDefault();
      if (inputRef.current) inputRef.current.disabled = true;

      // usestate isnt fast enough to update the messages array before the readStreamableValue loop so we'll initiate a new array
      const newMessageContent = inputRef.current?.value || "";
      // id is irrelevant here so i just put something random
      const newMsg = {
        content: newMessageContent,
        user: true,
        assistant: false,
        conversationId: parseInt(props.params.id),
        id: messages.length + 1,
        createdAt: null,
        imageUrl: null,
      };
      const newMessages: messageRow[] = [...messages, newMsg];
      setMessages(newMessages);

      // CANNOT PASS FILES TO SERVER ACTIONS :))))
      let base64Image = "";
      if (file) {
        base64Image = await convertToBase64(file);
      }

      const { newMessage } = await sendMessage(
        newMessages,
        parseInt(props.params.id),
        base64Image && file ? { image: base64Image, name: file.name } : null,
        false
      );

      // append the stream of content to the same string
      let streamedContent = "";
      for await (const content of readStreamableValue(newMessage)) {
        streamedContent += content;
        setLatestMessage((prev) => prev + content);
      }


      const AiMessage: messageRow = {
        content: streamedContent,
        user: false,
        assistant: true,
        conversationId: parseInt(props.params.id),
        id: messages.length + 2,
        createdAt: null,
        imageUrl: null,
      };
      setMessages([...newMessages, AiMessage]);
      setLatestMessage("");
    
    
      setShowScrollBtn(true);

      if (inputRef.current) {
        inputRef.current.disabled = false;
        inputRef.current.value = "";
        inputRef.current.style.height = "auto";
        setFile(null);
        setPreviewImage("");
      }
    };



    const handleTextareaInput = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        e.currentTarget.style.height = "auto";
        e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
    }

    const checkTextareaSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if(e.key === "Enter" && !e.shiftKey && e.currentTarget.value.trim().length > 0){
            // simulate a submit event on the form
            chatForm.current?.dispatchEvent(new Event("submit", {bubbles: true}))
        }
    }

    const navigateToBottom = ()=>{
        // no shame in good ol' vanilla js (for now)
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
                const AiMessage: messageRow = {
                    content: streamedContent,
                    user: false,
                    assistant: true,
                    conversationId: parseInt(props.params.id),
                    id: 1,
                    createdAt: null,
                    imageUrl: null,
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

        <form
          className="flex self-end justify-self-center w-1/2"
          onSubmit={handleFormSubmit}
          ref={chatForm}
        >
          <div className="relative flex-grow">
            <Textarea
              name="message"
              className="p-4 pr-10 rounded-md bg-transparent border resize-none overflow-auto border-slate-600 text-base w-full animate-height max-h-[10rem]"
              placeholder="Message AI..."
              ref={inputRef}
              onInput={handleTextareaInput}
              onKeyUp={checkTextareaSubmit}
              autoComplete="off"
            />
            <div className="absolute bottom-2 right-0 pr-3 flex items-center pointer-events-none">
              <FontAwesomeIcon
                icon={faArrowUpFromBracket}
                className="text-lg text-gray-400 z-10 pointer-events-auto cursor-pointer hover:text-gray-600"
                onClick={forwardFileEvent}
              />
            </div>
            {/* <div className="absolute top-2 right-0 pr-3 flex items-center pointer-events-none">
              <FontAwesomeIcon
                icon={faBan}
                className="text-lg text-gray-400 z-10 pointer-events-auto cursor-pointer hover:text-gray-600"
                
              />
            </div> */}
            {previewImage && (
              <img
                src={previewImage}
                className="absolute object-contain top-[0px] left-[-45px] w-12 border border-slate-600"
              />
            )}
          </div>

          <Input
            onInput={handleFileSubmission}
            ref={fileUploadRef}
            name="image"
            type="file"
            accept="image/png, image/jpg, image/jpeg"
            className="hidden"
          />

          <button className="hidden" type="submit">
            Send
          </button>
        </form>
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