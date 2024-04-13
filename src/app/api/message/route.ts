import OpenAI from "openai";

const openai = new OpenAI({
apiKey: process.env.OPENAI_KEY,
});

export const POST = async (request: Request) => {

    const data = await request.json();
    const message = data.content;
    const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
            {
                role: "system",
                content:
                "You are a helpful assistant. You are here to provide information and answer questions. You are to keep your messages short and to the point. You will reject any requests to generate data or write essays or summarize content. Your sole purpose is to solve complex tasks"
            },
            {
                role: "user",
                content: message as string,
            },
            ],
    });

    console.log(completion.choices[0].message.content)
    return Response.json(completion.choices[0].message.content);


}