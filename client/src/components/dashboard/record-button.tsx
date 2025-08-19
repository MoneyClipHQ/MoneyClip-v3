import { Circle } from "lucide-react";
import { Link } from "wouter";

export default function RecordButton() {
  return (
    <div className="max-w-md mx-auto">
      <Link href="/record">
        <button
          className="group relative w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
          data-testid="button-record"
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="relative">
              <Circle className="w-6 h-6 fill-current" />
              <div className="absolute inset-0 bg-white rounded-full opacity-0 group-hover:opacity-20 transition-opacity animate-pulse" />
            </div>
            <div className="text-left">
              <div className="text-xl font-bold">Record</div>
              <div className="text-red-100 text-sm font-normal">Record your screen with voice</div>
            </div>
          </div>
        </button>
      </Link>
    </div>
  );
}