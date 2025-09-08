"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "./card";
import { Button } from "./button";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile?: File | null;
  className?: string;
  maxSize?: number;
}

export function FileUpload({ onFileSelect, selectedFile: externalSelectedFile, className, maxSize = 10 * 1024 * 1024 }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (externalSelectedFile === null) {
      setSelectedFile(null);
      setPreview(null);
    }
  }, [externalSelectedFile]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setSelectedFile(file);
        onFileSelect(file);
        
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onFileSelect]
  );

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    onFileSelect(null);
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxSize,
    multiple: false,
  });

  const hasError = fileRejections.length > 0;

  return (
    <div className={cn("w-full", className)}>
      <Card className="p-3 sm:p-6">
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            hasError ? "border-destructive bg-destructive/5" : "",
            selectedFile ? "border-green-500 bg-green-50 dark:bg-green-950" : ""
          )}
        >
          <input {...getInputProps()} />
          
          {selectedFile ? (
            <div className="space-y-3 sm:space-y-4">
              {preview && (
                <div className="relative mx-auto w-24 h-24 sm:w-32 sm:h-32">
                  <Image
                    src={preview}
                    alt="미리보기"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="text-left min-w-0 flex-1 mr-2">
                  <p className="font-medium text-green-700 dark:text-green-300 text-sm sm:text-base truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground">
                {isDragActive ? (
                  <Upload className="w-full h-full" />
                ) : (
                  <ImageIcon className="w-full h-full" />
                )}
              </div>
              <div>
                <p className="text-base sm:text-lg font-medium">
                  {isDragActive ? "파일을 놓아주세요" : "이미지를 업로드하세요"}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">
                  이곳에 이미지 파일을 드래그 앤 드롭하세요
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF, WebP (최대 {maxSize / 1024 / 1024}MB)
                </p>
              </div>
            </div>
          )}
        </div>
        
        {hasError && (
          <div className="mt-2 text-sm text-destructive">
            {fileRejections[0]?.errors[0]?.message}
          </div>
        )}
      </Card>
    </div>
  );
}