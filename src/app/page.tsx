"use client";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

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
  "https://8986-103-247-7-136.ngrok-free.app";

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
    endpoint: `${API_BASE}/linkedin/scrape-linkedin-detailed/`,
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
    endpoint: `${API_BASE}/naukri/scrape-naukri/`,
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
      <div className="relative z-10 w-full perspective-3d">{children}</div>
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

      switch (portal.method) {
        case "GET": {
          const params = new URLSearchParams();
          portal.params.forEach((param) => {
            const value = form[param as keyof typeof form];
            if (value !== undefined && value !== "") {
              params.append(param, String(value));
            }
          });
          const url = `${
            portal.endpoint
          }?${params.toString()}&_t=${Date.now()}`;
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
          console.log(
            "📄 Raw response:",
            responseText.substring(0, 500) + "..."
          );

          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error("❌ JSON parse error:", parseError);
            console.error("📄 Full response:", responseText);
            throw new Error("Invalid JSON response from server");
          }

          console.log("✅ Success response:", data);
          if (portal.key === "linkedin") {
            setResults(data.job_details || []);
          } else if (portal.key === "naukri") {
            setResults(data.job_details || []);
          } else {
            setResults(data.jobs || data.scraped_jobs || data);
          }
          break;
        }
        case "POST": {
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
          console.log(
            "📄 Raw response:",
            responseText.substring(0, 500) + "..."
          );

          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error("❌ JSON parse error:", parseError);
            console.error("📄 Full response:", responseText);
            throw new Error("Invalid JSON response from server");
          }

          console.log("✅ Success response:", data);
          if (portal.key === "linkedin") {
            setResults(data.job_details || []);
          } else if (portal.key === "naukri") {
            setResults(data.job_details || []);
          } else {
            setResults(data.jobs || data.scraped_jobs || data);
          }
          break;
        }
        default:
          throw new Error(`Unsupported method: ${portal.method}`);
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
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-6xl font-black gradient-text mb-4 drop-shadow-2xl animate-glow">
            Job Scraper Portal
          </h1>
          <p className="text-xl text-purple-200 text-center mb-4 font-medium">
            Unified job search across 7 major platforms
          </p>
          <p className="text-sm text-purple-300/70 text-center mb-6 font-mono">
            API: {API_BASE}
          </p>
          <div className="flex justify-center gap-2 text-xs text-purple-300/60">
            <span className="px-2 py-1 bg-purple-800/50 rounded-full hover-lift">
              Foundit
            </span>
            <span className="px-2 py-1 bg-purple-800/50 rounded-full hover-lift">
              Glassdoor
            </span>
            <span className="px-2 py-1 bg-purple-800/50 rounded-full hover-lift">
              SimplyHired
            </span>
            <span className="px-2 py-1 bg-purple-800/50 rounded-full hover-lift">
              ZipRecruiter
            </span>
            <span className="px-2 py-1 bg-purple-800/50 rounded-full hover-lift">
              LinkedIn
            </span>
            <span className="px-2 py-1 bg-purple-800/50 rounded-full hover-lift">
              Indeed
            </span>
            <span className="px-2 py-1 bg-purple-800/50 rounded-full hover-lift">
              Naukri
            </span>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex justify-center gap-2 bg-black/40 backdrop-blur-xl rounded-2xl p-2 mb-8 border border-purple-500/20 shadow-2xl shadow-purple-500/10">
            {portals.map((p) => (
              <TabsTrigger
                key={p.key}
                value={p.key}
                className="text-sm font-semibold px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-400 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 data-[state=active]:transform data-[state=active]:scale-105 transition-all duration-300 hover:bg-purple-800/30 hover:transform hover:scale-105 text-purple-200 hover:shadow-purple-500/20"
              >
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {portals.map((p) => (
            <TabsContent key={p.key} value={p.key} className="w-full">
              <Card className="mb-8 bg-black/40 backdrop-blur-xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-500 transform hover:scale-[1.02]">
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
                        className="mt-1 bg-black/50 border-purple-500/30 text-purple-100 placeholder-purple-400/50 focus:border-purple-400 focus:ring-purple-400/20 hover-lift transition-all duration-300"
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
                        className="mt-1 bg-black/50 border-purple-500/30 text-purple-100 placeholder-purple-400/50 focus:border-purple-400 focus:ring-purple-400/20 hover-lift transition-all duration-300"
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
                        className="mt-1 bg-black/50 border-purple-500/30 text-purple-100 placeholder-purple-400/50 focus:border-purple-400 focus:ring-purple-400/20 hover-lift transition-all duration-300"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="mt-4 bg-gradient-to-r from-purple-600 to-purple-400 text-white font-bold py-4 px-8 rounded-xl shadow-2xl shadow-purple-500/25 hover:from-purple-500 hover:to-purple-300 transition-all duration-300 transform hover:scale-105 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                  >
                    {/* 3D Button glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                    <div className="relative z-10">
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Searching...
                        </div>
                      ) : (
                        "Search Jobs"
                      )}
                    </div>
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
                  results.map((job: JobData, idx: number) => {
                    // Prepare fields for ordered display
                    const title = job.title;
                    const company_name = job.company_name;
                    const company_logo = job.company_logo;
                    const location = job.location;
                    const salary = job.salary || job.pay;
                    const jd_url = job.jd_url;
                    const job_description = job.job_description;
                    const extra_sections =
                      job.extra_sections &&
                      typeof job.extra_sections === "object"
                        ? job.extra_sections
                        : null;
                    // Collect all other fields except the above
                    const shownKeys = new Set([
                      "title",
                      "company_name",
                      "company_logo",
                      "location",
                      "salary",
                      "pay",
                      "jd_url",
                      "job_description",
                      "extra_sections",
                    ]);
                    const otherFields = Object.entries(job).filter(
                      ([key, value]) => !shownKeys.has(key)
                    );
                    return (
                      <Card
                        key={idx}
                        className="bg-black/40 backdrop-blur-xl border border-purple-500/20 shadow-2xl hover:scale-[1.02] hover:shadow-purple-500/25 transition-all duration-300 group relative overflow-hidden"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        {/* 3D Card glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-lg blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                        <div className="relative z-10">
                          <CardContent className="p-6 flex flex-col gap-3">
                            {/* Title */}
                            {title && (
                              <div className="text-2xl font-bold text-purple-200 mb-2">
                                {title}
                              </div>
                            )}
                            {/* Company name and logo */}
                            {(company_name || company_logo) && (
                              <div className="flex items-center gap-3 mb-2">
                                {company_logo &&
                                typeof company_logo === "string" &&
                                (company_logo.startsWith("http://") ||
                                  company_logo.startsWith("https://")) ? (
                                  <Image
                                    src={company_logo}
                                    alt="Company logo"
                                    width={48}
                                    height={48}
                                    className="rounded-full object-contain border-2 border-purple-500/30"
                                  />
                                ) : null}
                                {company_name && (
                                  <span className="text-lg font-semibold text-purple-300">
                                    {company_name}
                                  </span>
                                )}
                              </div>
                            )}
                            {/* Location */}
                            {location && (
                              <div className="mb-1">
                                <span className="font-bold text-purple-300">
                                  Location:
                                </span>{" "}
                                <span className="text-purple-100">
                                  {location}
                                </span>
                              </div>
                            )}
                            {/* Salary/Pay */}
                            {salary && (
                              <div className="mb-1">
                                <span className="font-bold text-purple-300">
                                  Salary/Pay:
                                </span>{" "}
                                <span className="text-purple-100">
                                  {salary}
                                </span>
                              </div>
                            )}
                            {/* Job URL */}
                            {jd_url && typeof jd_url === "string" && (
                              <div className="mb-1">
                                <span className="font-bold text-purple-300">
                                  Job URL:
                                </span>{" "}
                                <a
                                  href={jd_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-400 hover:text-purple-300 hover:underline font-semibold break-all transition-colors"
                                >
                                  {jd_url}
                                </a>
                              </div>
                            )}
                            {/* Job Description (markdown) */}
                            {job_description &&
                              typeof job_description === "string" && (
                                <div className="prose prose-invert max-w-none text-purple-100 my-4">
                                  <ReactMarkdown>
                                    {job_description}
                                  </ReactMarkdown>
                                </div>
                              )}
                            {/* Other fields */}
                            {otherFields.map(([key, value]) => {
                              // Remove 'value' if not used, or use '_' if required by linter
                              if (typeof value === "undefined") {
                                return null;
                              }
                              return (
                                <div key={key} className="mb-1 break-words">
                                  <span className="font-bold capitalize text-purple-300 text-sm">
                                    {key.replace(/_/g, " ")}:
                                  </span>{" "}
                                  {Array.isArray(value) ? (
                                    <span className="text-purple-100">
                                      {value.join(", ")}
                                    </span>
                                  ) : value && typeof value === "object" ? (
                                    <details>
                                      <summary className="text-purple-200 cursor-pointer">
                                        Show details
                                      </summary>
                                      <pre className="text-purple-100 bg-black/30 rounded p-2 mt-2 overflow-x-auto text-xs">
                                        {JSON.stringify(value, null, 2)}
                                      </pre>
                                    </details>
                                  ) : (
                                    <span className="text-purple-100">
                                      {String(value)}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            {/* Extra Sections (job description sections) */}
                            {extra_sections && (
                              <div className="mt-4">
                                <h3 className="text-lg font-bold text-purple-400 mb-2">
                                  Job Description Sections
                                </h3>
                                {Object.entries(extra_sections).map(
                                  ([section, content]) => (
                                    <div
                                      key={section}
                                      className="mb-4 p-4 rounded-lg bg-purple-900/20 border border-purple-700/30"
                                    >
                                      <div className="font-semibold text-purple-300 mb-1 capitalize">
                                        {section.replace(/_/g, " ")}
                                      </div>
                                      {Array.isArray(content) ? (
                                        <ul className="list-disc list-inside text-purple-100">
                                          {content.map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <div className="text-purple-100 whitespace-pre-line">
                                          {String(content)}
                                        </div>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </CardContent>
                        </div>
                      </Card>
                    );
                  })
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
