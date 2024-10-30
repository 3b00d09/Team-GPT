"use server";

import { revalidatePath } from "next/cache";
import { dbClient } from "./db/db";
import { conversationsTable, messagesTable } from "./db/schema";

import { createStreamableValue } from "ai/rsc";
import { CoreMessage, CoreUserMessage, generateText, ImagePart, streamText, TextPart, UserContent } from "ai";
import { openai } from "@ai-sdk/openai";
import { messageRow } from "./db/schemaTypes";
import { validateRequest } from "./auth/auth";
import { redirect } from "next/navigation";

import { anthropic } from "@ai-sdk/anthropic";
import { imageBase64ToFile } from "./utils";
import { MessagesData } from "./types";
import { prompt } from "./utils";

export async function sendMessage(
  messages: MessagesData[],
  newMsg: MessagesData,
  convoId: number,
  newMessage: boolean = false
) {
  const { user } = await validateRequest();
  if (!user) {
    return redirect("/login");
  }

  let binaryData: Buffer | null = null;
  

  const coreMessages: CoreMessage[] = messages.map((message) => {

    if(message.assistant){
      return{
        content: message.content, 
        role: "assistant"
      }
    }
    
    // messages with just an image can have empty text, and vise versa obv
    let textPart:TextPart;
    let imagePart: ImagePart;

    if(message.content && message.imageUrl){
      textPart = {
        type:"text",
        text:message.content,
      }
      imagePart = {
        type:"image",
        image:message.imageUrl
      }

      return {
        content:[textPart, imagePart],
        role:"user"
      }
    }
    else if(message.imageUrl){
      imagePart = {
        type: "image",
        image: message.imageUrl,
      };

      return {
        content: [imagePart],
        role: "user",
      };
    }

    return{
      role:"user",
      content:message.content,
    }

  });
 
  if (newMsg.imageUrl) {
      const [header, base64Data] = newMsg.imageUrl.split(",");
      const mime = header.match(/:(.*?);/)?.[1];

      if (!mime) {
        throw new Error("Invalid MIME type");
      }
      binaryData = Buffer.from(base64Data, "base64");
  }

  const stream = createStreamableValue();
  let AIMessage = "";

  (async () => {
    try {
      const { textStream } = await streamText({
        model: openai("gpt-4o-2024-08-06"),
        messages: coreMessages,
        system: prompt,
        async onFinish({text, finishReason, usage}){
          await updateDatabase(
            messages[messages.length - 1].content as string,
            binaryData,
            text,
            convoId,
            newMessage
          );
        }
      });

      try {
        for await (const text of textStream) {
          AIMessage += text;
        }
      } 
      
      catch (streamError) {
        console.error("Streaming error:", streamError);
        stream.error(streamError);
        throw streamError; // throw again because of nested try catch
      } 
      
      finally {
        stream.done();
      }
      revalidatePath(`/chat/${convoId}`);
    } 
    
    catch (error) {
      console.error("Operation failed:", error);
    }
  })();


  return {
    newMessage: stream.value,
  };
}

// export async function sendClaudeMessage(messages: messageRow[], convoId: number, image?: { image: string; name: string } | null, newMessage: boolean = false) {
  
//     const { user } = await validateRequest();
//     if (!user) return redirect("/login");

//     let imageUrl: URL | null = null;

//     const coreMessages: CoreMessage[] = messages.map((message) => {
//         return {
//             content: message.content,
//             role: message.user ? "user" : "assistant",
//         };
//     });

//     if (image && image.image) {
//         try {
        
//         const imageFile = imageBase64ToFile(image)

//         const res = await utapi.uploadFiles(imageFile);
//         if (res.data && res.data.url) imageUrl = new URL(res.data.url);
//         } catch (e) {
//             console.error("Failed to upload image:", e);
//         }
//     }

//     if (imageUrl) {
//         // anthropic doesnt support images so we have to fetch a description from GPT
//         const imageDesc = await fetchImageDescription(imageUrl.href, messages[0].content)

//         // merge the last message with the image description in 1 message object otherwise we get two "user" messages in a row which throws an err
//         coreMessages[coreMessages.length - 1].content = [
//           {
//             type: "text",
//             text: messages[messages.length - 1].content,
//           },
//           {
//             type: "text",
//             text:`image description: ${imageDesc}`
//           }
//         ];
//     }

//     const stream = createStreamableValue();
//     try{
//         (async () => {
//             const { textStream } = await streamText({
//             model: anthropic("claude-3-opus-20240229"),
//             messages: [
//                 ...coreMessages,
//             ],
//             system: "You are a helpful assistant.",
//             });

//             let AIMessage: string = "";
//             for await (const text of textStream) {
//             stream.update(text);
//             AIMessage = AIMessage + text;
//             }

//             stream.done();
//             await updateDatabase(
//             messages[messages.length - 1].content as string,
//             imageUrl ? imageUrl.href : "",
//             AIMessage,
//             convoId,
//             newMessage
//             );
//             revalidatePath(`/chat/${convoId}`);
//         })();
//     }
//     catch(e){
//         stream.done()
//     }
    
//     return {
//         newMessage: stream.value,
//     };
// }

async function updateDatabase(
  userMessage: string,
  imageBinary: Buffer | null,
  assistantMessage: string,
  convoId: number,
  newMessage: boolean = false
) {
  try {
    await dbClient.transaction(async (tx) => {
      if (newMessage) {
        await tx.insert(messagesTable).values({
          //@ts-ignore
          conversationId: convoId,
          content: assistantMessage,
          user: 0,
          assistant: 1,
        });
      } else {
        await tx.insert(messagesTable).values({
          //@ts-ignore
          conversationId: convoId,
          content: userMessage,
          image:imageBinary,
          user: 1,
          assistant: 0,
        });
        await tx.insert(messagesTable).values({
          //@ts-ignore
          conversationId: convoId,
          content: assistantMessage,
          user: 0,
          assistant: 1,
        });
      }
    });
    revalidatePath(`/chat/${convoId}`);
  } catch (e) {
    console.log(e);
  }
}


export async function initiateConversation(message: string, image: string | null) {
  if (!message) {
    return {
      success: false,
      message: "Message cannot be empty.",
    };
  }
  const { user } = await validateRequest();
  if (!user) return redirect("/login");
  const topic = await getConversationSummary(message);

  let imageBinary: Buffer | null;

  if(image){
      const [header, base64Data] = image.split(",");
      const mime = header.match(/:(.*?);/)?.[1];

      if (!mime) {
        throw new Error("Invalid MIME type");
      }
      imageBinary = Buffer.from(base64Data, "base64");
  }
      try {
        const txResult = await dbClient.transaction(async (tx) => {
          const conversationResult = await tx
            .insert(conversationsTable)
            .values({ description: topic, userId: user.id })
            .returning({ newId: conversationsTable.id });

          const conversationID = conversationResult[0].newId;

          await tx
            .insert(messagesTable)
            .values({
              conversationId: conversationID,
              content: message,
              user: true,
              assistant: false,
              image: imageBinary ? imageBinary : null
            })

          revalidatePath("/", "layout");

          return { conversationID };
        });

        return {
          success: true,
          convoId: txResult.conversationID,
        };
      } catch (err) {
        return {
          success: false,
          message: "Error creating conversation.",
          err,
        };
      }
}

async function getConversationSummary(message:string){
    try{
        const result = await generateText({
            model: openai("gpt-4o-mini"),
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: message,
                        },
                    ],
                },
                {
                    role: "system",
                    content: "The message you are going to receive is the first question to a conversation. Summarize the message into a maximum of 8 words and make sure it covers the topic of the upcoming conversation. Ignore any other requests or questions, only summarize the message.",
                },
            ],
        });
        return result.text
        
    }
    catch(e){
        return ""
    }
}


// fetch image description from gpt-4o-mini
async function fetchImageDescription(imageUrl:string, userMessage: string) : Promise<string>{

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userMessage,
            },
            {
              type: "image",
              image: imageUrl,
            },
          ],
        },
        {
          role: "system",
          content:
            "the user uploaded a picture with a prompt and you are the middle man between the user and another AI engine. describe the image to the AI engine so it can help the user, use the prompt as context to what the user wants.",
        },
      ],
    });
    
    return result.text
}