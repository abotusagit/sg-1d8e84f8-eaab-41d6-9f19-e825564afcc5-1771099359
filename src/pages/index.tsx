import { useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/admin/login");
  }, [router]);

  return (
    <>
      <SEO
        title="Marriagepal Admin"
        description="Admin dashboard for Marriagepal dating app management"
      />
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-slate-600">Redirecting to admin login...</p>
      </div>
    </>
  );
}