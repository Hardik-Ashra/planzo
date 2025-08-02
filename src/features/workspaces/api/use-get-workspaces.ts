import { useQuery } from "@tanstack/react-query";

import {client} from "@/lib/rpc"
import { th } from "date-fns/locale";

export const useGetWorkspaces=()=>{
    const query=useQuery({
        queryKey:["workspaces"],
        queryFn:async()=>{
            const response=await client.api.workspaces.$get();

            if(!response.ok){
              throw new Error("Failed to fetch workspaces");
            }

            const {data}=await response.json()
            return data;
        }
    });
    return query;
}