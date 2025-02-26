"use client";

import { ClerkProvider, SignIn, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Authenticated, AuthLoading, ConvexReactClient } from "convex/react";
import React from "react";
import { Loading } from "@/components/ui/auth/loading";

interface ConvexClientProviderProps {
    children: React.ReactNode;
}

const convexURL = process.env.NEXT_PUBLIC_CONVEX_URL!;
const convex = new ConvexReactClient(convexURL);
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
console.log("Clerk Publishable Key:", publishableKey);

const ConvexClientProvider = ({ children }: ConvexClientProviderProps) => {
    return (
        <InnerConvexProvider>{children}</InnerConvexProvider>
    );
};

const InnerConvexProvider = ({ children }: ConvexClientProviderProps) => {
    const { isLoaded, isSignedIn } = useAuth();

    if (!isLoaded) {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    if (!isSignedIn) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
                <div className="p-6 bg-white shadow-lg rounded-lg">
                    <SignIn routing="hash" />
                </div>
            </div>
        );
    }

    return (
        <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
            <Authenticated>
                {children}
            </Authenticated>
            <AuthLoading>
                <Loading />
            </AuthLoading>
        </ConvexProviderWithClerk>
    );
};

export default ConvexClientProvider;
