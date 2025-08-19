import { Video } from "@shared/schema";
import { Play, Clock } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface RecentVideosProps {
  videos: Video[];
}

export default function RecentVideos({ videos }: RecentVideosProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <Link key={video.id} href={`/videos/${video.id}`}>
          <div
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer group"
            data-testid={`card-video-${video.id}`}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {video.title}
              </h3>
              <div className="flex-shrink-0 ml-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                  <Play className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4 mr-1" />
              <span data-testid={`text-time-${video.id}`}>
                {formatDistanceToNow(new Date(video.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}