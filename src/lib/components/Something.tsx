"use client"

import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { Suspense, useEffect, useState } from "react";
import { sendMessage } from "../actions";
import { useFormState } from "react-dom";
import { useFormStatus } from "react-dom";
import { useRef } from "react";
import { Message } from "@/lib/components/Messages";
import { faArrowUpFromBracket } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

type props = {
    params:{
        id: string
    },
    searchParams: { [key: string]: string | undefined } ,
    children: React.ReactNode
}

type submitBtnProps = {
    setLoading: React.Dispatch<React.SetStateAction<boolean>>

}

export default function Something(props: props) {  

    const [state, action] = useFormState(sendMessage, {
        error: false,
        message: ""
    });

    const [loading, setLoading] = useState<boolean>(false)
    const [file, setFile] = useState<File | null>(null)
    const [previewImage, setPreviewImage] = useState<string>("")
    const [latestMessage, setLatestMessage] = useState<string>("")

    const router = useRouter();
    
    const inputRef = useRef<HTMLInputElement>(null);
    const fileUploadRef = useRef<HTMLInputElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const handleSubmitUI = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if(e.key === "Enter"){
            if (inputRef.current) {
                setLatestMessage(inputRef.current?.value)
            }
        }
    }

    const handleFileSubmission = (e: React.MouseEvent<HTMLInputElement>) => {  
        if(fileUploadRef.current){  
            setFile(fileUploadRef.current.files![0])
        }
    }

    const forwardFileEvent =  (e: React.MouseEvent<SVGSVGElement>) =>{
        if(fileUploadRef.current){
            fileUploadRef.current.click()
        }
    }

    const sendFirstMessage = async(messageId:string) =>{
        console.log("requesting")
        setLoading(true);
        const req = await fetch("http://localhost:3000/api/create-first-message", {
            method: "POST",
            body: JSON.stringify({ messageId }),
            headers: {
                "Content-Type": "application/json",
            },
        });

        const res = await req.json();
        setLoading(false);
        if(res.success) router.push(`/chat/${res.convoId}`)
        
        
    }

    useEffect(()=>{
        if(!loading){
            setLatestMessage("")
            if(inputRef.current) inputRef.current.disabled = false;
        } 
        
        else{
            if(inputRef.current){
                inputRef.current.value = "";
                inputRef.current.disabled = true;
            } 
        }
    },[loading, latestMessage])

    
    useEffect(()=>{
        if(file){
            setPreviewImage(URL.createObjectURL(file))
        }
    }, [file])

    useEffect(()=>{
        if(props.searchParams["new"] && props.searchParams["message"]) sendFirstMessage(props.searchParams["message"])
        
    },[])


    
    return (
        <div className="grid flex-1 grid-rows-[10fr_1fr] overflow-y-auto">

            <div className="overflow-auto" id="messages-container" ref={messagesContainerRef}>
                <Suspense key={JSON.stringify(props.searchParams)} fallback={<div>loading...</div>}>
                    {props.children}
                </Suspense>
                {state.error && <div className="text-red-500">{state.message}</div>}
                {!state.error && latestMessage.length > 0 && 
                    <Message message={{
                        content: latestMessage,
                        user: true,
                    }} lastMessage={true}
                    />
                }
                {loading && <LoadingSpinner/>}
            </div>

            <form className="flex self-end justify-self-center w-1/2" action={action}>
                <div className="relative flex-grow">
                    <Input
                    name="message"
                    className="p-4 rounded-md bg-transparent border resize-none overflow-auto border-slate-600 text-base h-full w-full"
                    placeholder="Message ChatGPT..."
                    type="text"
                    ref={inputRef}
                    onKeyUp={handleSubmitUI}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon
                        icon={faArrowUpFromBracket}
                        className="text-lg text-gray-400 z-10 pointer-events-auto cursor-pointer hover:text-gray-600"
                        onClick={forwardFileEvent}
                    />
                    </div>
                    {previewImage && <img src={previewImage} 
                        className="absolute object-contain bottom-12 right-0 w-28 border border-slate-600"/>}
                </div>

                <Input
                    onInput={handleFileSubmission}
                    ref={fileUploadRef}
                    name="image"
                    type="file"
                    accept="image/png, image/jpg, image/jpeg"
                    className="hidden"
                />

                <Input type="hidden" name="conversation" value={props.params.id}/>
                <SubmitButton setLoading={setLoading}/>
                
            </form>
        </div>
            
    );
}   

function SubmitButton({setLoading}: submitBtnProps){
    const {pending} = useFormStatus();

    useEffect(()=>{
        setLoading(pending)
    },[pending])

    return(
        <button className="hidden" type="submit">Send</button>
    )
}

function LoadingSpinner(){
    return (
        <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
        </div>
    );
}