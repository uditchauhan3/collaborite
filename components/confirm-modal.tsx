"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Children } from "react";

interface confirmModalProps {
    children : React.ReactNode;
    onConfirm: ()=> void;
    disabled?: boolean;
    header:string;
    description?: string;
};

export const ConfirmModal =({
    children,
    onConfirm,
    disabled,
    header,
    description,

}: confirmModalProps) => {
const handleConfirm =() =>{
    onConfirm();
};

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {header}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {description}
                        </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                    disabled={disabled}
                    onClick={handleConfirm}>
                        confirm
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )

}