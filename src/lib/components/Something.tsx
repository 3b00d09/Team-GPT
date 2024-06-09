"use client"

import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { sendMessage } from "../actions";
import { useRef } from "react";
import Messages from "@/lib/components/Messages";
import  {Message}  from "@/lib/components/Messages";
import { faArrowUpFromBracket, faWheelchairMove } from "@fortawesome/free-solid-svg-icons";
import { CoreMessage } from "ai";
import { StreamableValue, readStreamableValue } from 'ai/rsc';
import { useIntersection } from "@mantine/hooks";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

type props = {
    params:{
        id: string
    },
    searchParams: { [key: string]: string | undefined } ,
    messages: CoreMessage[],
    stream?: StreamableValue<any,any> | null

}

export default function Something(props: props) {  

    const router = useRouter();
    const [messages, setMessages] = useState<CoreMessage[]>(props.messages)
    const [file, setFile] = useState<File | null>(null)
    const [showScrollBtn, setShowScrollBtn] = useState<boolean>(true)
    const [previewImage, setPreviewImage] = useState<string>("")
    const [latestMessage, setLatestMessage] = useState<string>("")

    const inputRef = useRef<HTMLTextAreaElement>(null);
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
        router.refresh()
        // prevent the scroll btn to spam while we are autoscrolling inside the readStreamableValue loop
        setShowScrollBtn(false)
        e.preventDefault();
        if (inputRef.current) inputRef.current.disabled = true;

        // usestate isnt fast enough to update the messages array before the readStreamableValue loop so we'll initiate a new array
        const newMessageContent = inputRef.current?.value || "";
        const newMessages: CoreMessage[] = [
            ...messages,
            { content: newMessageContent, role: "user" } as CoreMessage,
        ];
        setMessages(newMessages);

        // CANNOT PASS FILES TO SERVER ACTIONS :))))
        //const base64Image = await convertToBase64(file!);

        const { newMessage } = await sendMessage(newMessages, parseInt(props.params.id));

        // append the stream of content to the same string
        let streamedContent = "";
        for await (const content of readStreamableValue(newMessage)) {
            streamedContent += content;
            setLatestMessage((prev) => prev + content);
            
            // autoscroll to the bottom of the chat
            navigateToBottom()
        }

        setMessages([...newMessages, { content: streamedContent, role: "assistant" } as CoreMessage]);
        setLatestMessage(()=>{
            navigateToBottom()
            return ""
        });
        setShowScrollBtn(true)
        

        if (inputRef.current) {
            inputRef.current.disabled = false;
            inputRef.current.value = "";
            inputRef.current.style.height = "auto";
        }
    };

    function convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
    }

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
        const messagesContainer = document.querySelector("#messages-container")
        if(messagesContainer){
            messagesContainer.scrollTo({
                top: messagesContainer.scrollHeight,
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

                router.refresh();
            })()
        }
    },[])
        
    // autoscroll to the bottom of the chat on first render
    useEffect(()=>{
        setTimeout(() => {
            navigateToBottom()
        }, props.messages.length * 10);
    },[])

    return (
        <div className="grid flex-1 grid-rows-[10fr_1fr] overflow-y-auto" ref={mainContainer}>

            <div className="overflow-auto" id="messages-container">
                <Messages messages={messages}/>

                {latestMessage.length > 0 &&
                    <Message message={{content: latestMessage, role: "assistant"}} latest={true}/>
                }
                <div ref={ref} className="h-[1px]"></div>
            </div>

            
            {!entry?.isIntersecting && showScrollBtn && <NavigateToBottom navigateToBottom={navigateToBottom}/>}

            <form className="flex self-end justify-self-center w-1/2" onSubmit={handleFormSubmit} ref={chatForm}>
                <div className="relative flex-grow">
                    <Textarea
                    name="message"
                    className="p-4 pr-10 rounded-md bg-transparent border resize-none overflow-auto border-slate-600 text-base w-full animate-height max-h-[10rem]"
                    placeholder="Message AI..."
                    ref={inputRef}
                    onInput={handleTextareaInput}
                    onKeyUp={checkTextareaSubmit}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon
                        icon={faArrowUpFromBracket}
                        className="text-lg text-gray-400 z-10 pointer-events-auto cursor-pointer hover:text-gray-600"
                        onClick={forwardFileEvent}
                    />
                    </div>
                    {previewImage && <img src={previewImage} 
                        className="absolute object-contain bottom-[1px] right-[-200px] w-1/4 border border-slate-600"/>}
                </div>

                <Input
                    onInput={handleFileSubmission}
                    ref={fileUploadRef}
                    name="image"
                    type="file"
                    accept="image/png, image/jpg, image/jpeg"
                    className="hidden"
                />

                <button className="hidden" type="submit">Send</button>
                
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