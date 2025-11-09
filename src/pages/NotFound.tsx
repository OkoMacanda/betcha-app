import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import Navigation from "@/components/Navigation";

const NotFound = () => {
  const location = useLocation();
  usePageSEO({ title: "Page Not Found – Betcha", description: "The page you're looking for doesn't exist.", canonicalPath: location.pathname });

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="flex min-h-[calc(100vh-5rem)] md:min-h-[calc(100vh-9rem)] items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
          <Link to="/" className="text-primary underline hover:opacity-80">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
