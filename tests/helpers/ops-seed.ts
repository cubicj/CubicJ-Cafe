import { prisma } from '@/lib/database/prisma'

export const OPS_SEED: Array<{ id: string; key: string; value: string }> = [
  { id: 'ops_discord_channel_cache_ms', key: 'ops.discord_channel_cache_ms', value: '300000' },
  { id: 'ops_generation_sweep_interval_ms', key: 'ops.generation_sweep_interval_ms', value: '300000' },
  { id: 'ops_generation_sweep_max_age_ms', key: 'ops.generation_sweep_max_age_ms', value: '1800000' },
  { id: 'ops_job_monitor_timeout_ms', key: 'ops.job_monitor_timeout_ms', value: '1800000' },
  { id: 'ops_queue_health_check_interval_ms', key: 'ops.queue_health_check_interval_ms', value: '60000' },
  { id: 'ops_comfyui_http_timeout_ms', key: 'ops.comfyui_http_timeout_ms', value: '30000' },
  { id: 'ops_log_file_max_bytes', key: 'ops.log_file_max_bytes', value: '20971520' },
  { id: 'ops_log_file_retention_days', key: 'ops.log_file_retention_days', value: '14' },
  { id: 'ops_ws_history_poll_interval_ms', key: 'ops.ws_history_poll_interval_ms', value: '60000' },
]

export async function seedOps(): Promise<void> {
  await prisma.systemSetting.createMany({
    data: OPS_SEED.map((row) => ({
      id: row.id,
      key: row.key,
      value: row.value,
      type: 'number',
      category: 'ops',
    })),
  })
}
