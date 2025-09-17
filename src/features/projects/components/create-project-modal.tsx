"use client";

import { ResponsiveModel } from "@/components/responsive-model";
import { CreateProjectForm } from "./create-project-form";
import { useCreateProjectModal } from "../hooks/use-create-project-modal";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export const CreateProjectModal = () => {
  const { isOpen, setIsOpen, close } = useCreateProjectModal();

  return (
    <ResponsiveModel open={isOpen} onOpenChange={setIsOpen}>
      <DialogHeader>
        <DialogTitle>
          <VisuallyHidden>Create Project</VisuallyHidden>
        </DialogTitle>
      </DialogHeader>

      <CreateProjectForm onCancel={close} />
    </ResponsiveModel>
  );
};
