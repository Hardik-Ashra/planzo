import { useMedia } from 'react-use';

import {
    Dialog,
    DialogContent,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
} from "@/components/ui/drawer";


interface ResponsiveModelProps {
    children: React.ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ResponsiveModel = ({
    children,
    open,
    onOpenChange
}: ResponsiveModelProps) => {
    const isDesktop = useMedia('(min-width: 1024px)', true);

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange} >
                <DialogTitle className="hidden">
                    Responsive Modal
                </DialogTitle>
                <DialogContent aria-describedby='create new workspace' className="w-full sm:max-w-lg p-0 border-none overflow-y-auto hidden-scrollbar max-h-[85vh]">
                    {children}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <div className="overflow-y-auto hidden-scrollbar max-h-[85vh]">
                    {children}
                </div>
            </DrawerContent>
        </Drawer>
    );
}