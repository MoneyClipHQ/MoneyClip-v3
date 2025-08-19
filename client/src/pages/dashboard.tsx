import { useQuery } from "@tanstack/react-query";
import { Video, User } from "@shared/schema";
import DashboardHeader from "../components/dashboard/dashboard-header";
import DashboardNav from "../components/dashboard/dashboard-nav";
import RecordButton from "../components/dashboard/record-button";
import RecentVideos from "../components/dashboard/recent-videos";
import EmptyState from "../components/dashboard/empty-state";

// Mock current user - in a real app this would come from auth
// We'll get the first user from the backend since we have sample data
const CURRENT_USER = {
  username: "advisor1",
  name: "John Smith"
};

export default function Dashboard() {
  // Get current user data
  const { data: currentUser } = useQuery<Omit<User, 'password'>>({
    queryKey: ["/api/users/by-username", CURRENT_USER.username],
  });

  const { data: recentVideos, isLoading } = useQuery<Video[]>({
    queryKey: ["/api/users", currentUser?.id, "videos/recent"],
    enabled: !!currentUser?.id,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader advisorName={CURRENT_USER.name} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <DashboardNav />
        
        {/* Primary Action */}
        <div className="text-center mb-12">
          <RecordButton />
        </div>
        
        {/* Recent Videos */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Recent Videos
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : recentVideos && recentVideos.length > 0 ? (
            <RecentVideos videos={recentVideos} />
          ) : (
            <EmptyState />
          )}
        </section>
      </main>
    </div>
  );
}