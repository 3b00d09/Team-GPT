"use client"

import { Input } from "@/components/ui/input";
import { Suspense, useEffect, useState } from "react";
import { sendMessage } from "../actions";
import { useFormState } from "react-dom";
import { useFormStatus } from "react-dom";
import { useRef } from "react";
import { Message } from "./Messages";

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
        error: false
    });

    const [loading, setLoading] = useState<boolean>(false)
    const [latestMessage, setLatestMessage] = useState<string>("")
    
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const handleSubmitUI = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if(e.key === "Enter"){
            if (inputRef.current) {
                setLatestMessage(inputRef.current?.value)
            }
        }
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


    
    return (
        <div className="grid flex-1 grid-rows-[10fr_1fr] overflow-y-auto">

            <div className="overflow-auto" id="messages-container" ref={messagesContainerRef}>
                <Suspense key={JSON.stringify(props.searchParams)} fallback={<div>loading...</div>}>
                    {props.children}
                </Suspense>
                {state.error && <div className="text-red-500">Error sending message</div>}
                {!state.error && latestMessage.length > 0 && 
                    <Message message={{
                        content: latestMessage,
                        user: true,
                    }} lastMessage={true}
                    />
                }
                {loading && <LoadingSpinner/>}
            </div>

            <form className="self-end justify-self-center w-1/2" action={action}>
                <Input 
                    name="message"
                    className="p-4 rounded-md bg-transparent border resize-none overflow-auto border-slate-600 text-base h-full" 
                    placeholder="Message ChatGPT..." 
                    type="text"
                    ref={inputRef}
                    onKeyUp={handleSubmitUI}
                    >
                </Input>
                <SubmitButton setLoading={setLoading}/>
                
                <Input type="hidden" name="conversation" value={props.params.id}/>
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