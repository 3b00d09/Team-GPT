interface createConversationApi{
    success: boolean,
    message: string,
    error?: string
}


export interface MessagesData {
    content: string;
    user: boolean;
    assistant: boolean;
    file?: fileDataType ;
};

export interface NewMessageData{
    content: string;
    file?: fileDataType
}

export type fileDataType = {
    url: string,
    mimeType: string,
} | null