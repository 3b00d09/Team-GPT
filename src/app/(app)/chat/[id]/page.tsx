// Opt out of caching for all data requests in the route segment
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
  // const messageRows = await dbClient
  //   .select({content: messagesTable.content, user: messagesTable.user, assistant: messagesTable.assistant, imageUrl: messagesTable.image})
  //   .from(messagesTable)
  //   .where(eq(messagesTable.conversationId, parseInt(props.params.id)))
  //   .orderBy(messagesTable.createdAt);


  //const messages: MessagesData[] = messageRows.map((message) => {

    // let imgurl: string = "";
    // if (message.imageUrl) {
    //   // this shouldnt be png for all images, need fix
    //   imgurl =
    //     `data:image/png;base64,` +
    //     (message.imageUrl as Buffer).toString("base64");
    // }

    const messages = [
      {
        content: "Hello world",
        assistant: false,
        user: true,
        imageUrl: null,
      },
      {
        content: "Hi there! How can I help you today?",
        assistant: true,
        user: false,
        imageUrl: null,
      },
      {
        content: "I need help with my JavaScript code",
        assistant: false,
        user: true,
        imageUrl: null,
      },
      {
        content:
          "I'd be happy to help you with JavaScript. What specific issues are you encountering?",
        assistant: true,
        user: false,
        imageUrl: null,
      },
      {
        content: "My loops aren't working correctly",
        assistant: false,
        user: true,
        imageUrl: null,
      },
      {
        content: "Could you share your loop code so I can take a look?",
        assistant: true,
        user: false,
        imageUrl: null,
      },
      {
        content: "Here's my for loop: for(i=0; i<10; i++)",
        assistant: false,
        user: true,
        imageUrl: null,
      },
      {
        content:
          "I notice you're missing 'let' or 'const' before 'i'. This could cause issues.",
        assistant: true,
        user: false,
        imageUrl: null,
      },
      {
        content: "Ah, that makes sense! Let me try fixing that",
        assistant: false,
        user: true,
        imageUrl: null,
      },
      {
        content:
          "Great! Let me know if you need any other help after trying that.",
        assistant: true,
        user: false,
        imageUrl: null,
      },
      {
        content: "It works now! Thanks so much",
        assistant: false,
        user: true,
        imageUrl: null,
      },
      {
        content:
          "You're welcome! Is there anything else you'd like to learn about JavaScript?",
        assistant: true,
        user: false,
        imageUrl: null,
      },
      {
        content: "Maybe we could cover functions next?",
        assistant: false,
        user: true,
        imageUrl: null,
      },
      {
        content:
          "Functions are a great topic to learn! Shall we start with the basics?",
        assistant: true,
        user: false,
        imageUrl: null,
      },
      {
        content: "Yes please, that would be perfect",
        assistant: false,
        user: true,
        imageUrl: null,
      },
      {
        content: "Hello world",
        assistant: false,
        user: true,
        imageUrl: null,
      },
      {
        content: "Hi there! How can I help you today?",
        assistant: true,
        user: false,
        imageUrl: null,
      },
      {
        content: "I need help with my JavaScript code",
        assistant: false,
        user: true,
        imageUrl: null,
      },
      {
        content:
          "I'd be happy to help you with JavaScript. What specific issues are you encountering?",
        assistant: true,
        user: false,
        imageUrl: null,
      },
      {
        content: "My loops aren't working correctly",
        assistant: false,
        user: true,
        imageUrl: null,
      },
      {
        content: "Could you share your loop code so I can take a look?",
        assistant: true,
        user: false,
        imageUrl: null,
      },
      {
        content: "Here's my for loop: for(i=0; i<10; i++)",
        assistant: false,
        user: true,
        imageUrl: null,
      },
      {
        content:
          "I notice you're missing 'let' or 'const' before 'i'. This could cause issues.",
        assistant: true,
        user: false,
        imageUrl: null,
      },
      {
        content: "Ah, that makes sense! Let me try fixing that",
        assistant: false,
        user: true,
        imageUrl: null,
      },
      {
        content:
          "Great! Let me know if you need any other help after trying that.",
        assistant: true,
        user: false,
        imageUrl: null,
      },
      {
        content: "It works now! Thanks so much",
        assistant: false,
        user: true,
        imageUrl: null,
      },
      {
        content:
          "You're welcome! Is there anything else you'd like to learn about JavaScript?",
        assistant: true,
        user: false,
        imageUrl: null,
      },
      {
        content: "Maybe we could cover functions next?",
        assistant: false,
        user: true,
        imageUrl: null,
      },
      {
        content:
          "Functions are a great topic to learn! Shall we start with the basics?",
        assistant: true,
        user: false,
        imageUrl: null,
      },
      {
        content: "Yes please, that would be perfect",
        assistant: false,
        user: true,
        imageUrl: null,
      },
    ];
  //   return msg;
  // });

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
