// Opt out of caching for all data requests in the route segment
export const maxDuration = 60;

import { dbClient } from "@/lib/db/db";
import { messagesTable } from "@/lib/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import { sendMessage } from "@/lib/actions";
import { StreamableValue } from "ai/rsc";
import { fileDataType, MessagesData } from "@/lib/types";
import ChatWrapper from "@/lib/components/ChatWrapper";

type props = {
  params: {
    id: string;
  };
  searchParams: { [key: string]: string | undefined };
};

export default async function Page(props: props) {
  const messageRows = await dbClient
    .select({content: messagesTable.content, user: messagesTable.user, assistant: messagesTable.assistant, file: messagesTable.file, fileType: messagesTable.fileType})
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, parseInt(props.params.id)))
    .orderBy(messagesTable.createdAt);

  const messages: MessagesData[] = messageRows.map((message) => {

    let file:fileDataType = null;
    if (message.file && message.fileType) {
      file = {
        url:`data:${message.fileType};base64,` + (message.file as Buffer).toString("base64"),
        mimeType: message.fileType
      }        
    }

    const msg: MessagesData = {
      content: message.content,
      assistant: message.assistant,
      user: message.user,
      file
    };
    return msg;
  });

  // this means we have 1 message only , so we create a response stream and pass it as a prop to start streaming a response as soon as page loads
  let stream: StreamableValue<any, any> | null = null;
  if (messageRows.length === 1) {

    const _firstMessage = messageRows[0]

    const firstMessage:MessagesData = {
      content: _firstMessage.content,
      assistant: _firstMessage.assistant,
      user: _firstMessage.user,
    }

    let file:fileDataType = null;
    if (_firstMessage.file && _firstMessage.fileType) {
      file = {
        url:`data:${_firstMessage.fileType};base64,` + (_firstMessage.file as Buffer).toString("base64"),
        mimeType: _firstMessage.fileType
      }   
      firstMessage.file = file;     
    }

    const { newMessage } = await sendMessage(
      [firstMessage],
      firstMessage,
      parseInt(props.params.id),
      true
    );
    stream = newMessage;
  }
  return <ChatWrapper {...props} messages={messages} stream={stream} />;
}
