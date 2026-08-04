"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Upload, X, CheckCircle2, Loader2, FileText } from "lucide-react";
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
        type: "info"
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
                setFile(null); // Clear file to hide upload button
                onUploadSuccess(res.data.data.idDocumentUrl);
                setModal({
                    open: true,
                    title: "Upload Successful",
                    message: "Your ID document has been submitted and is now pending review by our team.",
                    type: "success"
                });
            }
        } catch (error) {
            console.error("Upload failed:", error);
            setModal({
                open: true,
                title: "Upload Failed",
                message: "We couldn't upload your document. Please check your connection and try again.",
                type: "error"
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
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 text-gray-400 mb-3" />
                        <p className="mb-2 text-sm text-gray-500 font-bold">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-400">PNG, JPG or PDF (MAX. 10MB)</p>
                    </div>
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" />
                </label>
            ) : (
                <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-white">
                    {previewUrl.toLowerCase().endsWith('.pdf') || file?.type === 'application/pdf' ? (
                        <div className="h-48 flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <FileText className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                                <p className="text-sm font-bold text-gray-700">{file?.name || 'Document uploaded'}</p>
                            </div>
                        </div>
                    ) : (
                        <img src={previewUrl} alt="ID Preview" className="w-full h-48 object-cover" />
                    )}

                    {!uploading && (
                        <button
                            onClick={clearFile}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm text-gray-600 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}

                    {uploading && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-blue)]" />
                                <p className="text-sm font-bold text-gray-900">Uploading...</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {file && !uploading && (
                <Button
                    className="w-full bg-[var(--color-brand-blue)] font-bold py-6 text-base"
                    onClick={handleUpload}
                >
                    Confirm & Upload ID
                </Button>
            )}

            {currentUrl && !file && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-100 font-bold text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Document uploaded and pending review
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
