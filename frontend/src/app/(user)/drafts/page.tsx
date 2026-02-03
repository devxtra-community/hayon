"use client";

import { useState, useEffect } from "react";
import { Sidebar, Header } from "@/components/dashboard";
import { DraftCard } from "@/components/drafts/DraftCard";
import { cn } from "@/lib/utils";
import { api } from "@/lib/axios";
import { useRouter } from "next/navigation";

interface DraftPost {
  _id: string;
  content: {
    text: string;
    mediaItems: Array<{
      s3Url: string;
      mimeType: string;
    }>;
  };
  selectedPlatforms: string[];
  platformSpecificContent?: Record<string, { mediaItems?: Array<{ s3Url: string }> }>;
  createdAt: string;
  updatedAt: string;
}

export default function DraftsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ name: "", email: "", avatar: "" });
  const router = useRouter();

  const fetchDrafts = async () => {
    try {
      // Fetch user
      const userRes = await api.get("/auth/me");
      setUser({
        name: userRes.data.data.user.name || "User",
        email: userRes.data.data.user.email || "",
        avatar: userRes.data.data.user.avatar || "/mock-avatar.png",
      });

      // Fetch drafts
      const draftsRes = await api.get("/posts", {
        params: {
          status: "DRAFT",
          limit: 50,
        },
      });
      setDrafts(draftsRes.data.data.posts || []);
    } catch (error) {
      console.error("Failed to fetch drafts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleEdit = (draftId: string) => {
    router.push(`/dashboard/create-post?draftId=${draftId}`);
  };

  const handleDelete = async (draftId: string) => {
    if (!confirm("Are you sure you want to delete this draft?")) {
      return;
    }

    try {
      await api.delete(`/posts/${draftId}`);
      // Refresh drafts list
      setDrafts(drafts.filter((d) => d._id !== draftId));
    } catch (error) {
      console.error("Failed to delete draft", error);
      alert("Failed to delete draft. Please try again.");
    }
  };

  const handlePost = async (draftId: string) => {
    try {
      const draft = drafts.find((d) => d._id === draftId);
      if (!draft) return;

      // Update draft to PENDING status (removes it from drafts)
      await api.put(`/posts/${draftId}`, {
        ...draft,
        status: "PENDING", // This will trigger job enqueuing in backend
      });

      // Remove from drafts list
      setDrafts(drafts.filter((d) => d._id !== draftId));
      alert("Post queued successfully!");
    } catch (error) {
      console.error("Failed to post draft", error);
      alert("Failed to post. Please try again.");
    }
  };

  const filteredDrafts = drafts.filter((draft) =>
    draft.content.text.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden p-2 lg:p-4 gap-4 relative">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 lg:hidden transition-opacity duration-300",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-72 bg-none transition-transform duration-300 transform",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Sidebar />
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="pb-2 lg:pb-4">
          <Header
            userName={user.name}
            userEmail={user.email}
            userAvatar={user.avatar}
            onMenuClick={() => setIsMobileMenuOpen(true)}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 bg-[#F7F7F7] rounded-3xl overflow-y-auto px-4 py-6 lg:px-6 lg:py-8 scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-lg">No drafts found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filteredDrafts.map((draft) => {
                const uniqueImages = new Set<string>();
                draft.content.mediaItems.forEach((item) => uniqueImages.add(item.s3Url));
                if (draft.platformSpecificContent) {
                  Object.values(draft.platformSpecificContent).forEach((content) => {
                    content.mediaItems?.forEach((item) => uniqueImages.add(item.s3Url));
                  });
                }
                return (
                  <DraftCard
                    key={draft._id}
                    draftId={draft._id}
                    title={draft.content.text}
                    images={Array.from(uniqueImages)}
                    selectedPlatforms={draft.selectedPlatforms}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onPost={handlePost}
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
