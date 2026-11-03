import api from "@/lib/api";

export async function uploadListingImages(files: File[]): Promise<string[]> {
    const formData = new FormData();
    for (const file of files) {
        formData.append("images", file);
    }
    const res = await api.post("/upload/listing-drafts", formData);
    return res.data?.data?.urls || [];
}
