import { GenerationJob } from '@/types';

class GenerationStore {
  private jobs = new Map<string, GenerationJob>();

  saveJob(job: GenerationJob): void {
    this.jobs.set(job.promptId || job.id, job);
  }

  getJobByPromptId(promptId: string): GenerationJob | undefined {
    return this.jobs.get(promptId);
  }

  getJobById(jobId: string): GenerationJob | undefined {
    return this.jobs.get(jobId);
  }

  getJob(idOrPromptId: string): GenerationJob | undefined {
    // jobId로 먼저 찾기
    for (const job of this.jobs.values()) {
      if (job.id === idOrPromptId) {
        return job;
      }
    }
    // promptId로 찾기
    return this.jobs.get(idOrPromptId);
  }

  updateJob(promptId: string, updates: Partial<GenerationJob>): void {
    const job = this.jobs.get(promptId);
    if (job) {
      const updatedJob = { ...job, ...updates, updatedAt: new Date() };
      this.jobs.set(promptId, updatedJob);
    }
  }

  getAllJobs(): GenerationJob[] {
    return Array.from(this.jobs.values());
  }

  deleteJob(promptId: string): void {
    this.jobs.delete(promptId);
  }
}

export const generationStore = new GenerationStore();