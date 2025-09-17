"use client"
import { DottedSeparator } from "@/components/dotted-separator"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs"
import { TabsTrigger } from "@/components/ui/tabs"
import { ClipboardList, Loader, PlusIcon } from "lucide-react"
import { useCreateTaskModal } from "../hooks/use-create-task-modal"
import { useGetTasks } from "../api/use-get-tasks"
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id"
import { useQueryState } from "nuqs"
import { DataFilters } from "./data-filters"
import { useTaskFilters } from "../hooks/use-task-filters"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { DataKanban } from "./data-kanban"
import { useCallback } from "react"
import { TaskStatus } from "../types"
import { useBulkUpdateTask } from "../api/use-bulk-update-task"
import { DataCalendar } from "./data-calendar"
import { useProjectId } from "@/features/projects/hooks/use-project-id"
interface TaskViewSwitcherProps {
  hideProjectFilter?: boolean;
}
export const TaskViewSwitcher = ({ hideProjectFilter}: TaskViewSwitcherProps) => {

  const [{
    status,
    assigneeId,
    projectId,
    dueDate
  }] = useTaskFilters();
  const [view, setView] = useQueryState("task-view", {
    defaultValue: "table"
  })
  const workspaceId = useWorkspaceId();
  const paramProjectId = useProjectId();
  const { mutate: bulkUpdate } = useBulkUpdateTask()
  const { data: tasks,
    isLoading: isLoadingTasks
  } = useGetTasks({
    workspaceId,
    projectId: paramProjectId || projectId,
    status,
    assigneeId,
    dueDate
  })

  const onKanbanChange = useCallback((tasks:
    { $id: string; status: TaskStatus; position: number; }[]) => {
    bulkUpdate({
      json: { tasks }
    })
  }, [bulkUpdate])
  const { open } = useCreateTaskModal()
  const documents = tasks?.documents ?? []
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-[200px] border rounded-lg text-center text-muted-foreground">
      <ClipboardList className="size-8 mb-2" />
      <p className="text-sm">No tasks found</p>
    </div>
  )
  return (

    <Tabs defaultValue={view}
      onValueChange={setView}
      className="flex-1 w-full border rounded-lg">
      <div className="h-full flex flex-col overflow-auto p-4">
        <div className="flex flex-col gap-y-2 lg:flex-row justify-between items-center">
          <TabsList className="w-full lg:w-auto">
            <TabsTrigger className="h-8 w-full lg:w-auto" value="table">
              Table
            </TabsTrigger>
            <TabsTrigger className="h-8 w-full lg:w-auto" value="kanban">
              Kanban
            </TabsTrigger>
            <TabsTrigger className="h-8 w-full lg:w-auto" value="calendar">
              Calendar
            </TabsTrigger>
          </TabsList>
          <Button
            onClick={open}
            size={"sm"}
            className="w-full lg:w-auto">
            <PlusIcon className="size-4 mr-2" />
            New
          </Button>
        </div>
        <DottedSeparator className="my-4" />
        <DataFilters hideProjectFilter={hideProjectFilter} />
        <DottedSeparator className="my-4" />
        {isLoadingTasks ? (
          <div className="w-full border rounded-lg h-[200px] flex items-center justify-center">
            <Loader className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <TabsContent value="table" className="mt-0">
              <DataTable columns={columns} data={tasks?.documents ?? []} />
            </TabsContent>
            <TabsContent value="kanban" className="mt-0">
              <DataKanban data={tasks?.documents ?? []} onChange={onKanbanChange} />
            </TabsContent>
            <TabsContent value="calendar" className="mt-0 h-full pb-4">
              <DataCalendar data={tasks?.documents ?? []} />
            </TabsContent>
          </>
        )}
        {/* {isLoadingTasks ? (
                    <div className="w-full border rounded-lg h-[200px] justify-center flex flex-col items-center">
                        <Loader className="size-5 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <TabsContent value="table" className="mt-0">
                            <DataTable columns={columns} data={tasks?.documents ?? []} />
                        </TabsContent>
                        <TabsContent value="kanban" className="mt-0">
                            <DataKanban data={tasks?.documents ?? []} onChange={onKanbanChange} />
                        </TabsContent>
                        <TabsContent value="calendar" className="mt-0 h-full pb-4">
                            <DataCalendar data={tasks?.documents ?? []} />
                        </TabsContent>
                    </>)} */}
      </div>
    </Tabs>
  )
}
