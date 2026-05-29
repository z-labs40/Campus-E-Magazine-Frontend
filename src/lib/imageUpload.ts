import { api } from "@/lib/api";

export async function uploadImageToCloudinary(
  file: File,
  folder: string
): Promise<{ url: string; name: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await api.post("/uploads/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // Expected response: { ok: true, data: { url, publicId? } }
  return {
    url: res.data?.data?.url as string,
    name: file.name,
  };
}

