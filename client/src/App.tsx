import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import SignUp from "@/pages/signup";
import Pricing from "@/pages/pricing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import VideoLibrary from "@/pages/video-library";
import ScriptedContent from "@/pages/scripted-content";
import Settings from "@/pages/settings";
import Terms from "@/pages/terms";
import Billing from "@/pages/billing";
import Contact from "@/pages/contact";
import RecordPage from "@/pages/record";
import RecordPreviewPage from "@/pages/record-preview";
import SharePage from "@/pages/share";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/signup" component={SignUp} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/login" component={Login} />
      <Route path="/terms" component={Terms} />
      <Route path="/contact" component={Contact} />
      
      {/* Protected routes - redirect to login if not authenticated */}
      <Route path="/dashboard">
        {isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      <Route path="/video-library">
        {isAuthenticated ? <VideoLibrary /> : <Login />}
      </Route>
      <Route path="/scripted-content">
        {isAuthenticated ? <ScriptedContent /> : <Login />}
      </Route>
      <Route path="/settings">
        {isAuthenticated ? <Settings /> : <Login />}
      </Route>
      <Route path="/billing">
        {isAuthenticated ? <Billing /> : <Login />}
      </Route>
      <Route path="/record">
        {isAuthenticated ? <RecordPage /> : <Login />}
      </Route>
      <Route path="/record/preview">
        {isAuthenticated ? <RecordPreviewPage /> : <Login />}
      </Route>
      
      {/* Public share route - no authentication required */}
      <Route path="/share/:shareLink" component={SharePage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
