import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
  type WithFieldValue,
} from 'firebase/firestore'
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  uploadBytes,
} from 'firebase/storage'
import { executeWriteWithOfflineFallback } from '../offlineQueue'
import { auth, db, storage } from '../firebase'
import type {
  GrowthBanana,
  GrowthBamboo,
  GrowthDbh,
  GrowthLog,
  MapExperienceConfig,
  Plot,
  PlotBasemap,
  PlotBasemapBounds,
  PlotImage,
  Profile,
  Species,
  Tree,
  UserRole,
} from '../database.types'
import { COLLECTION_NAMES } from '../../utils/constants'

type WithoutId<T extends { id: string }> = Omit<T, 'id'>

function toEntity<T extends { id: string }>(
  snapshot: QueryDocumentSnapshot
): T {
  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as T
}

function createOptimisticId() {
  return `local-${crypto.randomUUID()}`
}

const MAP_EXPERIENCE_CONFIG_ID = 'default'
const MAX_BASEMAP_FILE_SIZE_BYTES = 200 * 1024 * 1024

function normalizePlotIds(plotIds: string[]) {
  return Array.from(new Set(plotIds.map((plotId) => plotId.trim()).filter(Boolean)))
}

async function assertCurrentUserIsAdmin() {
  const currentUser = auth.currentUser

  if (!currentUser) {
    throw new Error('กรุณาเข้าสู่ระบบก่อนจัดการภาพ orthophoto')
  }

  const profileRef = doc(db, COLLECTION_NAMES.profiles, currentUser.uid)
  const profileSnapshot = await getDoc(profileRef)

  if (!profileSnapshot.exists()) {
    throw new Error('ไม่พบข้อมูลผู้ใช้งาน')
  }

  const profile = {
    id: profileSnapshot.id,
    ...profileSnapshot.data(),
  } as Profile

  if (profile.role !== 'admin' || !profile.approved) {
    throw new Error('เฉพาะผู้ดูแลระบบเท่านั้นที่แก้ไข orthophoto ได้')
  }

  return {
    uid: currentUser.uid,
  }
}

function buildBasemapStoragePath(plotId: string, fileName: string) {
  const normalizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `plot-basemaps/${plotId}/${Date.now()}-${normalizedFileName}`
}

export async function getPlots(): Promise<Plot[]> {
  const snapshot = await getDocs(collection(db, COLLECTION_NAMES.plots))
  return snapshot.docs.map((plotDoc) => toEntity<Plot>(plotDoc))
}

export async function getPlotByCode(plotCode: string): Promise<Plot | null> {
  const plotQuery = query(
    collection(db, COLLECTION_NAMES.plots),
    where('plot_code', '==', plotCode),
    limit(1)
  )
  const snapshot = await getDocs(plotQuery)
  return snapshot.empty ? null : toEntity<Plot>(snapshot.docs[0])
}

export async function getMapExperienceConfig(
  configId = MAP_EXPERIENCE_CONFIG_ID
): Promise<MapExperienceConfig | null> {
  const configSnapshot = await getDoc(doc(db, COLLECTION_NAMES.mapExperienceConfig, configId))

  if (!configSnapshot.exists()) {
    return null
  }

  return {
    id: configSnapshot.id,
    ...configSnapshot.data(),
  } as MapExperienceConfig
}

type UpsertMapExperienceConfigInput = {
  plotIds: string[]
  note?: string
  configId?: string
}

export async function upsertMapExperienceConfig(
  input: UpsertMapExperienceConfigInput
): Promise<MapExperienceConfig> {
  const { uid } = await assertCurrentUserIsAdmin()
  const configId = input.configId ?? MAP_EXPERIENCE_CONFIG_ID
  const now = new Date().toISOString()

  const payload: Omit<MapExperienceConfig, 'id'> = {
    plot_ids: normalizePlotIds(input.plotIds),
    note: input.note ?? '',
    updated_by: uid,
    updated_at: now,
  }

  await setDoc(doc(db, COLLECTION_NAMES.mapExperienceConfig, configId), payload, {
    merge: true,
  })

  return {
    id: configId,
    ...payload,
  }
}

export async function addPlot(payload: WithoutId<Plot>): Promise<Plot> {
  const writeResult = await executeWriteWithOfflineFallback({
    collection: COLLECTION_NAMES.plots,
    action: 'add',
    data: payload,
    write: () =>
      addDoc(
        collection(db, COLLECTION_NAMES.plots),
        payload as WithFieldValue<WithoutId<Plot>>
      ),
  })

  const id = writeResult.queued ? createOptimisticId() : writeResult.result.id

  return {
    id,
    ...payload,
  }
}

export async function updatePlot(
  plotId: string,
  payload: Partial<WithoutId<Plot>>
): Promise<void> {
  await executeWriteWithOfflineFallback({
    collection: COLLECTION_NAMES.plots,
    action: 'update',
    data: {
      id: plotId,
      ...payload,
    },
    write: () => updateDoc(doc(db, COLLECTION_NAMES.plots, plotId), payload),
  })
}

export async function deletePlot(plotId: string): Promise<void> {
  await executeWriteWithOfflineFallback({
    collection: COLLECTION_NAMES.plots,
    action: 'delete',
    data: { id: plotId },
    write: () => deleteDoc(doc(db, COLLECTION_NAMES.plots, plotId)),
  })
}

export async function getTrees(plotId: string): Promise<Tree[]> {
  const treeQuery = query(
    collection(db, COLLECTION_NAMES.trees),
    where('plot_id', '==', plotId)
  )
  const snapshot = await getDocs(treeQuery)
  return snapshot.docs.map((treeDoc) => toEntity<Tree>(treeDoc))
}

export async function getTreeByCode(treeCode: string): Promise<Tree | null> {
  const treeQuery = query(
    collection(db, COLLECTION_NAMES.trees),
    where('tree_code', '==', treeCode),
    limit(1)
  )
  const snapshot = await getDocs(treeQuery)
  return snapshot.empty ? null : toEntity<Tree>(snapshot.docs[0])
}

export async function getTreeById(treeId: string): Promise<Tree | null> {
  const snapshot = await getDoc(doc(db, COLLECTION_NAMES.trees, treeId))

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Tree
}

export async function addTree(payload: WithoutId<Tree>): Promise<Tree> {
  const writeResult = await executeWriteWithOfflineFallback({
    collection: COLLECTION_NAMES.trees,
    action: 'add',
    data: payload,
    write: () =>
      addDoc(
        collection(db, COLLECTION_NAMES.trees),
        payload as WithFieldValue<WithoutId<Tree>>
      ),
  })

  const id = writeResult.queued ? createOptimisticId() : writeResult.result.id

  return {
    id,
    ...payload,
  }
}

export async function updateTree(
  treeId: string,
  payload: Partial<WithoutId<Tree>>
): Promise<void> {
  await executeWriteWithOfflineFallback({
    collection: COLLECTION_NAMES.trees,
    action: 'update',
    data: {
      id: treeId,
      ...payload,
    },
    write: () => updateDoc(doc(db, COLLECTION_NAMES.trees, treeId), payload),
  })
}

export async function deleteTree(treeId: string): Promise<void> {
  await executeWriteWithOfflineFallback({
    collection: COLLECTION_NAMES.trees,
    action: 'delete',
    data: { id: treeId },
    write: () => deleteDoc(doc(db, COLLECTION_NAMES.trees, treeId)),
  })
}

export async function getSpecies(): Promise<Species[]> {
  const snapshot = await getDocs(collection(db, COLLECTION_NAMES.species))
  return snapshot.docs.map((speciesDoc) => toEntity<Species>(speciesDoc))
}

export async function getSpeciesByCode(
  speciesCode: string
): Promise<Species | null> {
  const speciesQuery = query(
    collection(db, COLLECTION_NAMES.species),
    where('species_code', '==', speciesCode),
    limit(1)
  )
  const snapshot = await getDocs(speciesQuery)
  return snapshot.empty ? null : toEntity<Species>(snapshot.docs[0])
}

export async function addSpecies(
  payload: WithoutId<Species>
): Promise<Species> {
  const writeResult = await executeWriteWithOfflineFallback({
    collection: COLLECTION_NAMES.species,
    action: 'add',
    data: payload,
    write: () =>
      addDoc(
        collection(db, COLLECTION_NAMES.species),
        payload as WithFieldValue<WithoutId<Species>>
      ),
  })

  const id = writeResult.queued ? createOptimisticId() : writeResult.result.id

  return {
    id,
    ...payload,
  }
}

export async function updateSpecies(
  speciesId: string,
  payload: Partial<WithoutId<Species>>
): Promise<void> {
  await executeWriteWithOfflineFallback({
    collection: COLLECTION_NAMES.species,
    action: 'update',
    data: {
      id: speciesId,
      ...payload,
    },
    write: () => updateDoc(doc(db, COLLECTION_NAMES.species, speciesId), payload),
  })
}

export async function deleteSpecies(speciesId: string): Promise<void> {
  await executeWriteWithOfflineFallback({
    collection: COLLECTION_NAMES.species,
    action: 'delete',
    data: { id: speciesId },
    write: () => deleteDoc(doc(db, COLLECTION_NAMES.species, speciesId)),
  })
}

export async function getGrowthLogs(treeId: string): Promise<GrowthLog[]> {
  const growthQuery = query(
    collection(db, COLLECTION_NAMES.growthLogs),
    where('tree_id', '==', treeId)
  )
  const snapshot = await getDocs(growthQuery)
  return snapshot.docs.map((growthDoc) => toEntity<GrowthLog>(growthDoc))
}

export async function addGrowthLog(
  payload: WithoutId<GrowthLog>
): Promise<GrowthLog> {
  const writeResult = await executeWriteWithOfflineFallback({
    collection: COLLECTION_NAMES.growthLogs,
    action: 'add',
    data: payload,
    write: () =>
      addDoc(
        collection(db, COLLECTION_NAMES.growthLogs),
        payload as WithFieldValue<WithoutId<GrowthLog>>
      ),
  })

  const id = writeResult.queued ? createOptimisticId() : writeResult.result.id

  return {
    id,
    ...payload,
  }
}

type GrowthChildPayload =
  | {
      plantCategory: 'forest' | 'rubber' | 'fruit'
      dbh_cm: number
    }
  | {
      plantCategory: 'bamboo'
      culm_count: number
      dbh_1_cm: number
      dbh_2_cm: number
      dbh_3_cm: number
    }
  | {
      plantCategory: 'banana'
      total_plants: number
      plants_1yr: number
      yield_bunches: number
      yield_hands: number
      price_per_hand: number
    }

type CreateGrowthEntryInput = {
  log: WithoutId<GrowthLog>
  child: GrowthChildPayload
}

export async function createGrowthEntry(input: CreateGrowthEntryInput): Promise<GrowthLog> {
  const childCollection =
    input.child.plantCategory === 'bamboo'
      ? COLLECTION_NAMES.growthBamboo
      : input.child.plantCategory === 'banana'
        ? COLLECTION_NAMES.growthBanana
        : COLLECTION_NAMES.growthDbh

  const childData =
    input.child.plantCategory === 'bamboo'
      ? {
          culm_count: input.child.culm_count,
          dbh_1_cm: input.child.dbh_1_cm,
          dbh_2_cm: input.child.dbh_2_cm,
          dbh_3_cm: input.child.dbh_3_cm,
        }
      : input.child.plantCategory === 'banana'
        ? {
            total_plants: input.child.total_plants,
            plants_1yr: input.child.plants_1yr,
            yield_bunches: input.child.yield_bunches,
            yield_hands: input.child.yield_hands,
            price_per_hand: input.child.price_per_hand,
          }
        : {
            dbh_cm: input.child.dbh_cm,
          }

  const writeResult = await executeWriteWithOfflineFallback({
    collection: COLLECTION_NAMES.growthLogs,
    action: 'add',
    data: input.log,
    childCollection,
    childData,
    write: async () => {
      const createdLogRef = await addDoc(
        collection(db, COLLECTION_NAMES.growthLogs),
        input.log as WithFieldValue<WithoutId<GrowthLog>>
      )

      await addDoc(collection(db, childCollection), {
        growth_log_id: createdLogRef.id,
        ...childData,
      } as WithFieldValue<Omit<GrowthDbh | GrowthBamboo | GrowthBanana, 'id'>>)

      return createdLogRef
    },
  })

  const id = writeResult.queued ? createOptimisticId() : writeResult.result.id

  return {
    id,
    ...input.log,
  }
}

export async function getGrowthRcdByTreeId(treeId: string): Promise<GrowthDbh[]> {
  const logs = await getGrowthLogs(treeId)
  if (logs.length === 0) {
    return []
  }

  const nested = await Promise.all(
    logs.map(async (log) => {
      const q = query(collection(db, COLLECTION_NAMES.growthDbh), where('growth_log_id', '==', log.id), limit(1))
      const snapshot = await getDocs(q)
      return snapshot.docs.map((item) => toEntity<GrowthDbh>(item))
    })
  )

  return nested.flat()
}

export async function updateGrowthLog(
  growthLogId: string,
  payload: Partial<WithoutId<GrowthLog>>
): Promise<void> {
  await executeWriteWithOfflineFallback({
    collection: COLLECTION_NAMES.growthLogs,
    action: 'update',
    data: {
      id: growthLogId,
      ...payload,
    },
    write: () => updateDoc(doc(db, COLLECTION_NAMES.growthLogs, growthLogId), payload),
  })
}

export async function deleteGrowthLog(growthLogId: string): Promise<void> {
  await executeWriteWithOfflineFallback({
    collection: COLLECTION_NAMES.growthLogs,
    action: 'delete',
    data: { id: growthLogId },
    write: () => deleteDoc(doc(db, COLLECTION_NAMES.growthLogs, growthLogId)),
  })
}

export async function getPlotBasemap(plotId: string): Promise<PlotBasemap | null> {
  const basemapSnapshot = await getDoc(doc(db, COLLECTION_NAMES.plotBasemaps, plotId))

  if (!basemapSnapshot.exists()) {
    return null
  }

  return {
    id: basemapSnapshot.id,
    ...basemapSnapshot.data(),
  } as PlotBasemap
}

type UploadPlotBasemapInput = {
  plotId: string
  file: File
  bounds?: PlotBasemapBounds | null
  rasterCrs?: string | null
}

function validateOrthophotoFile(file: File) {
  const lowerName = file.name.toLowerCase()
  if (!lowerName.endsWith('.tif') && !lowerName.endsWith('.tiff')) {
    throw new Error('ไฟล์ orthophoto ต้องเป็น .tif หรือ .tiff')
  }

  if (file.size > MAX_BASEMAP_FILE_SIZE_BYTES) {
    throw new Error('ไฟล์ orthophoto ต้องมีขนาดไม่เกิน 200 MB')
  }
}

export async function uploadPlotBasemapTiff(input: UploadPlotBasemapInput): Promise<PlotBasemap> {
  const { uid } = await assertCurrentUserIsAdmin()
  validateOrthophotoFile(input.file)

  const existingBasemap = await getPlotBasemap(input.plotId)
  const storagePath = buildBasemapStoragePath(input.plotId, input.file.name)
  const storageRef = ref(storage, storagePath)

  await new Promise<void>((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, input.file, {
      contentType: input.file.type || 'image/tiff',
    })

    uploadTask.on(
      'state_changed',
      () => undefined,
      (error) => reject(error),
      () => resolve()
    )
  })

  const downloadUrl = await getDownloadURL(storageRef)
  const now = new Date().toISOString()

  const payload: Omit<PlotBasemap, 'id'> = {
    plot_id: input.plotId,
    storage_path: storagePath,
    download_url: downloadUrl,
    file_name: input.file.name,
    file_size_bytes: input.file.size,
    mime_type: input.file.type || 'image/tiff',
    raster_crs: input.rasterCrs ?? null,
    bounds: input.bounds ?? null,
    uploaded_by: uid,
    created_at: existingBasemap?.created_at ?? now,
    updated_at: now,
  }

  await setDoc(doc(db, COLLECTION_NAMES.plotBasemaps, input.plotId), payload)

  if (existingBasemap?.storage_path && existingBasemap.storage_path !== storagePath) {
    try {
      await deleteObject(ref(storage, existingBasemap.storage_path))
    } catch (error) {
      console.warn('Failed to delete previous orthophoto file:', error)
    }
  }

  return {
    id: input.plotId,
    ...payload,
  }
}

export async function deletePlotBasemap(plotId: string): Promise<void> {
  await assertCurrentUserIsAdmin()

  const existingBasemap = await getPlotBasemap(plotId)

  if (existingBasemap?.storage_path) {
    try {
      await deleteObject(ref(storage, existingBasemap.storage_path))
    } catch (error) {
      console.warn('Failed to delete orthophoto file from storage:', error)
    }
  }

  await deleteDoc(doc(db, COLLECTION_NAMES.plotBasemaps, plotId))
}

export async function getPlotImages(plotId: string): Promise<PlotImage[]> {
  const imageQuery = query(
    collection(db, COLLECTION_NAMES.plotImages),
    where('plot_id', '==', plotId)
  )
  const snapshot = await getDocs(imageQuery)
  return snapshot.docs.map((imageDoc) => toEntity<PlotImage>(imageDoc))
}

type UploadImageInput = {
  plotId: string
  imageType: PlotImage['image_type']
  galleryCategory: PlotImage['gallery_category']
  file: Blob | Uint8Array | ArrayBuffer
  uploadedBy: string
  description?: string
  uploadDate?: PlotImage['upload_date']
}

function buildStoragePath(plotId: string, imageType: PlotImage['image_type']) {
  return `plots/${plotId}/${imageType}-${Date.now()}`
}

export async function uploadImage(input: UploadImageInput): Promise<PlotImage> {
  const storagePath = buildStoragePath(input.plotId, input.imageType)
  const storageRef = ref(storage, storagePath)

  await uploadBytes(storageRef, input.file)
  const downloadUrl = await getDownloadURL(storageRef)

  const payload: WithoutId<PlotImage> = {
    plot_id: input.plotId,
    image_type: input.imageType,
    gallery_category: input.galleryCategory,
    legacy_url: downloadUrl,
    storage_path: storagePath,
    description: input.description ?? '',
    uploaded_by: input.uploadedBy,
    upload_date: input.uploadDate ?? new Date().toISOString(),
    created_at: new Date().toISOString(),
  }

  const documentRef = await addDoc(
    collection(db, COLLECTION_NAMES.plotImages),
    payload as WithFieldValue<WithoutId<PlotImage>>
  )

  return {
    id: documentRef.id,
    ...payload,
  }
}

export async function deleteImage(imageId: string): Promise<void> {
  const imageRef = doc(db, COLLECTION_NAMES.plotImages, imageId)
  const imageSnapshot = await getDoc(imageRef)

  if (imageSnapshot.exists()) {
    const image = {
      id: imageSnapshot.id,
      ...imageSnapshot.data(),
    } as PlotImage

    if (image.storage_path) {
      await deleteObject(ref(storage, image.storage_path))
    }
  }

  await deleteDoc(imageRef)
}

export async function getProfiles(): Promise<Profile[]> {
  const snapshot = await getDocs(collection(db, COLLECTION_NAMES.profiles))
  return snapshot.docs.map((profileDoc) => toEntity<Profile>(profileDoc))
}

export async function updateProfileRole(
  profileId: string,
  role: UserRole,
  approved: boolean
): Promise<void> {
  await executeWriteWithOfflineFallback({
    collection: COLLECTION_NAMES.profiles,
    action: 'update',
    data: {
      id: profileId,
      role,
      approved,
    },
    write: () =>
      updateDoc(doc(db, COLLECTION_NAMES.profiles, profileId), {
        role,
        approved,
      }),
  })
}
