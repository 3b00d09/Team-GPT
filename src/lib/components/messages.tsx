"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { messagesTable } from "../db/schema";
import React, { useEffect, useRef } from "react";
import {faUser, faWheelchairMove} from "@fortawesome/free-solid-svg-icons";
import { useIntersection } from '@mantine/hooks';

export default function Messages(props: { messages: typeof messagesTable.$inferSelect[] }) {
    
    const lastMessageRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const {ref, entry} = useIntersection({
        root: lastMessageRef.current,
        threshold: 1.0
    })

    const navigateToBottom = ()=>{
        if(containerRef.current){
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }


// need to fix scroll not working due to containerRef not having a height
    return (
        <div className="flex flex-col items-center mt-12 gap-8 overflow-auto" ref={containerRef}>    
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
    
    return (
        <div className="w-3/4">
            <p className="px-4 py-2 text-base flex items-center gap-2">
                {props.message.user === true ? <FontAwesomeIcon icon={faUser} /> : <FontAwesomeIcon icon={faWheelchairMove} /> }
                {props.message.content}
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