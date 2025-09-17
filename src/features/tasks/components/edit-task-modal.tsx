"use client"
import { ResponsiveModel } from "@/components/responsive-model";
import { useEditTaskModal } from "../hooks/use-edit-task-model";
import { EditTaskFormWrapper } from "./edit-task-form-wrapper";

export const EditTaskModal = () => {
    const {taskId,close } = useEditTaskModal()

    return (
        <ResponsiveModel open={!!taskId} onOpenChange={close}>
            {taskId &&
            (  <EditTaskFormWrapper onCancel={close} id={taskId}/>)
            }
        
        </ResponsiveModel>
    )
}