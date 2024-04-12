import OpenAI from "openai";
const openai = new OpenAI({
apiKey: process.env.OPENAI_KEY,
});

async function sendMessage(formData: FormData) {
"use server"
const message = formData.get("message");
    if(message){
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

        console.log(completion)
        console.log(completion.choices[0].message.content)
    }
}

export default async function ChatPage() {

  return (
    <div className="grid flex-1 grid-rows-[10fr_1fr]">
        <div className="justify-self-center">replies here</div>
        <form className="self-end justify-self-center w-1/2" action={sendMessage}>
            <input 
                name="message"
                className="w-full p-4 rounded-lg bg-transparent border border-slate-600" 
                placeholder="Message ChatGPT..." 
                type="text" 
                >
            </input>
        </form>

    </div>
  );
}

