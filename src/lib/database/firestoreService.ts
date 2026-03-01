import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
  type WithFieldValue,
} from 'firebase/firestore'
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage'
import { db, storage } from '../firebase'
import type {
  GrowthBanana,
  GrowthBamboo,
  GrowthDbh,
  GrowthLog,
  Plot,
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

export async function addPlot(payload: WithoutId<Plot>): Promise<Plot> {
  const documentRef = await addDoc(
    collection(db, COLLECTION_NAMES.plots),
    payload as WithFieldValue<WithoutId<Plot>>
  )
  return {
    id: documentRef.id,
    ...payload,
  }
}

export async function updatePlot(
  plotId: string,
  payload: Partial<WithoutId<Plot>>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION_NAMES.plots, plotId), payload)
}

export async function deletePlot(plotId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAMES.plots, plotId))
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
  const documentRef = await addDoc(
    collection(db, COLLECTION_NAMES.trees),
    payload as WithFieldValue<WithoutId<Tree>>
  )
  return {
    id: documentRef.id,
    ...payload,
  }
}

export async function updateTree(
  treeId: string,
  payload: Partial<WithoutId<Tree>>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION_NAMES.trees, treeId), payload)
}

export async function deleteTree(treeId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAMES.trees, treeId))
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
  const documentRef = await addDoc(
    collection(db, COLLECTION_NAMES.species),
    payload as WithFieldValue<WithoutId<Species>>
  )
  return {
    id: documentRef.id,
    ...payload,
  }
}

export async function updateSpecies(
  speciesId: string,
  payload: Partial<WithoutId<Species>>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION_NAMES.species, speciesId), payload)
}

export async function deleteSpecies(speciesId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAMES.species, speciesId))
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
  const documentRef = await addDoc(
    collection(db, COLLECTION_NAMES.growthLogs),
    payload as WithFieldValue<WithoutId<GrowthLog>>
  )
  return {
    id: documentRef.id,
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
  const createdLog = await addGrowthLog(input.log)

  if (input.child.plantCategory === 'forest' || input.child.plantCategory === 'rubber' || input.child.plantCategory === 'fruit') {
    await addDoc(collection(db, COLLECTION_NAMES.growthDbh), {
      growth_log_id: createdLog.id,
      dbh_cm: input.child.dbh_cm,
    } as WithFieldValue<Omit<GrowthDbh, 'id'>>)
  }

  if (input.child.plantCategory === 'bamboo') {
    await addDoc(collection(db, COLLECTION_NAMES.growthBamboo), {
      growth_log_id: createdLog.id,
      culm_count: input.child.culm_count,
      dbh_1_cm: input.child.dbh_1_cm,
      dbh_2_cm: input.child.dbh_2_cm,
      dbh_3_cm: input.child.dbh_3_cm,
    } as WithFieldValue<Omit<GrowthBamboo, 'id'>>)
  }

  if (input.child.plantCategory === 'banana') {
    await addDoc(collection(db, COLLECTION_NAMES.growthBanana), {
      growth_log_id: createdLog.id,
      total_plants: input.child.total_plants,
      plants_1yr: input.child.plants_1yr,
      yield_bunches: input.child.yield_bunches,
      yield_hands: input.child.yield_hands,
      price_per_hand: input.child.price_per_hand,
    } as WithFieldValue<Omit<GrowthBanana, 'id'>>)
  }

  return createdLog
}

export async function getGrowthDbhByTreeId(treeId: string): Promise<GrowthDbh[]> {
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
  await updateDoc(doc(db, COLLECTION_NAMES.growthLogs, growthLogId), payload)
}

export async function deleteGrowthLog(growthLogId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAMES.growthLogs, growthLogId))
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
  await updateDoc(doc(db, COLLECTION_NAMES.profiles, profileId), {
    role,
    approved,
  })
}
