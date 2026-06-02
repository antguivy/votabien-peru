"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { UploadCloud, X, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";
import { getPresignedUrl, deleteFromR2 } from "../_lib/upload-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  className,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const processAndUploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }

    try {
      setIsUploading(true);

      // Comprimir la imagen
      const options = {
        maxSizeMB: 1, // Max 1MB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      // Obtener URL presignada
      const { url, publicUrl } = await getPresignedUrl(
        file.name.replace(/[^a-zA-Z0-9.-]/g, "_"),
        compressedFile.type,
      );

      // Subir archivo al Bucket
      const uploadResponse = await fetch(url, {
        method: "PUT",
        body: compressedFile,
        headers: {
          "Content-Type": compressedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Error al subir la imagen a R2");
      }

      // Éxito: pasar la URL pública al formulario
      onChange(publicUrl);
      toast.success("Imagen subida correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAndUploadFile(e.dataTransfer.files[0]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processAndUploadFile(e.target.files[0]);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!value) return;

    try {
      setIsUploading(true);
      await deleteFromR2(value);
      onChange(null);
      toast.success("Imagen eliminada");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar la imagen de R2");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {value ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
          <Image
            src={value}
            alt="Uploaded image"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={handleRemove}
              disabled={isUploading}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors flex items-center justify-center"
              type="button"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <X className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "relative w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-colors bg-gray-50 hover:bg-gray-100 cursor-pointer",
            isDragging ? "border-green-500 bg-green-50/50" : "border-gray-300",
            isUploading ? "pointer-events-none opacity-60" : "",
          )}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <div className="flex flex-col items-center gap-2 text-gray-500 text-center">
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                <p className="text-sm font-medium">Subiendo imagen...</p>
              </>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-gray-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Haz clic o arrastra una imagen aquí
                  </p>
                  <p className="text-xs mt-1">
                    SVG, PNG, JPG or GIF (max. 5MB)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
