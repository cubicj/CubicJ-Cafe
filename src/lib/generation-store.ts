import { GenerationJob } from '@/types'
import { createLogger } from '@/lib/logger'
import { getOpsSetting } from '@/lib/database/ops-settings'

const log = createLogger('store')

export class GenerationStore {
  private jobs = new Map<string, GenerationJob>()
  private sweepHandle: NodeJS.Timeout | null = null

  startSweep(): void {
    if (this.sweepHandle) return
    this.sweepHandle = setInterval(
      () => this.sweep(),
      getOpsSetting('ops.generation_sweep_interval_ms')
    )
    this.sweepHandle.unref()
  }

  sweep(): void {
    const cutoff = Date.now() - getOpsSetting('ops.generation_sweep_max_age_ms')
    let swept = 0
    for (const [key, job] of this.jobs) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.updatedAt.getTime() < cutoff
      ) {
        this.jobs.delete(key)
        swept++
      }
    }
    if (swept > 0) {
      log.info(`Swept ${swept} expired jobs from generationStore`)
    }
  }

  saveJob(job: GenerationJob): void {
    this.jobs.set(job.promptId || job.id, job)
  }

  getJobByPromptId(promptId: string): GenerationJob | undefined {
    return this.jobs.get(promptId)
  }

  getJobById(jobId: string): GenerationJob | undefined {
    return this.jobs.get(jobId)
  }

  getJob(idOrPromptId: string): GenerationJob | undefined {
    for (const job of this.jobs.values()) {
      if (job.id === idOrPromptId) {
        return job
      }
    }
    return this.jobs.get(idOrPromptId)
  }

  updateJob(promptId: string, updates: Partial<GenerationJob>): void {
    const job = this.jobs.get(promptId)
    if (job) {
      const updatedJob = { ...job, ...updates, updatedAt: new Date() }
      this.jobs.set(promptId, updatedJob)
    }
  }

  getAllJobs(): GenerationJob[] {
    return Array.from(this.jobs.values())
  }

  deleteJob(promptId: string): void {
    this.jobs.delete(promptId)
  }
}

const globalForStore = globalThis as unknown as { __generationStore?: GenerationStore }
export const generationStore =
  globalForStore.__generationStore ?? (globalForStore.__generationStore = new GenerationStore())
