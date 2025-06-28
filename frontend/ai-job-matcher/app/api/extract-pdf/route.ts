import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 })
    }

    // For now, return a helpful message directing users to manual input
    // This is more reliable than trying to parse complex PDF structures
    return NextResponse.json(
      {
        error: "PDF text extraction requires manual input",
        details: "For the most accurate results, please copy your resume text manually.",
        suggestions: [
          "Open your PDF in a PDF viewer (Adobe Reader, Chrome, etc.)",
          "Select all text (Ctrl+A or Cmd+A) and copy (Ctrl+C or Cmd+C)",
          "Paste the text in the text area below",
          "Alternatively, use 'Save As Text' from your PDF viewer",
          "Online PDF-to-text converters are also available",
        ],
        manualInputRecommended: true,
        fileName: file.name,
        fileSize: file.size,
      },
      { status: 422 },
    )
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
