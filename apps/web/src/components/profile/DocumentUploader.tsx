"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Upload, X, CheckCircle2, Loader2, FileText, ShieldAlert, ArrowUpRight } from "lucide-react";
import { StatusModal } from "@/components/ui/StatusModal";
import api from "@/lib/api";

interface DocumentUploaderProps {
    userId: string;
    onUploadSuccess: (url: string) => void;
    currentUrl?: string | null;
}

export function DocumentUploader({ userId, onUploadSuccess, currentUrl }: DocumentUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);

    // Modal State
    const [modal, setModal] = useState<{
        open: boolean;
        title: string;
        message: string;
        type: "success" | "error" | "info";
    }>({
        open: false,
        title: "",
        message: "",
        type: "info",
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleUpload = async () => {
        if (!file || !userId) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("idDocument", file);
            formData.append("userId", userId);

            const res = await api.post("/upload/id-document", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (res.data.success) {
                setFile(null);
                onUploadSuccess(res.data.data.idDocumentUrl);
                setModal({
                    open: true,
                    title: "Document Uploaded",
                    message: "Your government ID document has been submitted and is currently being verified by our compliance team.",
                    type: "success",
                });
            }
        } catch (error: any) {
            console.error("Upload failed:", error);
            setModal({
                open: true,
                title: "Upload Failed",
                message: error.response?.data?.message || "We couldn't upload your document. Please check your file and try again.",
                type: "error",
            });
        } finally {
            setUploading(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreviewUrl(currentUrl || null);
    };

    return (
        <div className="space-y-4">
            {!previewUrl ? (
                <label className="group flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-[var(--border-color)] hover:border-[var(--color-brand-green)] rounded-2xl cursor-pointer bg-[var(--bg-muted)]/40 hover:bg-[var(--bg-muted)] transition-all">
                    <div className="flex flex-col items-center justify-center p-5 text-center">
                        <div className="h-11 w-11 rounded-2xl bg-[var(--color-brand-green)]/10 text-[var(--color-brand-green)] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                            <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-[var(--text-primary)] mb-1">
                            Click to upload or drag & drop document
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] font-medium">
                            Supported: PNG, JPG, or PDF (Max 10MB)
                        </p>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*,application/pdf"
                    />
                </label>
            ) : (
                <div className="relative rounded-2xl border border-[var(--border-color)] overflow-hidden bg-[var(--bg-card)]">
                    {previewUrl.toLowerCase().endsWith(".pdf") || file?.type === "application/pdf" ? (
                        <div className="h-44 flex items-center justify-center bg-[var(--bg-muted)]/50 p-4">
                            <div className="text-center">
                                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-2">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <p className="text-xs font-bold text-[var(--text-primary)] truncate max-w-xs">
                                    {file?.name || "Official ID Document (PDF)"}
                                </p>
                                <p className="text-[11px] text-[var(--text-muted)]">PDF Document Attached</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative h-44 bg-[var(--bg-muted)]">
                            <img
                                src={previewUrl}
                                alt="ID Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {!uploading && (
                        <button
                            type="button"
                            onClick={clearFile}
                            className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all"
                            title="Remove file"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}

                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2 text-white">
                                <Loader2 className="h-7 w-7 animate-spin text-[var(--color-brand-green)]" />
                                <p className="text-xs font-bold">Uploading document...</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {file && !uploading && (
                <Button
                    className="w-full h-11 bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold rounded-xl text-xs gap-2 shadow-sm transition-all"
                    onClick={handleUpload}
                >
                    <Upload className="h-4 w-4" />
                    Confirm & Upload ID Document
                </Button>
            )}

            {currentUrl && !file && (
                <div className="flex items-center justify-between gap-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl font-bold">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Government ID submitted & attached to profile</span>
                    </div>
                    <a
                        href={currentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] hover:underline"
                    >
                        View <ArrowUpRight className="h-3 w-3" />
                    </a>
                </div>
            )}

            <StatusModal
                open={modal.open}
                onClose={() => setModal({ ...modal, open: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />
        </div>
    );
}
