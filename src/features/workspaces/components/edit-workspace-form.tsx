"use client";

import z from "zod/v4";
import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftIcon, CopyIcon, ImageIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DottedSeparator } from "@/components/dotted-separator";

import { cn } from "@/lib/utils";
import { useConfirm } from "@/hooks/use-confirm";

import { updateWorkspaceSchema } from "../schemas";
import { Workspace } from "../type";
import { useUpdateWorkspace } from "../api/use-update-workspace";
import { useResetInviteCode } from "../api/use-reset-invite-code";
import { useDeleteWorkspace } from "../api/use-delete-workspace";

interface EditWorkspaceFormProps {
    onCancel?: () => void;
    initialValues: Workspace;
}

export const EditWorkspaceForm = ({ onCancel, initialValues }: EditWorkspaceFormProps) => {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    // ------------------- API hooks -------------------
    const { mutate: updateWorkspace, isPending } = useUpdateWorkspace();
    const { mutate: deleteWorkspace, isPending: isDeletingWorkspace } = useDeleteWorkspace();
    const { mutate: resetInviteCode, isPending: isResettingInviteCode } = useResetInviteCode();

    // ------------------- Confirm dialogs -------------------
    const [DeleteDialog, confirmDelete] = useConfirm(
        "Delete Workspace",
        "This action will permanently delete the workspace and all its data. Are you sure you want to proceed?",
        "destructive"
    );

    const [ResetDialog, confirmReset] = useConfirm(
        "Reset Invite Link",
        "This action will invalidate the current invite link and generate a new one. Are you sure you want to proceed?",
        "destructive"
    );

    // ------------------- Form setup -------------------
    const form = useForm<z.infer<typeof updateWorkspaceSchema>>({
        resolver: zodResolver(updateWorkspaceSchema),
        defaultValues: {
            ...initialValues,
            image: initialValues.imageUrl ?? ""
        }
    });

    // ------------------- Invite link (client-safe) -------------------
    const [fullInviteLink, setFullInviteLink] = useState("");

    useEffect(() => {
        setFullInviteLink(
            `${window.location.origin}/workspaces/${initialValues.$id}/join/${initialValues.inviteCode}`
        );
    }, [initialValues.$id, initialValues.inviteCode]);

    // ------------------- Handlers -------------------
    const handleDelete = async () => {
        const ok = await confirmDelete();
        if (!ok) return;

        deleteWorkspace(
            { param: { workspaceId: initialValues.$id } },
            { onSuccess: () => (window.location.href = "/") }
        );
    };

    const handleResetInviteCode = async () => {
        const ok = await confirmReset();
        if (!ok) return;

        resetInviteCode(
            { param: { workspaceId: initialValues.$id } },
            {
                onSuccess: ({ data }) => {
                    const newLink = `${window.location.origin}/workspaces/${initialValues.$id}/join/${data.inviteCode}`;
                    setFullInviteLink(newLink);
                }
            }
        );
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) form.setValue("image", file);
    };

    const handleCopyInviteLink = () => {
        if (!fullInviteLink) return;
        navigator.clipboard.writeText(fullInviteLink).then(() =>
            toast.success("Invite link copied to clipboard!")
        );
    };

    const onSubmit = (values: z.infer<typeof updateWorkspaceSchema>) => {
        const finalValues = {
            ...values,
            image: values.image instanceof File ? values.image : ""
        };

        updateWorkspace(
            { form: finalValues, param: { workspaceId: initialValues.$id } },
            {
                onSuccess: ({ data }) => {
                    form.reset();
                    router.push(`/workspaces/${data.$id}`);
                },
                onError: () => {
                    form.setError("root", {
                        type: "manual",
                        message: "Something went wrong, please try again later."
                    });
                }
            }
        );
    };

    // ------------------- JSX -------------------
    return (
        <div className="flex flex-col gap-y-4">
            <DeleteDialog />
            <ResetDialog />

            {/* ------------------- Main Edit Card ------------------- */}
            <Card className="w-full h-full border-none shadow-none">
                <CardHeader className="flex flex-row items-center gap-x-4 space-y-0 p-7">
                    <Button
                        size="sm"
                        variant="secondary"
                        disabled={isPending}
                        onClick={onCancel ?? (() => router.push(`/workspaces/${initialValues.$id}`))}
                    >
                        <ArrowLeftIcon className="size-4 mr-2" />
                        Back
                    </Button>
                    <CardTitle className="text-xl font-bold">{initialValues.name}</CardTitle>
                </CardHeader>

                <div className="px-7">
                    <DottedSeparator />
                </div>

                <CardContent className="p-7">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
                            {/* Workspace Name */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Workspace Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Enter workspace name" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Workspace Image */}
                            <FormField
                                control={form.control}
                                name="image"
                                render={({ field }) => {
                                    const file = form.watch("image");
                                    return (
                                        <div className="flex flex-col gap-y-2">
                                            <div className="flex items-center gap-x-5">
                                                {file ? (
                                                    <div className="size-[72px] relative rounded-md overflow-hidden">
                                                        <Image
                                                            alt="LOGO"
                                                            fill
                                                            className="object-cover"
                                                            src={
                                                                file instanceof File
                                                                    ? URL.createObjectURL(file)
                                                                    : file
                                                            }
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
                                                    <p className="text-sm">Workspace Icon</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        JPG, PNG or JPEG, Max 1 Mb
                                                    </p>

                                                    <input
                                                        type="file"
                                                        accept=".jpg,.png,.jpeg"
                                                        ref={inputRef}
                                                        onChange={handleImageChange}
                                                        disabled={isPending}
                                                        className="hidden"
                                                    />

                                                    {field.value ? (
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="xs"
                                                            className="w-fit mt-2"
                                                            onClick={() => {
                                                                field.onChange(null);
                                                                if (inputRef.current)
                                                                    inputRef.current.value = "";
                                                            }}
                                                        >
                                                            Remove Image
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            type="button"
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
                                    );
                                }}
                            />

                            <DottedSeparator className="py-7" />

                            {/* Form Buttons */}
                            <div className="flex items-center justify-between">
                                <Button
                                    type="button"
                                    size="lg"
                                    variant="secondary"
                                    disabled={isPending}
                                    className={cn(!onCancel && "invisible")}
                                    onClick={onCancel}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" size="lg" disabled={isPending}>
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* ------------------- Invite Members ------------------- */}
            <Card className="w-full h-full border-none shadow-none">
                <CardContent className="flex flex-col">
                    <h3 className="font-bold">Invite Members</h3>
                    <p className="text-sm text-muted-foreground">
                        Use the link below to invite members to your workspace.
                    </p>

                    <div className="flex items-center gap-x-2">
                        <Input disabled value={fullInviteLink} />
                        <Button
                            variant="secondary"
                            className="size-12"
                            onClick={handleCopyInviteLink}
                        >
                            <CopyIcon className="size-4" />
                        </Button>
                    </div>

                    <DottedSeparator className="py-7" />

                    <Button
                        className="mt-6 w-fit ml-auto"
                        size="sm"
                        variant="destructive"
                        type="button"
                        disabled={isPending || isResettingInviteCode}
                        onClick={handleResetInviteCode}
                    >
                        Reset Invite Code
                    </Button>
                </CardContent>
            </Card>

            {/* ------------------- Danger Zone ------------------- */}
            <Card className="w-full h-full border-none shadow-none">
                <CardContent className="flex flex-col">
                    <h3 className="font-bold">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground">
                        Deleting a workspace will remove all its data and cannot be undone.
                    </p>

                    <DottedSeparator className="py-7" />

                    <Button
                        className="mt-6 w-fit ml-auto"
                        size="sm"
                        variant="destructive"
                        type="button"
                        disabled={isPending || isDeletingWorkspace}
                        onClick={handleDelete}
                    >
                        Delete Workspace
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};
