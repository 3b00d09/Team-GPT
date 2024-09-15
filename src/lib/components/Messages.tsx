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
import { messagesTable } from "../db/schema";
import { MessagesData } from "../types";

type props = {
  messages: MessagesData[];
};

type latestMessage = {
    content: string,
}

type MessageProps = {
    message: MessagesData;
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


export const Message = ({message, latest}: MessageProps) =>{
    // converting the markdown from server to html on the client causes a hydration error
    // so we'll wait for the component to mount before rendering the markdown

    const [hasMounted, setHasMounted] = useState(false)

    useEffect(()=>{
        setHasMounted(true)
    },[])

    if(!hasMounted) return null
    return (
      <div className={"w-3/4"}>
        <div className={"px-4 py-2"}>
          <div className="flex flex-col gap-2 items-baseline">
            {message.user ? (
              <FontAwesomeIcon icon={faUser} />
            ) : (
              <FontAwesomeIcon icon={faWheelchairMove} />
            )}
            <Markdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeHighlight]}
              className={"w-full"}
            >
              {message.content ? (message.content as string) : ""}
            </Markdown>
          </div>
          {message.imageUrl && (
            <img
              src={message.imageUrl}
              className="object-contain w-full"
              alt=""
            />
          )}
        </div>
      </div>
    );
}

export const LatestMessage = ({ content }: latestMessage) => {
  return (
    <div
      className={
        "px-4 py-2 text-base flex flex-col items-center"
      }
    >
      <div className={" w-3/4"}>
        <FontAwesomeIcon icon={faWheelchairMove} />
        <Markdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeHighlight]}
        >
          {content ? (content as string) : ""}
        </Markdown>
      </div>
    </div>
  );
};