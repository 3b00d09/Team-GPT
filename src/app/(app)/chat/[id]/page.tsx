// Opt out of caching for all data requests in the route segment
export const dynamic = "force-dynamic";

import Something from "@/lib/components/Something";
import { dbClient } from "@/lib/db/db";
import { messagesTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CoreMessage } from "ai";
import { sendMessage } from "@/lib/actions";
import { StreamableValue } from "ai/rsc";
import { messageRow } from "@/lib/db/schemaTypes";

type props = {
  params: {
    id: string;
  };
  searchParams: { [key: string]: string | undefined };
};

export default async function Page(props: props) {
  const messageRows = await dbClient
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, parseInt(props.params.id)));

  const messages: messageRow[] = messageRows.map((message) => {
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

  let stream: StreamableValue<any, any> | null = null;
  if (messageRows.length === 1) {
    const { newMessage } = await sendMessage(
      messageRows,
      parseInt(props.params.id),
      null,
      true
    );
    stream = newMessage;
  }

  return <Something {...props} messages={messages} stream={stream} />;
}
