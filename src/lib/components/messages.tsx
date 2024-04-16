"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { messagesTable } from "../db/schema";
import React, { useEffect, useRef, useState } from "react";
import {faUser, faWheelchairMove} from "@fortawesome/free-solid-svg-icons";
import { useIntersection } from '@mantine/hooks';
import ReactMarkdown from 'react-markdown';

export default function Messages(props: { messages: typeof messagesTable.$inferSelect[] }) {
    
    const lastMessageRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const {ref, entry} = useIntersection({
        root: lastMessageRef.current,
        threshold: 1.0
    })

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

    return (
        <div className="flex flex-col items-center h-full mt-12 gap-8" ref={containerRef}>    
            {props.messages.map((message, index) => {
                if(index === props.messages.length - 1){
                    return(
                        <div className="w-3/4" key={index}>
                            <div ref={ref}></div>
                            <Message lastMessage={index === props.messages.length} message={message}/> 
                        </div>
                        
                    )
                }
                else{
                    return (
                        <Message key={index} lastMessage={index === props.messages.length} message={message}/> 
                    )
                }

            })}
            {!entry?.isIntersecting && <NavigateToBottom navigateToBottom={navigateToBottom}/>}
            
        </div>
    );
}


type messageProps = {
    message: typeof messagesTable.$inferSelect | {content: string, user: boolean},
    lastMessage: boolean

}


export const Message = (props:messageProps) =>{
    // converting the markdown from server to html on the client causes a hydration error
    // so we'll wait for the component to mount before rendering the markdown

    const [hasMounted, setHasMounted] = useState(false)

    useEffect(()=>{
        setHasMounted(true)
    },[])

    if(!hasMounted) return null
    return (
        <div className="w-3/4">
            <p className="px-4 py-2 text-base">
                {props.message.user === true ? <FontAwesomeIcon icon={faUser} /> : <FontAwesomeIcon icon={faWheelchairMove} /> }
                <ReactMarkdown>
                    {props.message.content}
                </ReactMarkdown>
            </p>
        </div>
    )
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