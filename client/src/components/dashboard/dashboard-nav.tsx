import { Link } from "wouter";
import { Video, FileText } from "lucide-react";

export default function DashboardNav() {
  return (
    <nav className="mb-12">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <Link href="/videos">
          <button
            className="flex items-center space-x-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all font-medium"
            data-testid="button-video-library"
          >
            <Video className="w-5 h-5" />
            <span>Video Library</span>
          </button>
        </Link>
        
        <Link href="/scripted-content">
          <button
            className="flex items-center space-x-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all font-medium"
            data-testid="button-scripted-content"
          >
            <FileText className="w-5 h-5" />
            <span>Scripted Content</span>
          </button>
        </Link>
      </div>
    </nav>
  );
}