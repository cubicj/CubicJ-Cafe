import { cleanTables } from '@tests/helpers/db'
import { createUser } from '@tests/helpers/fixtures'
import { prisma } from '@/lib/database/prisma'
import { QueueService } from '@/lib/database/queue'
import { ReferenceKind, GenerationMode, QueueStatus } from '@/generated/prisma/enums'

beforeEach(async () => {
  await cleanTables()
})

describe('QueueService reference files', () => {
  async function createRef2vaRequest(userKey?: string) {
    const user = await createUser(userKey ? {
      discordId: `ref-user-${userKey}`,
      discordUsername: `ref_user_${userKey}`,
      nickname: `RefUser${userKey}`,
    } : undefined)
    const requestId = await QueueService.createRequest({
      userId: user.id,
      nickname: user.nickname!,
      prompt: 'ref prompt',
      videoModel: 'h3-ref2va',
      generationMode: GenerationMode.REFERENCE,
      videoDuration: 7,
      resolutionMode: 'custom',
      aspectWidth: 16,
      aspectHeight: 9,
      referenceFiles: [
        { kind: ReferenceKind.IMAGE, slot: 0, filename: 'ref_img_0.png', blob: new Uint8Array([1, 2]) },
        { kind: ReferenceKind.VIDEO, slot: 0, filename: 'ref_vid_0.mp4', blob: new Uint8Array([3, 4]), includeSoundtrack: true },
        { kind: ReferenceKind.AUDIO, slot: 0, filename: 'ref_aud_0.wav', blob: new Uint8Array([5, 6]), audioPresetName: 'Test Preset' },
      ],
    })
    return { user, requestId }
  }

  it('persists reference rows with kinds, slots, and flags', async () => {
    const { requestId } = await createRef2vaRequest()
    const rows = await QueueService.getReferenceFiles(requestId)
    expect(rows).toHaveLength(3)
    expect(rows.map((row) => row.kind)).toEqual([ReferenceKind.IMAGE, ReferenceKind.VIDEO, ReferenceKind.AUDIO])
    expect(rows[1]!.includeSoundtrack).toBe(true)
    expect(rows[2]!.audioPresetName).toBe('Test Preset')
    expect(rows[0]!.blob).not.toBeNull()

    const request = await QueueService.getRequestById(requestId)
    expect(request!.generationMode).toBe(GenerationMode.REFERENCE)
    expect(request!.resolutionMode).toBe('custom')
    expect(request!.aspectWidth).toBe(16)
    expect(request!.aspectHeight).toBe(9)
    expect(request!.referenceFiles.map((file) => file.kind)).toEqual([
      ReferenceKind.IMAGE,
      ReferenceKind.VIDEO,
      ReferenceKind.AUDIO,
    ])
    expect(request!.referenceFiles.every((file) => Object.keys(file).length === 1)).toBe(true)
  })

  it('orders reference rows by kind then slot', async () => {
    const user = await createUser()
    const requestId = await QueueService.createRequest({
      userId: user.id,
      nickname: user.nickname!,
      prompt: 'ref prompt',
      videoModel: 'h3-ref2va',
      generationMode: GenerationMode.REFERENCE,
      resolutionMode: 'first_image',
      referenceFiles: [
        { kind: ReferenceKind.IMAGE, slot: 1, filename: 'b.png', blob: new Uint8Array([2]) },
        { kind: ReferenceKind.IMAGE, slot: 0, filename: 'a.png', blob: new Uint8Array([1]) },
      ],
    })
    const rows = await QueueService.getReferenceFiles(requestId)
    expect(rows.map((row) => row.filename)).toEqual(['a.png', 'b.png'])
  })

  it('loads reference metadata without blobs and fetches each blob by row id', async () => {
    const { requestId } = await createRef2vaRequest()
    const rows = await QueueService.getReferenceFileRows(requestId)

    expect(rows).toHaveLength(3)
    expect(rows.every((row) => !Object.hasOwn(row, 'blob'))).toBe(true)
    await expect(QueueService.getReferenceFileBlob(rows[0]!.id)).resolves.toEqual(new Uint8Array([1, 2]))
    await expect(QueueService.getReferenceFileBlob(rows[1]!.id)).resolves.toEqual(new Uint8Array([3, 4]))
  })

  it('does not mark a cancelled request as failed', async () => {
    const { user, requestId } = await createRef2vaRequest()
    await QueueService.updateRequest(requestId, { status: QueueStatus.PROCESSING })
    await QueueService.cancelRequest(requestId, user.id)

    const updatedCount = await QueueService.markRequestFailedIfProcessing(requestId, {
      failedAt: new Date(),
      error: 'fake processing error',
    })

    expect(updatedCount).toBe(0)
    expect(await QueueService.getRequestStatus(requestId)).toBe(QueueStatus.CANCELLED)
  })

  it('clearImageBlobs nulls reference blobs but keeps rows', async () => {
    const { requestId } = await createRef2vaRequest()
    await QueueService.clearImageBlobs(requestId)
    const rows = await QueueService.getReferenceFiles(requestId)
    expect(rows).toHaveLength(3)
    expect(rows.every((row) => row.blob === null)).toBe(true)
  })

  it('cancelRequest nulls reference blobs', async () => {
    const { user, requestId } = await createRef2vaRequest()
    await QueueService.cancelRequest(requestId, user.id)
    const rows = await QueueService.getReferenceFiles(requestId)
    expect(rows.every((row) => row.blob === null)).toBe(true)
  })

  it('cancelAllPending cancels and clears only pending request reference blobs', async () => {
    const { requestId: firstPendingId } = await createRef2vaRequest('PendingA')
    const { requestId: secondPendingId } = await createRef2vaRequest('PendingB')
    const { requestId: processingId } = await createRef2vaRequest('Processing')
    await QueueService.updateRequest(processingId, { status: QueueStatus.PROCESSING })

    expect(await QueueService.cancelAllPending()).toBe(2)

    const [firstPending, secondPending, processing] = await Promise.all([
      QueueService.getRequestById(firstPendingId),
      QueueService.getRequestById(secondPendingId),
      QueueService.getRequestById(processingId),
    ])
    expect(firstPending!.status).toBe(QueueStatus.CANCELLED)
    expect(secondPending!.status).toBe(QueueStatus.CANCELLED)
    expect(processing!.status).toBe(QueueStatus.PROCESSING)

    const [firstPendingRows, secondPendingRows, processingRows] = await Promise.all([
      QueueService.getReferenceFiles(firstPendingId),
      QueueService.getReferenceFiles(secondPendingId),
      QueueService.getReferenceFiles(processingId),
    ])
    expect(firstPendingRows).toHaveLength(3)
    expect(secondPendingRows).toHaveLength(3)
    expect(processingRows).toHaveLength(3)
    expect(firstPendingRows.every((row) => row.blob === null)).toBe(true)
    expect(secondPendingRows.every((row) => row.blob === null)).toBe(true)
    expect(processingRows.every((row) => row.blob !== null)).toBe(true)
  })

  it('cascades reference rows on request delete', async () => {
    const { requestId } = await createRef2vaRequest()
    await prisma.queueRequest.delete({ where: { id: requestId } })
    expect(await prisma.queueReferenceFile.count()).toBe(0)
  })
})
