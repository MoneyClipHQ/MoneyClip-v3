import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import SignUp from "@/pages/signup";
import Pricing from "@/pages/pricing";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Dashboard from "@/pages/dashboard";
import VideoLibrary from "@/pages/video-library";
import ScriptedContent from "@/pages/scripted-content";
import Settings from "@/pages/settings";
import Terms from "@/pages/terms";
import Billing from "@/pages/billing";
import Contact from "@/pages/contact";
import About from "@/pages/about";
import Privacy from "@/pages/privacy";
import RecordPage from "@/pages/record";
import RecordPreviewPage from "@/pages/record-preview";
import VideoEditPage from "@/pages/video-edit";
import SharePage from "@/pages/share";
import ComingSoon from "@/pages/coming-soon";
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
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/terms" component={Terms} />
      <Route path="/contact" component={Contact} />
      <Route path="/about" component={About} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/coming-soon" component={ComingSoon} />
      
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
      <Route path="/video/:id/edit">
        {isAuthenticated ? <VideoEditPage /> : <Login />}
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
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
