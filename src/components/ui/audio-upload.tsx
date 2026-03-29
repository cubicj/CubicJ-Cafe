'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from './card';
import { Button } from './button';
import { X, Upload, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile?: File | null;
  className?: string;
  maxSize?: number;
}

export function AudioUpload({
  onFileSelect,
  selectedFile: externalSelectedFile,
  className,
  maxSize = 20 * 1024 * 1024,
}: AudioUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(
    externalSelectedFile ?? null
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (externalSelectedFile === null) {
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } else if (externalSelectedFile && externalSelectedFile !== selectedFile) {
      setSelectedFile(externalSelectedFile);
      const url = URL.createObjectURL(externalSelectedFile);
      setPreviewUrl(url);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync when external prop changes
  }, [externalSelectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup on unmount only
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(file);
        onFileSelect(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    },
    [onFileSelect, previewUrl]
  );

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    onFileSelect(null);
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        'audio/*': ['.wav', '.mp3', '.flac', '.ogg'],
      },
      maxSize,
      multiple: false,
    });

  const hasError = fileRejections.length > 0;

  return (
    <div className={cn('w-full', className)}>
      <Card className="p-3 sm:p-6">
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25',
            hasError ? 'border-destructive bg-destructive/5' : '',
            selectedFile ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''
          )}
        >
          <input {...getInputProps()} />

          {selectedFile ? (
            <div className="space-y-3 sm:space-y-4">
              {previewUrl && (
                <div className="mx-auto w-full max-w-sm">
                  <audio
                    controls
                    src={previewUrl}
                    className="w-full"
                    onClick={(e) => e.stopPropagation()}
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
                  onClick={e => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="shrink-0"
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
                  <Music className="w-full h-full" />
                )}
              </div>
              <div>
                <p className="text-base sm:text-lg font-medium">
                  {isDragActive ? '파일을 놓아주세요' : '오디오를 업로드하세요'}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">
                  이곳에 오디오 파일을 드래그 앤 드롭하세요
                </p>
                <p className="text-xs text-muted-foreground">
                  WAV, MP3, FLAC, OGG (최대 {maxSize / 1024 / 1024}MB)
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
