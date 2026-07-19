import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import UploadZone from "@/components/UploadZone"
import NoteInput from "@/components/NoteInput"
import ReportPreview from "@/components/ReportPreview"
import VoicePlayer from "@/components/VoicePlayer"

describe("UploadZone", () => {
  it("renders upload prompt", () => {
    render(<UploadZone images={[]} onImagesChange={vi.fn()} />)
    expect(screen.getByText(/drop screenshots/i)).toBeInTheDocument()
  })

  it("shows image count after adding files", () => {
    render(<UploadZone images={["img1", "img2"]} onImagesChange={vi.fn()} />)
    expect(screen.getByText("#1")).toBeInTheDocument()
    expect(screen.getByText("#2")).toBeInTheDocument()
  })

  it("calls onImagesChange when removing an image", () => {
    const onChange = vi.fn()
    render(<UploadZone images={["img1", "img2"]} onImagesChange={onChange} />)
    const removeBtns = screen.getAllByText("×")
    fireEvent.click(removeBtns[0])
    expect(onChange).toHaveBeenCalledWith(["img2"])
  })
})

describe("NoteInput", () => {
  const defaultProps = { notes: "", onNotesChange: vi.fn(), period: "weekly" as const, onPeriodChange: vi.fn(), tags: "", onTagsChange: vi.fn() }

  it("renders all period buttons", () => {
    render(<NoteInput {...defaultProps} />)
    expect(screen.getByText("daily")).toBeInTheDocument()
    expect(screen.getByText("weekly")).toBeInTheDocument()
    expect(screen.getByText("monthly")).toBeInTheDocument()
  })

  it("highlights selected period", () => {
    render(<NoteInput {...defaultProps} period="daily" />)
    expect(screen.getByText("daily").closest("button")).toHaveClass("bg-blue-600")
  })

  it("calls onPeriodChange on period click", async () => {
    const onChange = vi.fn()
    render(<NoteInput {...defaultProps} onPeriodChange={onChange} />)
    await userEvent.click(screen.getByText("monthly"))
    expect(onChange).toHaveBeenCalledWith("monthly")
  })

  it("calls onNotesChange on text input", async () => {
    const onChange = vi.fn()
    render(<NoteInput {...defaultProps} onNotesChange={onChange} />)
    const textarea = screen.getByPlaceholderText(/what did you work on/i)
    await userEvent.type(textarea, "fixed bugs")
    expect(onChange).toHaveBeenCalled()
  })
})

describe("ReportPreview", () => {
  const sampleReport = {
    summary: "Great progress this week",
    sections: [{ title: "Development", content: "Shipped 3 features" }],
    dataHighlights: ["Revenue up 20%", "5 bugs fixed"],
    nextSteps: ["Deploy to production"],
    imageAnalysis: "Chart shows growth trend",
  }

  it("shows loading skeleton when loading", () => {
    const { container } = render(<ReportPreview report={null} loading={true} />)
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("renders nothing when no report and not loading", () => {
    const { container } = render(<ReportPreview report={null} loading={false} />)
    expect(container.innerHTML).toBe("")
  })

  it("displays all report sections", () => {
    render(<ReportPreview report={sampleReport} loading={false} />)
    expect(screen.getByText("Executive Summary")).toBeInTheDocument()
    expect(screen.getByText("Great progress this week")).toBeInTheDocument()
    expect(screen.getByText("Key Highlights")).toBeInTheDocument()
    expect(screen.getByText("Revenue up 20%")).toBeInTheDocument()
    expect(screen.getByText("Development")).toBeInTheDocument()
    expect(screen.getByText("Shipped 3 features")).toBeInTheDocument()
    expect(screen.getByText("Next Steps")).toBeInTheDocument()
    expect(screen.getByText("Deploy to production")).toBeInTheDocument()
  })

  it("shows image analysis raw toggle", () => {
    render(<ReportPreview report={sampleReport} loading={false} />)
    expect(screen.getByText("Screenshot analysis raw")).toBeInTheDocument()
  })

  it("renders editable fields when editing is true", () => {
    render(<ReportPreview report={sampleReport} loading={false} editing={true} onReportChange={vi.fn()} />)
    const textareas = screen.getAllByRole("textbox")
    expect(textareas.length).toBeGreaterThan(0)
  })
})

describe("VoicePlayer", () => {
  it("renders nothing when text is empty", () => {
    const { container } = render(<VoicePlayer text="" />)
    expect(container.innerHTML).toBe("")
  })

  it("renders play button when text is provided", () => {
    render(<VoicePlayer text="Some report text" />)
    expect(screen.getByText("Play Summary")).toBeInTheDocument()
  })
})