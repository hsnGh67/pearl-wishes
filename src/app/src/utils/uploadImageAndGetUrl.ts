import { supabase } from "../config/supabase";

export const uploadImageAndGetUrl = async (
  file: File | null,
  folder: string,
) => {
  if (!file) {
    return "";
  }

  const sanitizedFilename = file.name.replace(
    /[^a-zA-Z0-9_.-]/g,
    "-",
  );
  const filePath = `${folder}/${Date.now()}-${sanitizedFilename}`;

  const { data, error: uploadError } = await supabase.storage
    .from("images")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Image upload failed:", uploadError);
    throw uploadError;
  }

  console.log("data", data);

  const { data: publicUrlData, error: publicUrlError } =
    supabase.storage.from("images").getPublicUrl(filePath);

  if (publicUrlError) {
    console.error(
      "Generating image public URL failed:",
      publicUrlError,
    );
    throw `${publicUrlError}/${data.fullPath}`;
  }

  return publicUrlData.publicUrl;
};