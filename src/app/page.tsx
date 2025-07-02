"use client";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";

// Define types for better TypeScript support
interface JobData {
  [key: string]: string | number | boolean | string[] | null | undefined;
}

interface FormData {
  job_title: string;
  location: string;
  num_jobs: number;
  search_term: string;
  results_wanted: number;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://b8bc-103-247-7-136.ngrok-free.app";

const portals = [
  {
    key: "foundit",
    label: "Foundit",
    endpoint: `${API_BASE}/foundit/scrape_foundit`,
    params: ["job_title", "location", "num_jobs"],
    method: "POST",
  },
  {
    key: "glassdoor",
    label: "Glassdoor",
    endpoint: `${API_BASE}/glassdoor/scrape_jobs`,
    params: ["job_title", "location", "num_jobs"],
    method: "POST",
  },
  {
    key: "simplyhired",
    label: "SimplyHired",
    endpoint: `${API_BASE}/simplyhired/scrape_simplyhired`,
    params: ["job_title", "location", "num_jobs"],
    method: "POST",
  },
  {
    key: "ziprecruiter",
    label: "ZipRecruiter",
    endpoint: `${API_BASE}/ziprecruiter/scrape_ziprecruiter`,
    params: ["job_title", "location", "num_jobs"],
    method: "POST",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    endpoint: `${API_BASE}/scrape-linkedin/`,
    params: ["search_term", "location", "results_wanted"],
    method: "POST",
  },
  {
    key: "indeed",
    label: "Indeed",
    endpoint: `${API_BASE}/scrape-indeed/`,
    params: ["search_term", "location", "results_wanted"],
    method: "POST",
  },
  {
    key: "naukri",
    label: "Naukri",
    endpoint: `${API_BASE}/scrape-naukri/`,
    params: ["search_term", "location", "results_wanted"],
    method: "POST",
  },
];

function GradientBG({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black via-purple-900 via-purple-800 to-purple-600 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-purple-500/10 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-bounce"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("foundit");
  const [form, setForm] = useState<FormData>({
    job_title: "Data Scientist",
    location: "India",
    num_jobs: 3,
    search_term: "Data Scientist",
    results_wanted: 3,
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<JobData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const portal = portals.find((p) => p.key === activeTab)!;

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log("🔍 Starting search for portal:", portal.key);
      console.log("🌐 API Base URL:", API_BASE);
      console.log("📡 Endpoint:", portal.endpoint);
      console.log("📝 Form data:", form);

      if (portal.method === "GET") {
        const params = new URLSearchParams();
        portal.params.forEach((param) => {
          const value = form[param as keyof typeof form];
          if (value !== undefined && value !== "") {
            params.append(param, String(value));
          }
        });
        const url = `${portal.endpoint}?${params.toString()}&_t=${Date.now()}`;
        console.log("🔗 GET URL:", url);

        const res = await fetch(url, {
          cache: "no-cache",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          mode: "cors",
        });
        console.log("📊 Response status:", res.status);
        console.log(
          "📊 Response headers:",
          Object.fromEntries(res.headers.entries())
        );

        if (!res.ok) {
          const errorText = await res.text();
          console.error("❌ Error response:", errorText);
          throw new Error(errorText);
        }

        const responseText = await res.text();
        console.log("📄 Raw response:", responseText.substring(0, 500) + "...");

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("❌ JSON parse error:", parseError);
          console.error("📄 Full response:", responseText);
          throw new Error("Invalid JSON response from server");
        }

        console.log("✅ Success response:", data);
        setResults(data.scraped_jobs || data);
      } else if (portal.method === "POST") {
        // Different request body format for different scrapers
        let requestBody;
        if (["linkedin", "indeed", "naukri"].includes(portal.key)) {
          // For jobspy scrapers
          requestBody = {
            site_name: portal.key,
            search_term: form.search_term || form.job_title,
            location: form.location,
            results_wanted: form.results_wanted || form.num_jobs,
          };
        } else {
          // For custom scrapers (foundit, glassdoor, simplyhired, ziprecruiter)
          requestBody = {
            job_title: form.job_title,
            location: form.location,
            num_jobs: form.num_jobs,
          };
        }
        console.log("📤 POST request body:", requestBody);

        const res = await fetch(`${portal.endpoint}?_t=${Date.now()}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          cache: "no-cache",
          mode: "cors",
          body: JSON.stringify(requestBody),
        });
        console.log("📊 Response status:", res.status);
        console.log(
          "📊 Response headers:",
          Object.fromEntries(res.headers.entries())
        );

        if (!res.ok) {
          const errorText = await res.text();
          console.error("❌ Error response:", errorText);
          throw new Error(errorText);
        }

        const responseText = await res.text();
        console.log("📄 Raw response:", responseText.substring(0, 500) + "...");

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("❌ JSON parse error:", parseError);
          console.error("📄 Full response:", responseText);
          throw new Error("Invalid JSON response from server");
        }

        console.log("✅ Success response:", data);
        setResults(data.jobs || data.scraped_jobs || data);
      }
    } catch (err) {
      console.error("💥 Search error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBG>
      <div className="w-full max-w-5xl mx-auto mt-8">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 mb-4 drop-shadow-2xl">
            Job Scraper Portal
          </h1>
          <p className="text-xl text-purple-200 text-center mb-4 font-medium">
            Unified job search across 7 major platforms
          </p>
          <p className="text-sm text-purple-300/70 text-center mb-6 font-mono">
            API: {API_BASE}
          </p>
          <div className="flex justify-center gap-2 text-xs text-purple-300/60">
            <span className="px-2 py-1 bg-purple-800/50 rounded-full">
              Foundit
            </span>
            <span className="px-2 py-1 bg-purple-800/50 rounded-full">
              Glassdoor
            </span>
            <span className="px-2 py-1 bg-purple-800/50 rounded-full">
              SimplyHired
            </span>
            <span className="px-2 py-1 bg-purple-800/50 rounded-full">
              ZipRecruiter
            </span>
            <span className="px-2 py-1 bg-purple-800/50 rounded-full">
              LinkedIn
            </span>
            <span className="px-2 py-1 bg-purple-800/50 rounded-full">
              Indeed
            </span>
            <span className="px-2 py-1 bg-purple-800/50 rounded-full">
              Naukri
            </span>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex justify-center gap-2 bg-black/40 backdrop-blur-xl rounded-2xl p-2 mb-8 border border-purple-500/20 shadow-2xl">
            {portals.map((p) => (
              <TabsTrigger
                key={p.key}
                value={p.key}
                className="text-sm font-semibold px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-400 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 transition-all duration-300 hover:bg-purple-800/30 text-purple-200"
              >
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {portals.map((p) => (
            <TabsContent key={p.key} value={p.key} className="w-full">
              <Card className="mb-8 bg-black/40 backdrop-blur-xl border border-purple-500/20 shadow-2xl">
                <CardContent className="p-8 flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Label
                        htmlFor={
                          activeTab === "linkedin" ||
                          activeTab === "indeed" ||
                          activeTab === "naukri"
                            ? "search_term"
                            : "job_title"
                        }
                        className="text-purple-200 font-semibold text-sm mb-2"
                      >
                        {activeTab === "linkedin" ||
                        activeTab === "indeed" ||
                        activeTab === "naukri"
                          ? "Search Term"
                          : "Job Title"}
                      </Label>
                      <Input
                        id={
                          activeTab === "linkedin" ||
                          activeTab === "indeed" ||
                          activeTab === "naukri"
                            ? "search_term"
                            : "job_title"
                        }
                        name={
                          activeTab === "linkedin" ||
                          activeTab === "indeed" ||
                          activeTab === "naukri"
                            ? "search_term"
                            : "job_title"
                        }
                        value={
                          activeTab === "linkedin" ||
                          activeTab === "indeed" ||
                          activeTab === "naukri"
                            ? form.search_term
                            : form.job_title
                        }
                        onChange={handleInput}
                        placeholder="e.g. Data Scientist"
                        className="mt-1 bg-black/50 border-purple-500/30 text-purple-100 placeholder-purple-400/50 focus:border-purple-400 focus:ring-purple-400/20"
                      />
                    </div>
                    <div className="flex-1">
                      <Label
                        htmlFor="location"
                        className="text-purple-200 font-semibold text-sm mb-2"
                      >
                        Location
                      </Label>
                      <Input
                        id="location"
                        name="location"
                        value={form.location}
                        onChange={handleInput}
                        placeholder="e.g. India"
                        className="mt-1 bg-black/50 border-purple-500/30 text-purple-100 placeholder-purple-400/50 focus:border-purple-400 focus:ring-purple-400/20"
                      />
                    </div>
                    <div className="w-32">
                      <Label
                        htmlFor={
                          activeTab === "linkedin" ||
                          activeTab === "indeed" ||
                          activeTab === "naukri"
                            ? "results_wanted"
                            : "num_jobs"
                        }
                        className="text-purple-200 font-semibold text-sm mb-2"
                      >
                        {activeTab === "linkedin" ||
                        activeTab === "indeed" ||
                        activeTab === "naukri"
                          ? "Results"
                          : "# Jobs"}
                      </Label>
                      <Input
                        id={
                          activeTab === "linkedin" ||
                          activeTab === "indeed" ||
                          activeTab === "naukri"
                            ? "results_wanted"
                            : "num_jobs"
                        }
                        name={
                          activeTab === "linkedin" ||
                          activeTab === "indeed" ||
                          activeTab === "naukri"
                            ? "results_wanted"
                            : "num_jobs"
                        }
                        type="number"
                        min={1}
                        max={20}
                        value={
                          activeTab === "linkedin" ||
                          activeTab === "indeed" ||
                          activeTab === "naukri"
                            ? form.results_wanted
                            : form.num_jobs
                        }
                        onChange={handleInput}
                        className="mt-1 bg-black/50 border-purple-500/30 text-purple-100 placeholder-purple-400/50 focus:border-purple-400 focus:ring-purple-400/20"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="mt-4 bg-gradient-to-r from-purple-600 to-purple-400 text-white font-bold py-4 px-8 rounded-xl shadow-2xl shadow-purple-500/25 hover:from-purple-500 hover:to-purple-300 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Searching...
                      </div>
                    ) : (
                      "Search Jobs"
                    )}
                  </Button>
                  {error && (
                    <div className="text-red-400 font-semibold mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                      {error}
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {results && Array.isArray(results) && results.length > 0 ? (
                  results.map((job: JobData, idx: number) => (
                    <Card
                      key={idx}
                      className="bg-black/40 backdrop-blur-xl border border-purple-500/20 shadow-2xl hover:scale-[1.02] hover:shadow-purple-500/25 transition-all duration-300"
                    >
                      <CardContent className="p-6 flex flex-col gap-3">
                        {Object.entries(job).map(([key, value]) => (
                          <div key={key} className="mb-2 break-words">
                            <span className="font-bold capitalize text-purple-300 text-sm">
                              {key}:
                            </span>{" "}
                            {key === "company_logo" &&
                            typeof value === "string" ? (
                              value.startsWith("http://") ||
                              value.startsWith("https://") ? (
                                <Image
                                  src={value}
                                  alt="Company logo"
                                  width={64}
                                  height={64}
                                  className="inline-block rounded-full object-contain border-2 border-purple-500/30 ml-2 align-middle"
                                  style={{ verticalAlign: "middle" }}
                                />
                              ) : (
                                <span className="text-purple-100">{value}</span>
                              )
                            ) : Array.isArray(value) ? (
                              <span className="text-purple-100">
                                {value.join(", ")}
                              </span>
                            ) : key.toLowerCase().includes("url") &&
                              typeof value === "string" ? (
                              <a
                                href={value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 hover:underline font-semibold break-all transition-colors"
                                style={{ wordBreak: "break-all" }}
                              >
                                {value}
                              </a>
                            ) : (
                              <span className="text-purple-100">
                                {String(value)}
                              </span>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))
                ) : results &&
                  Array.isArray(results) &&
                  results.length === 0 ? (
                  <div className="text-purple-200 text-xl col-span-2 text-center p-8 bg-black/20 rounded-2xl border border-purple-500/20">
                    <div className="text-4xl mb-4">🔍</div>
                    No jobs found for your search criteria.
                  </div>
                ) : null}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <footer className="mt-16 text-purple-300/60 text-center text-sm">
        <div className="flex justify-center items-center gap-4 mb-2">
          <span className="px-3 py-1 bg-purple-800/30 rounded-full text-xs">
            Next.js
          </span>
          <span className="px-3 py-1 bg-purple-800/30 rounded-full text-xs">
            Tailwind
          </span>
          <span className="px-3 py-1 bg-purple-800/30 rounded-full text-xs">
            shadcn/ui
          </span>
        </div>
        &copy; {new Date().getFullYear()} Job Scraper Portal. Built with ❤️
      </footer>
    </GradientBG>
  );
}
