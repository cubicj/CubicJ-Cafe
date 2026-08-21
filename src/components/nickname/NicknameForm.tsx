'use client';

import { Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { NicknameFormState } from '@/hooks/useNicknameForm';

interface NicknameFormProps {
  form: NicknameFormState;
  label: string;
  submitLabel: string;
  submittingLabel: string;
  cancel?: {
    label: string;
    onClick: () => void;
  };
}

export function NicknameForm({
  form,
  label,
  submitLabel,
  submittingLabel,
  cancel,
}: NicknameFormProps) {
  const {
    nickname,
    isChecking,
    isSubmitting,
    isAvailable,
    isCurrentNickname,
    error,
    handleNicknameChange,
    handleSubmit,
    isSubmitDisabled,
  } = form;

  const submitButton = (
    <Button
      type="submit"
      size={cancel ? 'lg' : undefined}
      className={cancel ? 'flex-1' : 'w-full'}
      disabled={isSubmitDisabled}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {submittingLabel}
        </>
      ) : (
        submitLabel
      )}
    </Button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nickname">{label}</Label>
        <div className="relative">
          <Input
            id="nickname"
            type="text"
            placeholder="2-20자 사이의 닉네임"
            value={nickname}
            onChange={(event) => handleNicknameChange(event.target.value)}
            className="pr-10"
            maxLength={20}
            autoComplete="off"
            required
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : nickname.length >= 2 ? (
              isAvailable === true ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : isAvailable === false ? (
                <X className="h-4 w-4 text-red-500" />
              ) : null
            ) : null}
          </div>
        </div>

        <p
          className={`text-sm transition-colors duration-200 min-h-[20px] ${
            nickname.length < 2
              ? 'text-muted-foreground'
              : isChecking
                ? 'text-muted-foreground'
                : isCurrentNickname
                  ? 'text-primary'
                  : isAvailable === true
                    ? 'text-green-600'
                    : isAvailable === false
                      ? 'text-destructive'
                      : 'text-muted-foreground'
          }`}
        >
          {nickname.length < 2
            ? '2자 이상 입력해주세요'
            : isChecking
              ? '확인 중...'
              : isCurrentNickname
                ? '현재 닉네임과 동일합니다'
                : isAvailable === true
                  ? '사용 가능한 닉네임입니다'
                  : isAvailable === false
                    ? '이미 사용 중인 닉네임입니다'
                    : '닉네임을 입력해주세요'}
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <p className="text-xs text-muted-foreground">
          한글, 영문, 숫자, _, -, 공백만 사용 가능합니다.
        </p>
      </div>

      {cancel ? (
        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={cancel.onClick}
          >
            {cancel.label}
          </Button>
          {submitButton}
        </div>
      ) : (
        submitButton
      )}
    </form>
  );
}
