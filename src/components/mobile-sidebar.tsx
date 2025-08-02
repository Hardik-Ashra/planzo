"use client"
import { MenuIcon } from "lucide-react"
import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet"
import { Sidebar } from "./sidebar"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
export const MobileSidebar = () => {
    const [isOpen,setIsOpen]=useState(false);
    const pathname=usePathname();

    useEffect(()=>{
        setIsOpen(false);
    },[pathname])
    return (
         <Sheet modal={false} onOpenChange={setIsOpen} open={isOpen}>
            <SheetTrigger asChild>
                <Button variant="secondary" className="lg:hidden">
                    <MenuIcon className="size-4 text-neutral-500" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 ">
                <SheetHeader className="hidden">
                        <SheetTitle>Mobile Sidebar</SheetTitle>
                </SheetHeader>
                <Sidebar />
            </SheetContent>
        </Sheet>
    )
}
