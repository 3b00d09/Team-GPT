"use client";

import { message } from "@/lib/types";
import React from "react";

export default function Messages(props: { messages: message[] }) {

    
    return (
        <React.Fragment>    
            {props.messages.map((message, index) => {
                return (
                    <Message key={index} message={message}/> 
                )
            })}
        </React.Fragment>
    );
}


const Message = (props:{message:message}) =>{
    return (
        <div className="w-3/4">
            <p className={`px-4 py-2 text-base`}>
                {props.message.content}
            </p>
        </div>
    )
}