"use client";

import { useEffect, useRef } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useI2VFormContext } from '@/contexts/I2VFormContext';
import { useI2VSubmission } from './useI2VSubmission';
import type { UseI2VFormReturn } from './useI2VForm.types';
import {
  useLoraPresetData,
  useLoraPresetSelection,
  usePersistedLoraPresetSelection,
} from './useLoraPresetSelection';
import { useModelCapabilities } from './useModelCapabilities';
import { useReferenceSet } from './useReferenceSet';
import { useInitialServerStatus, useServerStatus } from './useServerStatus';

export function useI2VForm(): UseI2VFormReturn {
  const {
    selectedFile, setSelectedFile,
    endImageFile, setEndImageFile,
    audioPresetId, setAudioPresetId,
    isLoopEnabled, setIsLoopEnabled,
    prompt, setPrompt,
    isNSFW, setIsNSFW,
    clearForm,
  } = useI2VFormContext();
  const {
    selectedPresetIds,
    selectedPresetIdsRef,
    setSelectedPresetIds,
    currentPresets,
    setCurrentPresets,
    presets,
    setPresets,
  } = useLoraPresetSelection();
  const { user, isLoading: isLoadingAuth } = useSession();
  const {
    serverStatus,
    setServerStatus,
    isRefreshing,
    setIsRefreshing,
    isLoadingServerStatus,
    setIsLoadingServerStatus,
    fetchServerStatus,
    handleRefreshStatus,
  } = useServerStatus({ isLoadingAuth, user });
  const {
    activeModel,
    setActiveModel,
    setFormIsNSFW,
    videoDuration,
    setVideoDuration,
    enabledModels,
    capabilities,
    capabilitiesRef,
    durationOptions,
    durationLabels,
  } = useModelCapabilities({
    isLoadingAuth,
    user,
    isNSFW,
    setIsNSFW,
    setSelectedPresetIds,
    setCurrentPresets,
  });
  const referenceSet = useReferenceSet();
  const resetReferenceSet = referenceSet.reset;
  const {
    isGenerating,
    setIsGenerating,
    hasUnavailableLoRAs,
    setHasUnavailableLoRAs,
    submitMessage,
    setSubmitMessage,
    handleSubmit,
    handleReset,
  } = useI2VSubmission({
    selectedFile,
    endImageFile,
    audioPresetId,
    isLoopEnabled,
    prompt,
    isNSFW,
    selectedPresetIds,
    currentPresets,
    activeModel,
    enabledModels,
    capabilities,
    videoDuration,
    clearForm,
    referenceSet,
  });
  const previousIsLoopEnabledRef = useRef(isLoopEnabled);

  useEffect(() => {
    resetReferenceSet();
  }, [activeModel, resetReferenceSet]);

  useEffect(() => {
    if (isLoopEnabled) {
      setEndImageFile(selectedFile);
    } else if (previousIsLoopEnabledRef.current) {
      setEndImageFile(null);
    }
    previousIsLoopEnabledRef.current = isLoopEnabled;
  }, [isLoopEnabled, selectedFile, setEndImageFile]);

  usePersistedLoraPresetSelection(selectedPresetIds);

  useInitialServerStatus({
    isLoadingAuth,
    user,
    setServerStatus,
    setIsLoadingServerStatus,
  });

  const fetchPresets = useLoraPresetData({
    activeModel,
    isLoadingAuth,
    user,
    capabilitiesRef,
    selectedPresetIdsRef,
    setPresets,
    setCurrentPresets,
  });

  const hasRequiredImages = capabilities.startImageOptional ? !!selectedFile || !!endImageFile : !!selectedFile;
  const hasRequiredInputs = capabilities.referenceInputs ? referenceSet.totalCount > 0 : hasRequiredImages;
  const isFormValid = enabledModels.includes(activeModel) && hasRequiredInputs && prompt.trim().length > 0 && (serverStatus?.summary?.totalActive || 0) > 0;

  return {
    selectedFile,
    setSelectedFile,
    endImageFile,
    setEndImageFile,
    audioPresetId,
    setAudioPresetId,
    isLoopEnabled,
    setIsLoopEnabled,
    prompt,
    setPrompt,
    selectedPresetIds,
    setSelectedPresetIds,
    currentPresets,
    setCurrentPresets,
    presets,
    setPresets,
    isGenerating,
    setIsGenerating,
    isNSFW,
    setIsNSFW: setFormIsNSFW,
    videoDuration,
    setVideoDuration,
    submitMessage,
    setSubmitMessage,
    isLoadingAuth,
    hasUnavailableLoRAs,
    setHasUnavailableLoRAs,
    serverStatus,
    setServerStatus,
    isRefreshing,
    setIsRefreshing,
    isLoadingServerStatus: user ? isLoadingServerStatus : false,
    setIsLoadingServerStatus,
    activeModel,
    setActiveModel,
    enabledModels,
    capabilities,
    durationOptions,
    durationLabels,
    referenceSet,
    isFormValid,
    handleSubmit,
    handleReset,
    handleRefreshStatus,
    fetchServerStatus,
    fetchPresets,
  };
}
