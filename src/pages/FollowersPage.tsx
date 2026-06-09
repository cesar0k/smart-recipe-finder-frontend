import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGetFollowers } from "@/api/follows/follows";
import { BackButton } from "@/components/BackButton";
import { UserCard } from "@/components/UserCard";
import { useDismissSplash } from "@/hooks/useDismissSplash";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useHeaderSlots } from "@/hooks/useHeaderSlots";
import { Button } from "@/components/ui/button";

export function FollowersPage() {
  useDismissSplash();
  const { t } = useTranslation();
  useDocumentTitle(t("page_title_followers"));
  useHeaderSlots({ left: <BackButton /> }, []);
  const { userId } = useParams<{ userId: string }>();
  const uid = parseInt(userId || "0", 10);

  const { data: followers, isLoading } = useGetFollowers(uid, { skip: 0, limit: 100 });

  return (
    <div className="min-h-screen bg-white font-sans pb-16 md:pb-0">
      <main className="container mx-auto px-4 pt-8 pb-24 md:pb-8 max-w-lg">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-6">
          {t("followers_page_title")}
        </h1>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!followers || followers.length === 0) && (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">{t("followers_empty")}</p>
            <Link to={`/user/${uid}`} className="mt-4 inline-block">
              <Button variant="outline" className="rounded-full mt-4">
                {t("back_to_profile")}
              </Button>
            </Link>
          </div>
        )}

        {!isLoading && followers && followers.length > 0 && (
          <div className="divide-y divide-gray-100">
            {followers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
