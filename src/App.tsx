import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Games from "./pages/Games";
import CreateBet from "./pages/CreateBet";
import BetDetail from "./pages/BetDetail";
import ActiveBets from "./pages/ActiveBets";
import Wallet from "./pages/Wallet";
import Teams from "./pages/Teams";
import LiveStreams from "./pages/LiveStreams";
import AdminOverview from "./pages/Admin/Overview";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ResetPassword from "./pages/ResetPassword";
import KYC from "./pages/KYC";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Contacts from "./pages/Contacts";
import Groups from "./pages/Groups";
import ChallengeHistory from "./pages/ChallengeHistory";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/games" element={<Games />} />

            {/* Protected routes */}
            <Route path="/create-bet" element={<ProtectedRoute><CreateBet /></ProtectedRoute>} />
            <Route path="/create-challenge" element={<ProtectedRoute><CreateBet /></ProtectedRoute>} />
            <Route path="/bet/:betId" element={<ProtectedRoute><BetDetail /></ProtectedRoute>} />
            <Route path="/challenge/:betId" element={<ProtectedRoute><BetDetail /></ProtectedRoute>} />
            <Route path="/active-bets" element={<ProtectedRoute><ActiveBets /></ProtectedRoute>} />
            <Route path="/active-challenges" element={<ProtectedRoute><ActiveBets /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
            <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
            <Route path="/live-streams" element={<ProtectedRoute><LiveStreams /></ProtectedRoute>} />
            <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
            <Route path="/challenge-history" element={<ProtectedRoute><ChallengeHistory /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminOverview /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
