import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGetFollowing } from "@/api/follows/follows";
import { Header } from "@/components/layout/Header";
import { BackButton } from "@/components/BackButton";
import { UserCard } from "@/components/UserCard";
import { useDismissSplash } from "@/hooks/useDismissSplash";
import { Button } from "@/components/ui/button";

export function FollowingPage() {
  useDismissSplash();
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const uid = parseInt(userId || "0", 10);

  const { data: following, isLoading } = useGetFollowing(uid, { skip: 0, limit: 100 });

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header leftContent={<BackButton />} />

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <h1 className="text-xl font-bold text-gray-900 mb-6">
          {t("following_page_title")}
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

        {!isLoading && (!following || following.length === 0) && (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">{t("following_empty")}</p>
            <Link to={`/user/${uid}`} className="mt-4 inline-block">
              <Button variant="outline" className="rounded-full mt-4">
                {t("back_to_profile")}
              </Button>
            </Link>
          </div>
        )}

        {!isLoading && following && following.length > 0 && (
          <div className="divide-y divide-gray-100">
            {following.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
