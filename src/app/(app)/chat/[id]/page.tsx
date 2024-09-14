// Opt out of caching for all data requests in the route segment
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { dbClient } from "@/lib/db/db";
import { messagesTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendMessage } from "@/lib/actions";
import { StreamableValue } from "ai/rsc";
import { MessagesData } from "@/lib/types";
import ChatWrapper from "@/lib/components/ChatWrapper";

type props = {
  params: {
    id: string;
  };
  searchParams: { [key: string]: string | undefined };
};

export default async function Page(props: props) {
  const messageRows = await dbClient
    .select({content: messagesTable.content, user: messagesTable.user, assistant: messagesTable.assistant, imageUrl: messagesTable.imageUrl})
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, parseInt(props.params.id)))
    .orderBy(messagesTable.createdAt);

  const messages: MessagesData[] = messageRows.map((message) => {
    //https://github.com/remarkjs/react-markdown/issues/785#issuecomment-1966495891
    message.content = message.content.replace(
      /\\\[(.*?)\\\]/g,
      (_, equation) => `$$${equation}$$`
    );

    message.content = message.content.replace(
      /\\\((.*?)\\\)/g,
      (_, equation) => `$${equation}$`
    );

    return message;
  });

  // this means we have 1 message only , so we create a response stream and pass it as a prop to start streaming a response as soon as page loads
  let stream: StreamableValue<any, any> | null = null;
  if (messageRows.length === 1) {
    const { newMessage } = await sendMessage(
      messageRows,
      parseInt(props.params.id),
      null,
      messageRows[0].imageUrl ?? undefined,
      true
    );
    stream = newMessage;
  }

  return <ChatWrapper {...props} messages={messages} stream={stream} />;
}
