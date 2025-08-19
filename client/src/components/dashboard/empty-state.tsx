import { Circle, Film } from "lucide-react";
import { Link } from "wouter";

export default function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <Film className="w-12 h-12 text-gray-400 dark:text-gray-600" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No videos yet
      </h3>
      
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
        Start creating engaging content for your clients by recording your first video.
      </p>
      
      <Link href="/record">
        <button
          className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          data-testid="button-record-first"
        >
          <Circle className="w-5 h-5 fill-current" />
          <span>Record your first video</span>
        </button>
      </Link>
    </div>
  );
}