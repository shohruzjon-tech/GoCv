"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cvApi, aiApi, pdfApi } from "@/lib/api";
import { Cv, ChatMessage } from "@/types";
import {
  Sparkles,
  Send,
  Download,
  Globe,
  Save,
  Eye,
  MessageCircle,
  X,
  RefreshCw,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

export default function CvBuilderPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [cv, setCv] = useState<Cv | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe your professional background");
      return;
    }
    setLoading(true);
    try {
      const res = await cvApi.aiGenerate({
        prompt,
        cvId: cv?._id,
      });
      setCv(res.data);
      toast.success("CV generated successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate CV");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!cv) return;
    setSaving(true);
    try {
      await cvApi.update(cv._id, {
        title: cv.title,
        sections: cv.sections,
        personalInfo: cv.personalInfo,
        summary: cv.summary,
        theme: cv.theme,
      });
      toast.success("CV saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!cv) return;
    try {
      const res = await cvApi.publish(cv._id);
      setCv(res.data);
      toast.success("CV published! It's now publicly accessible.");
    } catch {
      toast.error("Failed to publish");
    }
  };

  const handleDownloadPdf = async () => {
    if (!cv) return;
    try {
      const res = await pdfApi.download(cv._id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cv.title || "cv"}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Failed to download PDF");
    }
  };

  const handleRegenerateHtml = async () => {
    if (!cv) return;
    setLoading(true);
    try {
      const res = await cvApi.regenerateHtml(cv._id);
      setCv(res.data);
      toast.success("CV layout regenerated!");
    } catch {
      toast.error("Failed to regenerate");
    } finally {
      setLoading(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: "user", content: chatInput },
    ];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await aiApi.chat(newMessages, cv || undefined);
      setChatMessages([
        ...newMessages,
        { role: "assistant", content: res.data.message },
      ]);
    } catch {
      toast.error("Chat failed");
    } finally {
      setChatLoading(false);
    }
  };

  const handleEditSection = async (sectionType: string, prompt: string) => {
    if (!cv) return;
    setLoading(true);
    try {
      const res = await cvApi.aiEditSection(cv._id, {
        prompt,
        sectionType,
      });
      setCv(res.data);
      toast.success(`${sectionType} section updated!`);
    } catch {
      toast.error("Failed to edit section");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI CV Builder</h1>
          <p className="text-sm text-zinc-500">
            Describe your background and let AI create your CV
          </p>
        </div>
        {cv && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.04] disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handlePublish}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 shadow-lg shadow-emerald-600/25"
            >
              <Globe className="h-4 w-4" />
              Publish
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-500 shadow-lg shadow-purple-600/25"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
          </div>
        )}
      </div>

      {/* AI Prompt Input */}
      <div className="mb-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Tell AI about yourself
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="I'm a Full Stack Developer with 5 years of experience in React, Node.js, and TypeScript. I've worked at Google and Amazon, building scalable web applications. I have a CS degree from MIT..."
          className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          rows={4}
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {cv ? "Regenerate CV" : "Generate CV"}
              </>
            )}
          </button>
          {cv && (
            <button
              onClick={handleRegenerateHtml}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.04] disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Layout
            </button>
          )}
        </div>
      </div>

      {/* CV Preview */}
      {cv && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sections Editor */}
          <div className="space-y-4 lg:col-span-1">
            <h3 className="text-lg font-semibold text-white">Sections</h3>
            {cv.sections?.map((section, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-medium text-white">{section.title}</h4>
                  <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-zinc-500 ring-1 ring-white/10">
                    {section.type}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const editPrompt = window.prompt(
                      `How would you like to edit the "${section.title}" section?`,
                    );
                    if (editPrompt) {
                      handleEditSection(section.type, editPrompt);
                    }
                  }}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300"
                >
                  <Sparkles className="h-3 w-3" /> Edit with AI
                </button>
              </div>
            ))}
          </div>

          {/* HTML Preview */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Preview</h3>
              {cv.isPublic && cv.slug && (
                <a
                  href={`/cv/${cv.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
                >
                  <Globe className="h-4 w-4" />
                  Public URL
                </a>
              )}
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white shadow-sm">
              {cv.aiGeneratedHtml ? (
                <iframe
                  srcDoc={cv.aiGeneratedHtml}
                  className="h-[800px] w-full"
                  title="CV Preview"
                />
              ) : (
                <div className="flex h-96 items-center justify-center bg-white/[0.02] text-zinc-600">
                  <div className="text-center">
                    <FileText className="mx-auto mb-2 h-10 w-10" />
                    <p>HTML preview will appear after generation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Widget */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500"
      >
        {chatOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[500px] w-96 flex-col rounded-2xl border border-white/[0.06] bg-[#0e0e24] shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2 border-b border-white/[0.06] p-4">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">AI CV Assistant</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <p className="text-center text-sm text-zinc-500">
                Ask me anything about your CV!
              </p>
            )}
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-white/5 text-zinc-200 ring-1 ring-white/10"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white/5 px-4 py-2 ring-1 ring-white/10">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:0.1s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="border-t border-white/[0.06] p-3">
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                placeholder="Ask about your CV..."
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
              <button
                onClick={handleChatSend}
                disabled={chatLoading}
                className="rounded-xl bg-indigo-600 p-2 text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
