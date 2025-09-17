"use client";
import { ArrowUpDown, MoreVertical } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table";
import { Task } from "../types";
import { Button } from "@/components/ui/button";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { TaskDate } from "./task-date";
import { Badge } from "@/components/ui/badge";
import { snakeCaseToTitleCase } from "@/lib/utils";
import { TaskActions } from "./task-actions";

export const columns: ColumnDef<Task>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Task Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <p className="line-clamp-1">{row.original.name ?? "—"}</p>
        ),
    },
    {
        accessorKey: "project",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Project
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const project = row.original.project;
            if (!project) {
                return <p className="text-muted-foreground">No project</p>;
            }
            return (
                <div className="flex items-center gap-x-2 text-sm font-medium">
                    <ProjectAvatar
                        className="size-6"
                        name={project.name}
                        image={project.image}
                    />
                    <p className="line-clamp-1">{project.name}</p>
                </div>
            );
        },
    },
    {
        accessorKey: "assignee",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Assignee
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const assignee = row.original.assignee;
            if (!assignee) {
                return <p className="text-muted-foreground">Unassigned</p>;
            }
            return (
                <div className="flex items-center gap-x-2 text-sm font-medium">
                    <MemberAvatar
                        className="size-6"
                        name={assignee.name}
                        fallbackClassName="text-xs"
                    />
                    <p className="line-clamp-1">{assignee.name}</p>
                </div>
            );
        },
    },
    {
        accessorKey: "dueDate",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Due Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <TaskDate value={row.original.dueDate} />,
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Status
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const status = row.original.status ?? "unknown";
            return (
                <Badge variant={status}>
                    {snakeCaseToTitleCase(status)}
                </Badge>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const id = row.original.$id;
            const projectId = row.original.project?.$id ?? row.original.projectId; // ✅ safe
            return (
                <TaskActions id={id} projectId={projectId}>
                    <Button variant={"ghost"} className="size-8 p-0">
                        <MoreVertical className="size-4" />
                    </Button>
                </TaskActions>
            );
        },
    },
];
