import { PlayIcon, ExternalLinkIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Video } from "@shared/schema";

interface VideoThumbnailProps {
  video: Video;
  onClick: () => void;
}

export default function VideoThumbnail({ video, onClick }: VideoThumbnailProps) {
  return (
    <div
      onClick={onClick}
      data-testid={`video-thumbnail-${video.id}`}
      className="group bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="aspect-video bg-gray-100 rounded-t-lg relative overflow-hidden">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <PlayIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ExternalLinkIcon className="h-6 w-6 text-white drop-shadow" />
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3
          className="text-sm font-medium text-gray-900 line-clamp-2 mb-1"
          data-testid={`video-title-${video.id}`}
        >
          {video.title}
        </h3>
        <p
          className="text-xs text-gray-500"
          data-testid={`video-time-${video.id}`}
        >
          {formatDistanceToNow(new Date(video.updatedAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}