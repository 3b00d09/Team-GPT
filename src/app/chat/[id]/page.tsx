import Something from "@/lib/components/Something";
import MessagesContainer from "@/lib/components/MessagesContainer";
import { Suspense } from "react";

type props = {
    params:{
        id: string
    },
    searchParams: { [key: string]: string | undefined } 
}


export default function Page(props: props) {

    return(
        <Suspense fallback={<p>Loading...</p>}>
            <Something {...props}>
                <MessagesContainer {...props}/>
            </Something>
        </Suspense>
    )

}
