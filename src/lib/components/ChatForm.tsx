"use client"

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useRef } from "react";
import { faArrowUpFromBracket } from "@fortawesome/free-solid-svg-icons";

type props = {
  formSubmit?: (file: File | null, userLatestMessage: string) => Promise<void>;
};

const allowedImageTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];
export default function ChatForm({ formSubmit }: props) {
    const [file, setFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string>("");

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const chatForm = useRef<HTMLFormElement>(null);
    const fileUploadRef = useRef<HTMLInputElement>(null);


    const forwardFileEvent = (e: React.MouseEvent<SVGSVGElement>) => {
          if (fileUploadRef.current) {
            fileUploadRef.current.click();
          }
    };

    const handleFileSubmission = (e: React.MouseEvent<HTMLInputElement>) => {
      if (fileUploadRef.current) {
        setFile(fileUploadRef.current.files![0]);
        setPreviewImage(URL.createObjectURL(fileUploadRef.current.files![0]));
      }
    };

    const handleTextareaPaste = (e:React.ClipboardEvent<HTMLTextAreaElement>) =>{
      const clipboadData = e.clipboardData.items;
      if(clipboadData.length === 0) return

      const items = Array.from(clipboadData)
      items.forEach((item)=>{
        if(item.kind === "file" && item.type.startsWith("image/")){
          if(!allowedImageTypes.includes(item.type)) return
        
          const image = item.getAsFile()
          if(image){
            setFile(image)
            setPreviewImage(URL.createObjectURL(image))
          }
        }
      })
    }

    const handleTextareaInput = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.currentTarget.style.height = "auto";
      e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
    }

    const checkTextareaSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { 
        if(e.key === "Enter" && !e.shiftKey && (e.currentTarget.value.trim().length > 0 || file)){
            // simulate a submit event on the form
            chatForm.current?.dispatchEvent(new Event("submit", {bubbles: true}))
        }
    }

    const handleFormSubmit = async(e:React.FormEvent<HTMLFormElement>) =>{
      e.preventDefault()
      if (inputRef.current) {
        inputRef.current.disabled = true;

        await formSubmit!(file, inputRef.current.value);

        if (inputRef) {
          inputRef.current.disabled = false;
          inputRef.current.value = "";
          inputRef.current.style.height = "auto";
          setFile(null);
          setPreviewImage("");
        }
      }
    }
    
    return (
      <form
        className="flex self-end justify-self-center w-1/2"
        onSubmit={handleFormSubmit}
        ref={chatForm}
      >
        <div className="relative flex-grow">
          <Textarea
            name="message"
            className="p-4 pr-10 rounded-md bg-transparent border resize-none overflow-auto border-slate-600 text-base w-full animate-height max-h-[10rem]"
            placeholder="Message AI..."
            ref={inputRef}
            onInput={handleTextareaInput}
            onKeyDown={checkTextareaSubmit}
            onPaste={handleTextareaPaste}
            autoComplete="off"
          />
          <div className="absolute bottom-2 right-0 pr-3 flex items-center pointer-events-none">
            <FontAwesomeIcon
              icon={faArrowUpFromBracket}
              className="text-lg text-gray-400 z-10 pointer-events-auto cursor-pointer hover:text-gray-600"
              onClick={forwardFileEvent}
            />
          </div>
          {previewImage && (
            <img
              src={previewImage}
              className="absolute object-contain top-[0px] left-[-45px] w-12 border border-slate-600"
            />
          )}
        </div>

        <Input
          onInput={handleFileSubmission}
          ref={fileUploadRef}
          name="image"
          type="file"
          accept="image/png, image/jpg, image/jpeg"
          className="hidden"
        />

        <button className="hidden" type="submit">
          Send
        </button>
      </form>
    );
}