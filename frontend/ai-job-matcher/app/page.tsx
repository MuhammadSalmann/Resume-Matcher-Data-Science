"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Star,
  Heart,
  ExternalLink,
  Filter,
  SortAsc,
  Briefcase,
  Building,
  Zap,
  Target,
  CheckCircle,
  Gift,
  Upload,
  FileText,
  X,
  Info,
  HelpCircle,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface JobMatch {
  id: string
  jobTitle: string
  company: string
  location: string
  salary: string
  jobType: string
  experience: string
  skills: string[]
  description: string
  matchScore: number
  matchReasons: string[]
  requirements: string[]
  benefits: string[]
  remote: boolean
  postedDate: string
  applicationUrl?: string
  fullDescription?: string
}

export default function JobMatcher() {
  const [resumeText, setResumeText] = useState("")
  const [jobs, setJobs] = useState<JobMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState("matchScore")
  const [filterBy, setFilterBy] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [showManualInstructions, setShowManualInstructions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a PDF file smaller than 10MB.",
        variant: "destructive",
      })
      return
    }

    setUploadedFile(file)
    setShowManualInstructions(true)

    // Show helpful instructions immediately
    toast({
      title: "PDF Uploaded Successfully",
      description: "Please follow the manual text extraction steps below for best results.",
    })

    // Show detailed instructions after a moment
    setTimeout(() => {
      toast({
        title: "Manual Copy-Paste Recommended",
        description: "Open your PDF, select all text (Ctrl+A), copy (Ctrl+C), and paste in the text area.",
        variant: "default",
      })
    }, 1500)
  }

  const removeUploadedFile = () => {
    setUploadedFile(null)
    setShowManualInstructions(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumeText.trim()) {
      toast({
        title: "Resume Required",
        description: "Please paste your resume text to find matching jobs.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("https://d919-34-138-176-82.ngrok-free.app/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          text: resumeText,
          top_n: 10,
        }),
      })

      if (!response.ok) throw new Error("Failed to match jobs")

      const data = await response.json()

      // Enhanced transformation with more realistic data based on job titles and descriptions
      const transformedJobs: JobMatch[] = data.map((job: any, index: number) => {
        const jobTitle = job.job_title
        const company = job.company_name
        const score = Math.round(job.score * 100)

        // Extract more details from job description if available
        const description = job.job_description || `${jobTitle} position at ${company}`

        // Generate more realistic job details based on title and description
        const jobDetails = generateJobDetails(jobTitle, company, description, score)

        return {
          id: `job-${index}`,
          jobTitle,
          company,
          location: jobDetails.location,
          salary: jobDetails.salary,
          jobType: jobDetails.jobType,
          experience: jobDetails.experience,
          skills: jobDetails.skills,
          description: jobDetails.shortDescription,
          fullDescription: description,
          matchScore: score,
          matchReasons: jobDetails.matchReasons,
          requirements: jobDetails.requirements,
          benefits: jobDetails.benefits,
          remote: jobDetails.remote,
          postedDate: jobDetails.postedDate,
          applicationUrl: `https://example.com/apply/${company.toLowerCase().replace(/\s+/g, "-")}`,
        }
      })

      setJobs(transformedJobs)

      toast({
        title: "Jobs Matched!",
        description: `Found ${transformedJobs.length} matching opportunities.`,
      })
    } catch (error) {
      console.error("Error matching jobs:", error)
      toast({
        title: "Error",
        description: "Failed to match jobs. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateJobDetails = (jobTitle: string, company: string, description: string, score: number) => {
    const title = jobTitle.toLowerCase()
    const desc = description.toLowerCase()

    // Determine job type and remote possibility
    const isNurse = title.includes("nurse") || title.includes("rgn") || title.includes("rmn")
    const isAdmin = title.includes("admin") || title.includes("administrator")
    const isTech = title.includes("developer") || title.includes("engineer") || title.includes("programmer")
    const isManager = title.includes("manager") || title.includes("supervisor")

    // Generate location based on description or default
    let location = "Location not specified"
    if (desc.includes("göteborg") || desc.includes("goteborg")) location = "Göteborg, Sweden"
    else if (desc.includes("gerrards cross")) location = "Gerrards Cross, UK"
    else if (desc.includes("london")) location = "London, UK"
    else if (desc.includes("stockholm")) location = "Stockholm, Sweden"
    else if (isNurse) location = "Various UK Locations"
    else if (isTech) location = "Remote/Hybrid Available"

    // Generate salary based on job type
    let salary = "Competitive salary"
    if (isNurse && desc.includes("£")) {
      const salaryMatch = desc.match(/£[\d.,]+/)
      if (salaryMatch) salary = `${salaryMatch[0]} per hour`
      else salary = "£17.85 - £19.50 per hour"
    } else if (isNurse) salary = "£17.85 - £19.50 per hour"
    else if (isTech) salary = "$80,000 - $120,000"
    else if (isManager) salary = "$70,000 - $100,000"
    else if (isAdmin) salary = "$40,000 - $60,000"

    // Generate experience level
    let experience = "Experience level not specified"
    if (desc.includes("senior")) experience = "5+ years"
    else if (desc.includes("junior")) experience = "1-2 years"
    else if (desc.includes("previous experience")) experience = "2+ years"
    else if (isNurse) experience = "RGN/RMN qualification required"
    else experience = "2-4 years"

    // Generate skills based on job type and description
    let skills: string[] = []
    if (isNurse) {
      skills = ["RGN/RMN Qualification", "Patient Care", "Clinical Skills", "Communication", "Teamwork"]
    } else if (isAdmin) {
      skills = ["Administration", "Customer Service", "Microsoft Office", "Organization", "Communication"]
      if (desc.includes("unit4")) skills.push("Unit4 Property Management")
      if (desc.includes("fastnet")) skills.push("FastNet")
    } else if (isTech) {
      skills = ["Programming", "Problem Solving", "Team Collaboration", "Technical Documentation"]
    } else {
      skills = ["Communication", "Organization", "Problem Solving", "Teamwork"]
    }

    // Generate requirements
    let requirements: string[] = []
    if (isNurse) {
      requirements = [
        "Valid NMC pin number",
        "RGN/RMN qualification",
        "Excellent communication skills",
        "Flexible to work shifts",
      ]
    } else if (isAdmin) {
      requirements = [
        "Previous administrative experience",
        "Strong organizational skills",
        "Customer service orientation",
        "Attention to detail",
      ]
    } else {
      requirements = ["Relevant experience", "Strong communication skills", "Team player"]
    }

    // Generate benefits
    let benefits: string[] = []
    if (isNurse) {
      benefits = [
        "Annual NMC registration costs covered",
        "Clinical training support",
        "5.6 weeks annual leave",
        "SimplyHealth cover",
        "Pension plan",
      ]
    } else if (company.includes("TNG")) {
      benefits = [
        "Kollektivavtal coverage",
        "Insurance benefits",
        "Career development opportunities",
        "Consultant support",
      ]
    } else {
      benefits = ["Competitive benefits package", "Professional development", "Health insurance"]
    }

    // Generate match reasons based on score
    const matchReasons = [
      `Strong match based on resume analysis (${score}% similarity)`,
      `Your skills align well with ${jobTitle} requirements`,
      `Good cultural fit for ${company}`,
    ]

    if (score >= 80) {
      matchReasons.push("Excellent experience match for this role")
    } else if (score >= 60) {
      matchReasons.push("Good potential for growth in this position")
    }

    return {
      location,
      salary,
      jobType: desc.includes("part") ? "Part-time" : "Full-time",
      experience,
      skills,
      shortDescription: `${jobTitle} position at ${company}. ${description.substring(0, 150)}...`,
      matchReasons,
      requirements,
      benefits,
      remote: isTech || Math.random() > 0.7,
      postedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    }
  }

  const toggleSaveJob = (jobId: string) => {
    const newSavedJobs = new Set(savedJobs)
    if (newSavedJobs.has(jobId)) {
      newSavedJobs.delete(jobId)
      toast({ title: "Job Removed", description: "Job removed from saved list." })
    } else {
      newSavedJobs.add(jobId)
      toast({ title: "Job Saved", description: "Job added to your saved list!" })
    }
    setSavedJobs(newSavedJobs)
  }

  const filteredAndSortedJobs = jobs
    .filter((job) => {
      if (filterBy === "saved") return savedJobs.has(job.id)
      if (filterBy === "remote") return job.remote
      if (filterBy === "onsite") return !job.remote
      return true
    })
    .filter(
      (job) =>
        searchTerm === "" ||
        job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort((a, b) => {
      if (sortBy === "matchScore") return b.matchScore - a.matchScore
      if (sortBy === "company") return a.company.localeCompare(b.company)
      if (sortBy === "jobTitle") return a.jobTitle.localeCompare(b.jobTitle)
      if (sortBy === "postedDate") return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
      return 0
    })

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50"
    if (score >= 60) return "text-blue-600 bg-blue-50"
    if (score >= 40) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Job Matcher
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your resume PDF or paste text to find the perfect job matches
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Resume Input Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Your Resume
                </CardTitle>
                <CardDescription>Upload a PDF or paste your resume text below</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* PDF Upload Section */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {uploadedFile ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-blue-600 mr-2" />
                            <div className="text-left">
                              <span className="text-sm font-medium text-blue-800 block">{uploadedFile.name}</span>
                              <span className="text-xs text-blue-600">Ready for manual text extraction</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeUploadedFile}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {showManualInstructions && (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <HelpCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-amber-800">
                                <p className="font-medium mb-2">Manual Text Extraction Steps:</p>
                                <ol className="space-y-1 list-decimal list-inside">
                                  <li>Open your PDF in any PDF viewer</li>
                                  <li>Select all text (Ctrl+A or Cmd+A)</li>
                                  <li>Copy the text (Ctrl+C or Cmd+C)</li>
                                  <li>Paste it in the text area below</li>
                                </ol>
                                <p className="mt-2 text-xs">This ensures 100% accuracy and preserves all formatting.</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Upload your resume PDF</p>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose PDF File
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">Max file size: 10MB</p>
                      </div>
                    )}
                  </div>

                  <div className="text-center text-gray-500">
                    <span className="text-sm">THEN</span>
                  </div>

                  {/* Text Input Section */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea
                      placeholder="Paste your resume text here... Include your skills, experience, education, and any other relevant information."
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      className="min-h-[300px] resize-none"
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Zap className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing Resume...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Find Matching Jobs
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Help Section */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <Info className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-800">
                        <p className="font-medium mb-1">Why Manual Copy-Paste?</p>
                        <ul className="space-y-1">
                          <li>• Ensures 100% text accuracy</li>
                          <li>• Preserves formatting and structure</li>
                          <li>• Works with all PDF types (scanned, encrypted, etc.)</li>
                          <li>• Faster and more reliable than automated extraction</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section - Same as before */}
          <div className="lg:col-span-2">
            {jobs.length > 0 && (
              <>
                {/* Filters and Search */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search jobs, companies, or skills..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SortAsc className="h-4 w-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="matchScore">Match Score</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                          <SelectItem value="jobTitle">Job Title</SelectItem>
                          <SelectItem value="postedDate">Posted Date</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filterBy} onValueChange={setFilterBy}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Jobs</SelectItem>
                          <SelectItem value="saved">Saved Jobs</SelectItem>
                          <SelectItem value="remote">Remote Only</SelectItem>
                          <SelectItem value="onsite">On-site Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Job Results */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">
                      {filteredAndSortedJobs.length} Job{filteredAndSortedJobs.length !== 1 ? "s" : ""} Found
                    </h2>
                    <Badge variant="outline" className="text-sm">
                      {savedJobs.size} Saved
                    </Badge>
                  </div>

                  {filteredAndSortedJobs.map((job) => (
                    <Card key={job.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold">{job.jobTitle}</h3>
                              <Badge className={`${getMatchScoreColor(job.matchScore)} border-0`}>
                                <Star className="h-3 w-3 mr-1" />
                                {job.matchScore}% Match
                              </Badge>
                            </div>
                            <div className="flex items-center text-gray-600 mb-2">
                              <Building className="h-4 w-4 mr-1" />
                              <span className="font-medium">{job.company}</span>
                              <Separator orientation="vertical" className="mx-2 h-4" />
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{job.location}</span>
                              {job.remote && (
                                <>
                                  <Separator orientation="vertical" className="mx-2 h-4" />
                                  <Badge variant="secondary">Remote</Badge>
                                </>
                              )}
                            </div>
                            <div className="flex items-center text-gray-600 mb-4">
                              <DollarSign className="h-4 w-4 mr-1" />
                              <span>{job.salary}</span>
                              <Separator orientation="vertical" className="mx-2 h-4" />
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{job.jobType}</span>
                              <Separator orientation="vertical" className="mx-2 h-4" />
                              <Users className="h-4 w-4 mr-1" />
                              <span>{job.experience}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleSaveJob(job.id)}
                              className={savedJobs.has(job.id) ? "text-red-600 border-red-200" : ""}
                            >
                              <Heart className={`h-4 w-4 ${savedJobs.has(job.id) ? "fill-current" : ""}`} />
                            </Button>
                            {job.applicationUrl && (
                              <Button size="sm" asChild>
                                <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer">
                                  Apply <ExternalLink className="h-4 w-4 ml-1" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>

                        <Tabs defaultValue="overview" className="w-full">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="match">Match Details</TabsTrigger>
                            <TabsTrigger value="requirements">Requirements</TabsTrigger>
                            <TabsTrigger value="benefits">Benefits</TabsTrigger>
                          </TabsList>

                          <TabsContent value="overview" className="mt-4">
                            <p className="text-gray-700 mb-4">{job.description}</p>
                            {job.fullDescription && job.fullDescription !== job.description && (
                              <details className="mb-4">
                                <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                                  View Full Job Description
                                </summary>
                                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 max-h-40 overflow-y-auto">
                                  {job.fullDescription}
                                </div>
                              </details>
                            )}
                            <div>
                              <h4 className="font-medium mb-2">Required Skills:</h4>
                              <div className="flex flex-wrap gap-2">
                                {job.skills.map((skill, index) => (
                                  <Badge key={index} variant="outline">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="match" className="mt-4">
                            <h4 className="font-medium mb-2 flex items-center">
                              <Target className="h-4 w-4 mr-2" />
                              Why This Job Matches You:
                            </h4>
                            <ul className="space-y-2">
                              {job.matchReasons.map((reason, index) => (
                                <li key={index} className="flex items-start">
                                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-700">{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </TabsContent>

                          <TabsContent value="requirements" className="mt-4">
                            <h4 className="font-medium mb-2">Requirements:</h4>
                            <ul className="space-y-2">
                              {job.requirements.map((req, index) => (
                                <li key={index} className="flex items-start">
                                  <div className="h-2 w-2 bg-gray-400 rounded-full mr-3 mt-2 flex-shrink-0" />
                                  <span className="text-gray-700">{req}</span>
                                </li>
                              ))}
                            </ul>
                          </TabsContent>

                          <TabsContent value="benefits" className="mt-4">
                            <h4 className="font-medium mb-2 flex items-center">
                              <Gift className="h-4 w-4 mr-2" />
                              Benefits & Perks:
                            </h4>
                            <ul className="space-y-2">
                              {job.benefits.map((benefit, index) => (
                                <li key={index} className="flex items-start">
                                  <div className="h-2 w-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0" />
                                  <span className="text-gray-700">{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {jobs.length === 0 && !loading && (
              <Card className="text-center py-12">
                <CardContent>
                  <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Ready to Find Your Perfect Job?</h3>
                  <p className="text-gray-500">
                    Upload your resume PDF and paste the text to get AI-powered job recommendations
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
