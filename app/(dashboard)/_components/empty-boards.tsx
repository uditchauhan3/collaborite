"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { useOrganization } from "@clerk/nextjs";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const EmptyBoards = () => {
    const router = useRouter();

    const { organization } = useOrganization();
    const {mutate,pending} = useApiMutation(api.board.create);

    const onClick = () => {
        if (!organization) return;
        

        mutate({
            orgId: organization.id,
            title: "Untitled",
        })
        .then((id)=>
        {toast.success("Board created");
            router.push(`/board/${id}`);

        })
        .catch(()=> toast.error("failed to create board"))
    };

    return (
        <div className="h-full flex flex-col items-center justify-center text-center">
            <Image 
                src="/notes.svg"
                height={110}
                width={110}
                alt="Empty"
                
            />
            <h2 className="text-2xl font-semibold mt-6">
                Create your first board!
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
                Start by creating a board for your organization.
            </p>
            <div>
                <Button disabled={pending} onClick={onClick} size="lg" className="mt-3">
                    Create Board
                </Button>
            </div>
        </div>
    );
};
