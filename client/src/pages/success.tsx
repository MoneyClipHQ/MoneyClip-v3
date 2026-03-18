import { Link } from 'wouter';
import { useEffect, useState } from 'react';

export default function SuccessPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setSessionId(query.get('session_id'));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md p-8 text-center bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
        <p className="mt-4 text-gray-600">Your subscription is now active.</p>
        {sessionId && <p className="mt-2 text-sm text-gray-500">Session ID: {sessionId}</p>}
        <Link href="/dashboard">
          <a className="inline-block px-6 py-3 mt-6 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            Return to Dashboard
          </a>
        </Link>
      </div>
    </div>
  );
}
