"use client"

import { Avatar, AvatarFallback} from "@radix-ui/react-avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

import { DottedSeparator } from "@/components/dotted-separator"

import { useLogout } from "../api/use-logout"
import { useCurrent } from "../api/use-current"
import { Loader, LogOut } from "lucide-react"

export const UserButton = () => {
    const { data: user, isLoading } = useCurrent();
    const {mutate:logout}=useLogout()
    if (isLoading) {
        return (
            <div className="size-10 rounded-full flex items-center justify-center bg-neutral-200 border border-neutral-300">
                <Loader className="size-4 animate-spin text-muted-foreground" />
            </div>
        )
    }
    if (!user) {
        return null;
    }
    const { name, email } = user;
    const avatarFallback = name
        ? name.charAt(0).toUpperCase()
        : email.charAt(0).toUpperCase() ?? "U";
    return (
<DropdownMenu modal={false}>
    <DropdownMenuTrigger className="outline-none relative">
        <Avatar className="size-10 rounded-full flex items-center justify-center border border-neutral-300 bg-neutral-200 transition hover:opacity-80">
            <AvatarFallback className=" font-medium text-neutral-600 flex items-center justify-center">
                {avatarFallback}
            </AvatarFallback>
        </Avatar>
    </DropdownMenuTrigger>
    <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={10}
        className="w-60"
    >
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-5">
            <Avatar className="size-14 rounded-full flex items-center justify-center border  border-neutral-300 bg-neutral-200  shadow-sm transition hover:opacity-90">
                <AvatarFallback className="text-xl font-semibold text-neutral-600 flex items-center justify-center">
                    {avatarFallback}
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center justify-center">
              <p className="text-sm font-medium text-neutral-900"> 
                {name||"User"}
                </p> 
                <p className="text-xs text-neutral-500">
                    {email}
                </p>
            </div>
        </div>
        <DottedSeparator className="mb-1"/>
        <DropdownMenuItem
        onClick={()=>logout()}
         className="h-10 flex items-center justify-center text-amber-700 font-medium cursor-pointer">
            <LogOut className="size-4 mr-2"/>
            Log out
        </DropdownMenuItem>
    </DropdownMenuContent>
</DropdownMenu>

    )

}

