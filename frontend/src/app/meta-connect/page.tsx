"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Facebook } from "lucide-react";

export default function MetaConnectPage() {
    const handleFacebookConnect = () => {
        // Determine backend URL (fallback to dev.hayon.site if env variable is missing)
        const apiUrl = "https://dev.hayon.site:5000/api";
        // const apiUrl = "http://localhost:5000/api";
        // Redirect to the backend auth endpoint
        window.location.href = `${apiUrl}/auth/facebook/connect`;
    };

    const handleThreadsConnect = () => {
        const apiUrl = "https://dev.hayon.site:5000/api";
        // const apiUrl = "http://localhost:5000/api";

        window.location.href = `${apiUrl}/auth/threads/connect`;
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Connect Meta</CardTitle>
                    <CardDescription>
                        Connect your accounts separately to test the integration.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Button onClick={handleFacebookConnect} className="w-full gap-2">
                        <Facebook className="w-5 h-5" />
                        Connect Facebook & Instagram
                    </Button>
                    <Button onClick={handleThreadsConnect} variant="secondary" className="w-full gap-2">
                        <span className="font-bold">@</span>
                        Connect Threads
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
