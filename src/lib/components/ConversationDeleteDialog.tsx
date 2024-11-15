import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
  import { Button } from "@/components/ui/button"
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
  
  export function ConversationDeleteDialog({id, description}: {id: number, description: string}) {
    async function handleDelete(){
        const req = await fetch(`/api/delete-convo/${id}`)
        const res = await req.json()
        console.log(res)
    }
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild  className="invisible group-hover:visible">
          <FontAwesomeIcon icon={faCircleXmark}/>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="text-red-600">This action cannot be undone.</span> 
              his will permanently delete <span className="font-bold">{`"${description}"`}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
  