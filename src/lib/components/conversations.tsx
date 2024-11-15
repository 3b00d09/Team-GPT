"use client"

import Link from "next/link"
import { dbClient } from "../db/db"
import { conversationsTable } from "../db/schema"
import { $Type, desc, eq } from "drizzle-orm"
import { validateRequest } from "../auth/auth";
import { redirect } from "next/navigation";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { conversationRow } from "../db/schemaTypes"
import { useState } from "react"
import { ConversationDeleteDialog } from "./ConversationDeleteDialog"

export default function Conversations({conversations}:{conversations:conversationRow[]}){
    
    return(
        <div className="w-[12%] bg-[#171717] overflow-y-scroll scrollbar-hidden">
            <div className="flex justify-between items-center p-4">
                <Link href="/">Team GPT </Link>
            </div>

            <div className="mt-12 grid gap-2">
                {conversations.map((conversation) => {
                    return(
                        <Conversation key={conversation.id} id={conversation.id} description={conversation.description}/>
                    )
                }
                )}
            </div>
        </div>
    )
}

function Conversation({id, description}: {id: number, description: string}){
    const [visibleDialog, setVisibleDialog] = useState<boolean>(false)
    const handleDeleteClick = (e:React.MouseEvent) =>{
        // stops the click event from firing off the link's navigation
        e.stopPropagation()
        e.preventDefault()
        setVisibleDialog(true)
    }
    return(
        <div key={id}  className="border-b p-2 hover:bg-[#212121] flex gap-2 items-center justify-between group">
            <Link href={`/chat/${id}`} className="flex-1">{description}</Link>
            <ConversationDeleteDialog id={id} description={description} />
        </div>
    )
}