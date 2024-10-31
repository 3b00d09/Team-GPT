// Opt out of caching for all data requests in the route segment
export const maxDuration = 60;

import { dbClient } from "@/lib/db/db";
import { messagesTable, messagesTable2 } from "@/lib/db/schema";
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
  console.log("query messages")
  const messageRows = await dbClient
    .select({content: messagesTable2.content, user: messagesTable2.user, assistant: messagesTable2.assistant})
    .from(messagesTable2)
    .where(eq(messagesTable2.conversationId, parseInt(props.params.id)))
    .orderBy(messagesTable2.createdAt).limit(10);

    console.log("messages done")


  const messages: MessagesData[] = messageRows.map((message) => {

    console.log("mapping")

    // let imgurl: string = "";
    // if (message.imageUrl) {
    //   // this shouldnt be png for all images, need fix
    //   imgurl =
    //     `data:image/png;base64,` +
    //     (message.imageUrl as Buffer).toString("base64");
    // }

    const msg: MessagesData = {
      content: message.content,
      assistant: message.assistant,
      user: message.user,
      imageUrl: null,
    };
    return msg;
  });

  console.log("map done")

  // this means we have 1 message only , so we create a response stream and pass it as a prop to start streaming a response as soon as page loads
  // let stream: StreamableValue<any, any> | null = null;
  // if (messageRows.length === 1) {
  //   const firstMessage:MessagesData = {
  //     content: messageRows[0].content,
  //     assistant: messageRows[0].assistant,
  //     user: messageRows[0].user,
  //     imageUrl: null
  //   }

  //   if(messageRows[0].imageUrl){
  //     firstMessage.imageUrl = `data:image/png;base64,` + (messageRows[0].imageUrl as Buffer).toString("base64");
  //   }
  //   const { newMessage } = await sendMessage(
  //     [firstMessage],
  //     firstMessage,
  //     parseInt(props.params.id),
  //     true
  //   );
  //   stream = newMessage;
  // }
  return <ChatWrapper {...props} messages={messages} stream={null} />;
}
