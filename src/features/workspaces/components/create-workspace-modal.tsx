"use client";

import { ResponsiveModel } from "@/components/responsive-model";
import { CreateWorkspaceForm } from "./create-workspace-form";
import { useCreateWorkspaceModal } from "../hooks/use-create-workspace-modal";

import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export const CreateWorkspaceModal = () => {
  const { isOpen, setIsOpen, close } = useCreateWorkspaceModal();

  return (
    <ResponsiveModel open={isOpen} onOpenChange={setIsOpen}>
      <DialogHeader>
        <DialogTitle>
          <VisuallyHidden>Create Workspace</VisuallyHidden>
        </DialogTitle>
      </DialogHeader>

      <CreateWorkspaceForm onCancel={close} />
    </ResponsiveModel>
  );
};
