import { DATABASE_ID, MEMBERS_ID } from "@/config";
import { Query, type Databases } from "node-appwrite";

interface GetMemberProps {
    databases: Databases;
    workspaceId: string;
    userId: string;
}

export const getMember = async ({
    databases,
    workspaceId,
    userId
}: GetMemberProps) => {
    if (!workspaceId || !userId) {
        throw new Error("workspaceId and userId are required to get a member");
    }
    const member = await databases.listDocuments(
        DATABASE_ID,
        MEMBERS_ID,
        [
            Query.equal("workspaceId", workspaceId),
            Query.equal("userId", userId)
        ]
    );
    return member.documents[0];
}     