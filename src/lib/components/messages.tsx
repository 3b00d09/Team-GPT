"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { messagesTable } from "../db/schema";
import React from "react";
import {faUser, faWheelchairMove} from "@fortawesome/free-solid-svg-icons";

export default function Messages(props: { messages: typeof messagesTable.$inferSelect[] }) {

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



const Message = (props:{message:typeof messagesTable.$inferSelect}) =>{
    return (
        <div className="w-3/4">
            <p className="px-4 py-2 text-base flex items-center gap-2">
                {props.message.user === true ? <FontAwesomeIcon icon={faUser} /> : <FontAwesomeIcon icon={faWheelchairMove} /> }
                {props.message.content}
            </p>
        </div>
    )
}