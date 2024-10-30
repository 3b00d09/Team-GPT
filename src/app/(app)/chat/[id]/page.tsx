// Opt out of caching for all data requests in the route segment
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { dbClient } from "@/lib/db/db";
import { messagesTable } from "@/lib/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
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
    .select({content: messagesTable.content, user: messagesTable.user, assistant: messagesTable.assistant, imageUrl: messagesTable.image})
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

    //https://community.openai.com/t/openai-api-does-not-write-the-equation-in-latex-format-in-mathjax-format/805445/2
    message.content = message.content
      .replaceAll("\\(", "$")
      .replaceAll("\\)", "$")
      .replaceAll("\\[", "$$")
      .replaceAll("\\]", "$$");

    let imgurl: string = "";
    if (message.imageUrl) {
      // this shouldnt be png for all images, need fix
      imgurl =
        `data:image/png;base64,` +
        (message.imageUrl as Buffer).toString("base64");
    }

    const msg: MessagesData = {
      content: message.content,
      assistant: message.assistant,
      user: message.user,
      imageUrl: imgurl,
    };
    return msg;
  });

  // this means we have 1 message only , so we create a response stream and pass it as a prop to start streaming a response as soon as page loads
  let stream: StreamableValue<any, any> | null = null;
  if (messageRows.length === 1) {
    const firstMessage:MessagesData = {
      content: messageRows[0].content,
      assistant: messageRows[0].assistant,
      user: messageRows[0].user,
      imageUrl: null
    }

    if(messageRows[0].imageUrl){
      firstMessage.imageUrl = `data:image/png;base64,` + (messageRows[0].imageUrl as Buffer).toString("base64");
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
