import { useState, useRef, useCallback } from "react";
import {
  Upload,
  CheckCircle,
  XCircle,
  RotateCcw,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { uploadImageAndGetUrl } from "../../utils/uploadImageAndGetUrl";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export interface ImageUploadFieldProps {
  folder: string;
  value?: string;
  onChange?: (url: string) => void;
  onRemove?: () => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageUploadField({
  folder,
  value,
  onChange,
  onRemove,
  accept = ".jpeg,.jpg,.png,.webp,image/*",
  maxSizeMB = 5,
  label,
  hint,
  disabled = false,
  className = "",
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const revokePreview = (url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  };

  const doUpload = useCallback(
    async (file: File) => {
      setStatus("uploading");
      setErrorMessage(null);
      try {
        const url = await uploadImageAndGetUrl(file, folder);
        setStatus("success");
        onChange?.(url);
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(
          err?.message || "Upload failed. Please try again.",
        );
      }
    },
    [folder, onChange],
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        const prev = previewUrl;
        setSelectedFile(file);
        setPreviewUrl(null);
        revokePreview(prev);
        setStatus("error");
        setErrorMessage(`File exceeds the ${maxSizeMB} MB size limit.`);
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      revokePreview(previewUrl);
      setSelectedFile(file);
      setPreviewUrl(objectUrl);
      await doUpload(file);
    },
    [maxSizeMB, previewUrl, doUpload],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  const handleRetry = () => {
    if (selectedFile) doUpload(selectedFile);
  };

  const handleRemove = () => {
    revokePreview(previewUrl);
    setStatus("idle");
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    onRemove?.();
    onChange?.("");
  };

  const handleReplaceClick = () => {
    revokePreview(previewUrl);
    setStatus("idle");
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    // Immediately open file picker for replacement
    inputRef.current?.click();
  };

  const isUploading = status === "uploading";

  return (
    <div className={`grid gap-2 ${className}`}>
      {label && (
        <label
          className="text-sm font-medium"
          style={{ color: "#3D3935" }}
        >
          {label}
        </label>
      )}

      {/* Idle: show existing preview + choose/replace trigger */}
      {status === "idle" && (
        <>
          {value && (
            <div
              className="relative rounded-md overflow-hidden border-2"
              style={{ borderColor: "#DCD4CD" }}
            >
              <img
                src={value}
                alt="Current"
                className="w-full h-28 object-cover"
              />
            </div>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 h-10 w-full px-3 rounded-md border-2 text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{
              borderColor: "#DCD4CD",
              borderStyle: "dashed",
              backgroundColor: "#FEFCFA",
              color: "#3D3935",
            }}
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span>{value ? "Replace image" : "Choose image"}</span>
          </button>
          {hint && (
            <p className="text-xs text-gray-500">{hint}</p>
          )}
        </>
      )}

      {/* Active states: uploading / success / error */}
      {status !== "idle" && (
        <div
          className="rounded-md border-2 overflow-hidden"
          style={{ borderColor: "#DCD4CD", backgroundColor: "#FEFCFA" }}
          role="status"
          aria-live="polite"
          aria-label={
            status === "uploading"
              ? "Uploading image"
              : status === "success"
                ? "Upload complete"
                : "Upload failed"
          }
        >
          {/* File row */}
          <div className="flex items-center gap-3 p-3">
            {/* Thumbnail */}
            <div
              className="w-12 h-12 rounded shrink-0 overflow-hidden border"
              style={{
                borderColor: "#DCD4CD",
                backgroundColor: "#F0EBE7",
              }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={selectedFile?.name ?? "Preview"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>

            {/* Filename + size */}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "#3D3935" }}
              >
                {selectedFile?.name ?? "Image"}
              </p>
              {selectedFile && (
                <p className="text-xs text-gray-500">
                  {formatBytes(selectedFile.size)}
                </p>
              )}
            </div>

            {/* Status icon / actions */}
            <div className="flex items-center gap-2 shrink-0">
              {status === "uploading" && (
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  Uploading image…
                </span>
              )}

              {status === "success" && (
                <>
                  <CheckCircle
                    className="w-4 h-4 text-green-600"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium text-green-700 whitespace-nowrap">
                    Upload complete
                  </span>
                  <button
                    type="button"
                    onClick={handleReplaceClick}
                    className="text-xs underline ml-1 hover:opacity-70 transition-opacity"
                    style={{ color: "#3D3935" }}
                  >
                    Replace
                  </button>
                </>
              )}

              {status === "error" && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {/* Indeterminate progress bar */}
          {status === "uploading" && (
            <div
              className="h-1 w-full overflow-hidden"
              style={{ backgroundColor: "#EDE8E4" }}
              role="progressbar"
              aria-valuetext="Uploading"
            >
              <div
                className="h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, #E9CFCA 0%, #3D3935 50%, #E9CFCA 100%)",
                  width: "45%",
                  animation:
                    "imageupload-indeterminate 1.4s ease-in-out infinite",
                }}
              />
            </div>
          )}

          {/* Error row */}
          {status === "error" && (
            <div className="px-3 pb-3 flex flex-wrap items-center gap-2">
              <XCircle
                className="w-4 h-4 text-red-500 shrink-0"
                aria-hidden="true"
              />
              <p className="text-xs text-red-600 flex-1 min-w-0">
                {errorMessage ?? "Upload failed. Please try again."}
              </p>
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border transition-colors hover:opacity-80"
                  style={{ borderColor: "#DCD4CD", color: "#3D3935" }}
                >
                  <RotateCcw className="w-3 h-3" />
                  Retry
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setStatus("idle");
                  setSelectedFile(null);
                  revokePreview(previewUrl);
                  setPreviewUrl(null);
                  setErrorMessage(null);
                  setTimeout(() => inputRef.current?.click(), 0);
                }}
                className="text-xs font-medium px-2 py-1 rounded border transition-colors hover:opacity-80"
                style={{ borderColor: "#DCD4CD", color: "#3D3935" }}
              >
                Choose again
              </button>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        aria-hidden="true"
        tabIndex={-1}
      />

      <style>{`
        @keyframes imageupload-indeterminate {
          0%   { transform: translateX(-220%); }
          100% { transform: translateX(320%); }
        }
      `}</style>
    </div>
  );
}
