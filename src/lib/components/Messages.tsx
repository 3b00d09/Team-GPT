"use client"

import { useEffect} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import {faUser, faWheelchairMove} from "@fortawesome/free-solid-svg-icons";
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'
import { CoreMessage } from "ai";


type props = {
    messages: CoreMessage[]
}

type MessageProps = {
    message: CoreMessage
    latest?: boolean
}


export default function Messages(props: props){

    return (
        <div className="flex flex-col items-center mt-12 gap-8">    
            {props.messages.map((message, index) => {
                return (
                    <Message key={index} message={message}/> 
                )

            })}
        </div>
    );
}


export const Message = React.memo(({message, latest}: MessageProps) =>{
    // converting the markdown from server to html on the client causes a hydration error
    // so we'll wait for the component to mount before rendering the markdown

    const [hasMounted, setHasMounted] = useState(false)

    useEffect(()=>{
        setHasMounted(true)
    },[])

    if(!hasMounted) return null
    return (
        <div className={!latest ? "w-3/4" : "px-4 py-2 text-base flex flex-col items-center"}>
            <div className={!latest? "px-4 py-2 text-base" : " w-3/4"}>
                {message.role === "user" ? <FontAwesomeIcon icon={faUser} /> : <FontAwesomeIcon icon={faWheelchairMove} /> }
                <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeHighlight]}>
                    {message.content ? message.content as string : ""}
                </Markdown>
            </div>
        </div>
    )
})