"use server";

import { revalidatePath } from "next/cache";
import { dbClient } from "./db/db";
import { messagesTable } from "./db/schema";
import { utapi } from "./uploadthing";

import { createStreamableValue } from "ai/rsc";
import { CoreMessage, CoreUserMessage, generateText, ImagePart, streamText, UserContent } from "ai";
import { openai } from "@ai-sdk/openai";
import { messageRow } from "./db/schemaTypes";
import { validateRequest } from "./auth/auth";
import { redirect } from "next/navigation";

import { anthropic } from "@ai-sdk/anthropic";
import { imageBase64ToFile } from "./utils";

export async function sendMessage(
  messages: messageRow[],
  convoId: number,
  image?: { image: string; name: string } | null,
  newMessage: boolean = false
) {
  const { user } = await validateRequest();
  if (!user) {
    return redirect("/login");
  }

  let imageUrl: URL | null = null;
  let imageFile: File | null = null;
  const coreMessages: CoreMessage[] = messages.map((message) => {
    return {
      content: message.content,
      role: message.user ? "user" : "assistant",
    };
  });

  if (image && image.image) {
    try {
      const [header, base64Data] = image.image.split(",");
      const mime = header.match(/:(.*?);/)?.[1];

      if (!mime) {
        throw new Error("Invalid MIME type");
      }

      const binaryData = Buffer.from(base64Data, "base64");
      imageFile = new File([binaryData], image.name, { type: mime });

      const res = await utapi.uploadFiles(imageFile);
      if (res.data && res.data.url) imageUrl = new URL(res.data.url);
    } catch (e) {
      console.error("Failed to upload image:", e);
    }
  }

  // this array of content will hold the image for us in case we have one
  const customContent: ImagePart[] = [];

  if (imageUrl) {
    customContent.push({ type: "image", image: imageUrl });
  }
  const stream = createStreamableValue();
  (async () => {
    const { textStream } = await streamText({
      model: openai("gpt-4o-2024-05-13"),
      messages: [
        ...coreMessages,
        {
          role: "user",
          content: [...customContent],
        },
      ],
      system: "You are a helpful assistant.",
    });

    let AIMessage: string = "";
    for await (const text of textStream) {
      stream.update(text);
      AIMessage = AIMessage + text;
    }

    stream.done();
    await updateDatabase(
      messages[messages.length - 1].content as string,
      imageUrl ? imageUrl.href : "",
      AIMessage,
      convoId,
      newMessage
    );
    revalidatePath(`/chat/${convoId}`);
  })();

  return {
    newMessage: stream.value,
  };
}

export async function sendClaudeMessage(messages: messageRow[], convoId: number, image?: { image: string; name: string } | null, newMessage: boolean = false) {
  
    const { user } = await validateRequest();
    if (!user) return redirect("/login");

    let imageUrl: URL | null = null;

    const coreMessages: CoreMessage[] = messages.map((message) => {
        return {
            content: message.content,
            role: message.user ? "user" : "assistant",
        };
    });

    if (image && image.image) {
        try {
        
        const imageFile = imageBase64ToFile(image)

        const res = await utapi.uploadFiles(imageFile);
        if (res.data && res.data.url) imageUrl = new URL(res.data.url);
        } catch (e) {
            console.error("Failed to upload image:", e);
        }
    }

    if (imageUrl) {
        // anthropic doesnt support images so we have to fetch a description from GPT
        const imageDesc = await fetchImageDescription(imageUrl.href, messages[0].content)

        // merge the last message with the image description in 1 message object otherwise we get two "user" messages in a row which throws an err
        coreMessages[coreMessages.length - 1].content = [
          {
            type: "text",
            text: messages[messages.length - 1].content,
          },
          {
            type: "text",
            text:`image description: ${imageDesc}`
          }
        ];
    }

    const stream = createStreamableValue();
    try{
        (async () => {
            const { textStream } = await streamText({
            model: anthropic("claude-3-opus-20240229"),
            messages: [
                ...coreMessages,
            ],
            system: "You are a helpful assistant.",
            });

            let AIMessage: string = "";
            for await (const text of textStream) {
            stream.update(text);
            AIMessage = AIMessage + text;
            }

            stream.done();
            await updateDatabase(
            messages[messages.length - 1].content as string,
            imageUrl ? imageUrl.href : "",
            AIMessage,
            convoId,
            newMessage
            );
            revalidatePath(`/chat/${convoId}`);
        })();
    }
    catch(e){
        stream.done()
    }
    
    return {
        newMessage: stream.value,
    };
}

async function updateDatabase(
  userMessage: string,
  imageUrl: string,
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
          imageUrl: imageUrl,
          user: 0,
          assistant: 1,
        });
      } else {
        await tx.insert(messagesTable).values({
          //@ts-ignore
          conversationId: convoId,
          content: userMessage,
          imageUrl: imageUrl,
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