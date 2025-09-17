import { getCurrent } from "@/features/auth/queries";
import { redirect } from "next/navigation";
import { WorkspaceIDJoinClient } from "./client";

const WorkspaceIDJoinPage = async () => {
    const user = await getCurrent();
    if (!user) redirect("/sign-in");
    return (
       <WorkspaceIDJoinClient/>
    );
}
export default WorkspaceIDJoinPage;