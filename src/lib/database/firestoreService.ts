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
  GrowthLog,
  Plot,
  PlotImage,
  Species,
  Tree,
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
