"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Facebook, Instagram, Twitter, Command, Rss, LucideIcon } from "lucide-react";

interface ConnectionTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionTutorialModal({ isOpen, onClose }: ConnectionTutorialModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0 bg-white rounded-2xl overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-bold text-gray-900">How to Connect?</DialogTitle>
          <DialogDescription className="text-gray-500">
            Select a platform to verify connection details and permissions.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="meta" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-2 border-b border-gray-100 bg-gray-50/50">
            <TabsList className="bg-transparent p-0 gap-4">
              <TabsTrigger
                value="meta"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 py-2"
              >
                Meta (FB/Insta)
              </TabsTrigger>
              <TabsTrigger
                value="threads"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none px-0 py-2"
              >
                Threads
              </TabsTrigger>
              <TabsTrigger
                value="mastodon"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none px-0 py-2"
              >
                Mastodon
              </TabsTrigger>
              <TabsTrigger
                value="bluesky"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-0 py-2"
              >
                Bluesky
              </TabsTrigger>
              <TabsTrigger
                value="tumblr"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-900 rounded-none px-0 py-2"
              >
                Tumblr
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            <TabsContent value="meta" className="mt-0 space-y-6">
              <Section
                title="Facebook & Instagram"
                icon={Facebook}
                color="text-blue-600"
                content="Connecting your Meta accounts allows us to auto-post content and track basic analytics."
              />
              <Step number={1} text="Click the 'Connect' button for Facebook or Instagram." />
              <Step number={2} text="You will be redirected to Facebook's secure login page." />
              <Step
                number={3}
                text="Select the Pages and Instagram Business Accounts you want to manage. We recommend selecting all to avoid permission issues later."
              />
              <Step
                number={4}
                text="Approve the requested permissions: 'Create Posts', 'Manage Comments', and 'Read Insights'."
              />
              <Alert type="info">
                We only request what is strictly necessary to publish your posts and show you how
                they perform. We never post without your action.
              </Alert>
            </TabsContent>

            <TabsContent value="threads" className="mt-0 space-y-6">
              <Section
                title="Threads"
                icon={Instagram}
                color="text-black"
                content="Connect your Threads profile to publish content directly from Hayon."
              />
              <Step number={1} text="Click 'Connect' on the Threads card." />
              <Step number={2} text="Authorize the app via your Instagram/Threads login." />
              <Step
                number={3}
                text="Approve permissions for 'threads_basic' and 'threads_content_publish'."
              />
              <Alert type="info">
                Threads requires a valid Instagram account. Ensure you are logged into the correct
                account in your browser.
              </Alert>
            </TabsContent>

            <TabsContent value="mastodon" className="mt-0 space-y-6">
              <Section
                title="Mastodon"
                icon={Rss}
                color="text-purple-600"
                content="Currently, we specifically support the main 'mastodon.social' instance."
              />
              <Step number={1} text="Click 'Connect' on the Mastodon card." />
              <Step
                number={2}
                text="Confirm the dialog noting that we connect to 'mastodon.social'."
              />
              <Step number={3} text="Log in to your mastodon.social account if prompted." />
              <Step
                number={4}
                text="Authorize the app. We request 'read', 'write', and 'push' scopes to handle posting and notifications."
              />
              <Alert type="warning">
                If you host your own Mastodon instance, support is coming soon!
              </Alert>
            </TabsContent>

            <TabsContent value="bluesky" className="mt-0 space-y-6">
              <Section
                title="Bluesky"
                icon={Twitter}
                color="text-blue-500"
                content="Connect using your Bluesky handle and an App Password."
              />
              <Step number={1} text="Enter your full handle (e.g., alice.bsky.social)." />
              <Step
                number={2}
                text="Generate an App Password in Bluesky Settings > Advanced > App Passwords. Do NOT use your main password."
              />
              <Step number={3} text="Paste the App Password and click connect." />
              <Alert type="info">
                App Passwords are secure and allow you to revoke access at any time from your
                Bluesky app.
              </Alert>
            </TabsContent>

            <TabsContent value="tumblr" className="mt-0 space-y-6">
              <Section
                title="Tumblr"
                icon={Command}
                color="text-blue-900"
                content="Link your Tumblr blog to cross-post seamlessly."
              />
              <Step number={1} text="Click 'Connect' for Tumblr." />
              <Step number={2} text="Approve access on the Tumblr authorization page." />
              <Step
                number={3}
                text="We will fetch your primary blog avatar and username to confirm the connection."
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  icon: Icon,
  color,
  content,
}: {
  title: string;
  icon: LucideIcon;
  color: string;
  content: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className={`p-3 rounded-xl bg-gray-50 ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex gap-3 items-start group">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        {number}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}

function Alert({ type, children }: { type: "info" | "warning"; children: React.ReactNode }) {
  const bg = type === "info" ? "bg-blue-50 border-blue-100" : "bg-amber-50 border-amber-100";
  const text = type === "info" ? "text-blue-700" : "text-amber-700";
  return <div className={`p-4 rounded-xl border ${bg} ${text} text-sm`}>{children}</div>;
}
