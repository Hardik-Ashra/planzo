"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { createProjectSchema } from "../schemas";
import { useCreateProject } from "../api/use-create-project";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DottedSeparator } from "@/components/dotted-separator";
import { cn } from "@/lib/utils";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

interface CreateProjectFormProps {
    onCancel?: () => void;
}


export const CreateProjectForm = ({ onCancel }: CreateProjectFormProps) => {
    const router = useRouter();
    const workspaceId = useWorkspaceId();
    const { mutate, isPending } = useCreateProject();

    const inputRef = useRef<HTMLInputElement>(null);

    const projectSchemaWithoutWorkspaceId = createProjectSchema.omit({ workspaceId: true });
    const form = useForm<z.infer<typeof projectSchemaWithoutWorkspaceId>>({
        resolver: zodResolver(projectSchemaWithoutWorkspaceId),
        defaultValues: {
            name: "",
        }
    });
    const onSubmit = (values: z.infer<typeof projectSchemaWithoutWorkspaceId>) => {

        const finalValues = {
            ...values,
            workspaceId,
            image: values.image instanceof File ? values.image : "",
        }
        if (!workspaceId) {
            toast.error("WorkspaceId required")
            return
        }
        mutate({ form: finalValues }, {
            onSuccess: ({ data }) => {
                form.reset();
                router.push(`/workspaces/${workspaceId}/projects/${data.$id}`)
            }
        })
    };


    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 1 * 1024 * 1024) {
            toast.error("File size must be less than 1MB.");
            e.target.value = "";
            return;
        }

        form.setValue("image", file);
    };

    const file = form.watch("image");

    return (
        <Card className="w-full h-full border-none shadow-none">
            <CardHeader className="flex p-7">
                <CardTitle className="text-xl font-bold">Create a new project</CardTitle>
            </CardHeader>

            <div className="px-7">
                <DottedSeparator />
            </div>

            <CardContent className="p-7">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
                        {/* Project Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Enter project name" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Project Icon */}
                        <FormField
                            control={form.control}
                            name="image"
                            render={({ field }) => (
                                <div className="flex flex-col gap-y-2">
                                    <div className="flex items-center gap-x-5">
                                        {file ? (
                                            <div className="size-[72px] relative rounded-md overflow-hidden">
                                                <Image
                                                    alt="LOGO"
                                                    fill
                                                    className="object-cover"
                                                    src={file instanceof File ? URL.createObjectURL(file) : file}
                                                />
                                            </div>
                                        ) : (
                                            <Avatar className="size-[72px]">
                                                <AvatarFallback>
                                                    <ImageIcon className="size-[36px]" />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}

                                        <div className="flex flex-col">
                                            <p className="text-sm">Project Icon</p>
                                            <p className="text-sm text-muted-foreground">JPG, PNG, JPEG - Max 1MB</p>

                                            <input
                                                ref={inputRef}
                                                className="hidden"
                                                type="file"
                                                accept=".jpg,.png,.jpeg"
                                                onChange={handleImageChange}
                                                disabled={isPending}
                                            />

                                            {field.value ? (
                                                <Button
                                                    type="button"
                                                    disabled={isPending}
                                                    variant="destructive"
                                                    size="xs"
                                                    className="w-fit mt-2"
                                                    onClick={() => {
                                                        field.onChange(null);
                                                        if (inputRef.current) inputRef.current.value = "";
                                                    }}
                                                >
                                                    Remove Image
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    disabled={isPending}
                                                    variant="teritary"
                                                    size="xs"
                                                    className="w-fit mt-2"
                                                    onClick={() => inputRef.current?.click()}
                                                >
                                                    Upload Image
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        />

                        <DottedSeparator className="py-7" />

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between">
                            <Button
                                type="button"
                                size="lg"
                                variant="secondary"
                                onClick={onCancel}
                                disabled={isPending}
                                className={cn(!onCancel && "invisible")}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" size="lg" disabled={isPending}>
                                Create Project
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};
