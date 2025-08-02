import { getCurrent } from "@/features/auth/queries";
import { JoinWorkspaceForm } from "@/features/workspaces/components/join-workspace-form";
import { getWorkspaceInfo } from "@/features/workspaces/queries";
import { redirect } from "next/navigation";

interface WorkspaceIDJoinPageProps {
    params: {
        workspaceId: string;
    }
}

const WorkspaceIDJoinPage = async ({
    params,
}: WorkspaceIDJoinPageProps) => {
    const { workspaceId } = await params;
    const user = await getCurrent();
    if (!user) redirect("/sign-in");

    const initialValues = await getWorkspaceInfo({workspaceId});

    if (!initialValues) {
        redirect("/");
    }
    return (
        <div className="w-full lg:max-w-xl">
            <JoinWorkspaceForm initialValues={initialValues} />
        </div>
    );
}
export default WorkspaceIDJoinPage;