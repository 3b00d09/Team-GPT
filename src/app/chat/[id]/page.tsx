import Something from "@/lib/components/Something";
import MessagesContainer from "@/lib/components/MessagesContainer";

type props = {
    params:{
        id: string
    },
    searchParams: { [key: string]: string | undefined } 
}


export default function Page(props: props) {

    return(
        <Something {...props}>
            <MessagesContainer {...props}/>
        </Something>
    )

}
