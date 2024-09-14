interface createConversationApi{
    success: boolean,
    message: string,
    error?: string
}

export interface MessagesData {
    content: string;
    user: boolean;
    assistant: boolean;
    imageUrl: string | null;
};
