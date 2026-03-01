import {setGlobalOptions} from "firebase-functions";
import {onDocumentCreated, onDocumentDeleted} from "firebase-functions/v2/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {parseForestP5Pdf, type ParsedGrowthRow} from "./importParser";

setGlobalOptions({ maxInstances: 10 });
initializeApp();

const db = getFirestore();
const googleGenAiApiKey = defineSecret("GOOGLE_GENAI_API_KEY");

type ExtensionUserDocument = {
	uid?: string;
	email?: string;
	displayName?: string;
	creationTime?: string;
};

type ProfileRole = "pending" | "admin";

type DryRunPdfImportInput = {
	fileName?: string;
	fileBase64?: string;
	sourcePlotCode?: string;
};

type ImportJobIssue = {
	code: string;
	message: string;
	severity: "error" | "warning";
	row_index?: number;
	field?: string;
};

type ImportJobSummary = {
	total_rows: number;
	valid_rows: number;
	invalid_rows: number;
	plots_resolved: number;
	trees_resolved: number;
	species_resolved: number;
};

type CommitImportJobInput = {
	jobId?: string;
};

type ImportJobStatus = "queued" | "dry_run_completed" | "validated" | "committed" | "failed";

type ImportJobDocument = {
	source_file_name?: string;
	source_plot_code?: string;
	mode?: "dry_run" | "commit";
	parser_version?: string;
	status?: ImportJobStatus;
	summary?: ImportJobSummary;
	issues?: ImportJobIssue[];
	created_by?: string;
	created_at?: string;
	updated_at?: string;
	committed_at?: string;
	survey_date?: string;
	parsed_rows?: ParsedGrowthRow[];
	commit_result?: {
		committed_rows: number;
		created_trees: number;
		updated_trees: number;
		upserted_growth_logs: number;
		upserted_growth_dbh: number;
	};
};

type SpeciesLike = {
	id: string;
	species_code?: string;
	name_th?: string;
};

type TreeLike = {
	id: string;
	tree_number?: number;
	tree_code?: string;
};

function getDefaultFullname(userId: string, userData?: ExtensionUserDocument): string {
	const displayName = userData?.displayName?.trim();
	if (displayName) {
		return displayName;
	}

	const email = userData?.email?.trim();
	if (email) {
		return email.split("@")[0];
	}

	return userId;
}

function buildProfileDocument(
	userId: string,
	userData: ExtensionUserDocument | undefined,
	role: ProfileRole,
	approved: boolean,
): Record<string, unknown> {
	return {
		id: userId,
		email: userData?.email ?? "",
		fullname: getDefaultFullname(userId, userData),
		position: "-",
		organization: "-",
		role,
		approved,
		created_at: userData?.creationTime ?? new Date().toISOString(),
	};
}

async function assertAdmin(uid: string | undefined): Promise<void> {
	if (!uid) {
		throw new HttpsError("unauthenticated", "Authentication required");
	}

	const profileSnapshot = await db.collection("profiles").doc(uid).get();
	if (!profileSnapshot.exists) {
		throw new HttpsError("permission-denied", "Profile not found");
	}

	const profile = profileSnapshot.data() as {
		approved?: boolean;
		role?: string;
	};

	if (!profile.approved || profile.role !== "admin") {
		throw new HttpsError("permission-denied", "Admin access required");
	}
}

function normalizePlotCode(plotCode?: string): string {
	if (!plotCode) {
		return "UNKNOWN";
	}

	return plotCode.trim().toUpperCase();
}

function decodeBase64Payload(fileBase64: string): Buffer {
	try {
		return Buffer.from(fileBase64, "base64");
	} catch {
		throw new HttpsError("invalid-argument", "Invalid fileBase64 payload");
	}
}

function formatIssue(issue: ImportJobIssue): ImportJobIssue {
	return {
		code: issue.code,
		message: issue.message,
		severity: issue.severity,
		row_index: issue.row_index,
		field: issue.field,
	};
}

function createBaseIssues(fileBytes: Buffer): ImportJobIssue[] {
	const issues: ImportJobIssue[] = [];

	if (fileBytes.length === 0) {
		issues.push({
			code: "EMPTY_FILE",
			message: "Uploaded file is empty",
			severity: "error",
		});
	}

	const header = fileBytes.subarray(0, 5).toString("utf8");
	if (header !== "%PDF-") {
		issues.push({
			code: "INVALID_PDF_HEADER",
			message: "File does not appear to be a valid PDF",
			severity: "error",
		});
	}

	return issues;
}

function normalizeSpeciesToken(value: string | undefined): string {
	return (value ?? "").trim().toLowerCase();
}

function buildTreeCode(plotCode: string, treeNumber: number): string {
	return `${plotCode}-${String(treeNumber).padStart(3, "0")}`;
}

function buildGrowthImportKey(jobId: string, treeNumber: number, surveyDate: string): string {
	return `${jobId}:${treeNumber}:${surveyDate}`;
}

function parseSurveyDateOrThrow(value: string | undefined): string {
	if (!value) {
		throw new HttpsError("failed-precondition", "survey_date is missing in import job");
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		throw new HttpsError("failed-precondition", "survey_date in import job is invalid");
	}

	return parsed.toISOString().slice(0, 10);
}

function validateParsedRows(rows: ParsedGrowthRow[]): ImportJobIssue[] {
	const issues: ImportJobIssue[] = [];

	rows.forEach((row, index) => {
		if (!Number.isFinite(row.tree_number) || row.tree_number <= 0) {
			issues.push({
				code: "INVALID_TREE_NUMBER",
				message: "tree_number must be greater than 0",
				severity: "error",
				row_index: index,
				field: "tree_number",
			});
		}

		if (!Number.isFinite(row.height_m) || row.height_m < 0) {
			issues.push({
				code: "INVALID_HEIGHT",
				message: "height_m must be zero or positive",
				severity: "error",
				row_index: index,
				field: "height_m",
			});
		}

		if (!Number.isFinite(row.dbh_cm) || row.dbh_cm < 0) {
			issues.push({
				code: "INVALID_DBH",
				message: "dbh_cm must be zero or positive",
				severity: "error",
				row_index: index,
				field: "dbh_cm",
			});
		}

		const hasSpeciesCode = Boolean(row.species_code?.trim());
		const hasSpeciesName = Boolean(row.species_name_th?.trim());
		if (!hasSpeciesCode && !hasSpeciesName) {
			issues.push({
				code: "MISSING_SPECIES",
				message: "species_code or species_name_th is required",
				severity: "error",
				row_index: index,
				field: "species",
			});
		}
	});

	return issues;
}

async function resolvePlotByCode(plotCode: string) {
	const plotSnapshot = await db.collection("plots")
		.where("plot_code", "==", plotCode)
		.limit(1)
		.get();

	if (plotSnapshot.empty) {
		return null;
	}

	return {
		id: plotSnapshot.docs[0].id,
		...plotSnapshot.docs[0].data(),
	};
}

async function loadSpeciesLookup() {
	const speciesSnapshot = await db.collection("species").get();
	const speciesByCode = new Map<string, SpeciesLike>();
	const speciesByThaiName = new Map<string, SpeciesLike>();

	speciesSnapshot.docs.forEach((speciesDoc) => {
		const speciesData = {
			...(speciesDoc.data() as SpeciesLike),
			id: speciesDoc.id,
		};

		const codeKey = normalizeSpeciesToken(speciesData.species_code);
		if (codeKey) {
			speciesByCode.set(codeKey, speciesData);
		}

		const thKey = normalizeSpeciesToken(speciesData.name_th);
		if (thKey) {
			speciesByThaiName.set(thKey, speciesData);
		}
	});

	return {
		speciesByCode,
		speciesByThaiName,
	};
}

function resolveSpeciesForRow(
	row: ParsedGrowthRow,
	speciesByCode: Map<string, SpeciesLike>,
	speciesByThaiName: Map<string, SpeciesLike>,
) {
	const codeKey = normalizeSpeciesToken(row.species_code);
	if (codeKey && speciesByCode.has(codeKey)) {
		return speciesByCode.get(codeKey) as SpeciesLike;
	}

	const nameKey = normalizeSpeciesToken(row.species_name_th);
	if (nameKey && speciesByThaiName.has(nameKey)) {
		return speciesByThaiName.get(nameKey) as SpeciesLike;
	}

	return null;
}

export const dryRunPdfImport = onCall({secrets: [googleGenAiApiKey]}, async (request) => {
	await assertAdmin(request.auth?.uid);

	const data = request.data as DryRunPdfImportInput;
	const fileName = data.fileName?.trim();
	const fileBase64 = data.fileBase64?.trim();

	if (!fileName) {
		throw new HttpsError("invalid-argument", "fileName is required");
	}

	if (!fileBase64) {
		throw new HttpsError("invalid-argument", "fileBase64 is required");
	}

	if (!fileName.toLowerCase().endsWith(".pdf")) {
		throw new HttpsError("invalid-argument", "Only .pdf files are supported");
	}

	const fileBytes = decodeBase64Payload(fileBase64);
	if (fileBytes.byteLength > 10 * 1024 * 1024) {
		throw new HttpsError("invalid-argument", "PDF is too large (max 10MB)");
	}

	const issues = createBaseIssues(fileBytes);
	const parsed = await parseForestP5Pdf({
		fileBase64,
		fileBytes,
		sourcePlotCode: normalizePlotCode(data.sourcePlotCode),
		apiKey: googleGenAiApiKey.value(),
	});

	issues.push(...parsed.issues.map(formatIssue));
	issues.push(...validateParsedRows(parsed.rows));

	const effectivePlotCode = normalizePlotCode(parsed.plotCode ?? data.sourcePlotCode);
	let plotsResolved = 0;
	let treesResolved = 0;
	let speciesResolved = 0;

	const plot = await resolvePlotByCode(effectivePlotCode);
	if (plot) {
		plotsResolved = 1;
	}

	const {speciesByCode, speciesByThaiName} = await loadSpeciesLookup();
	const existingTreesByNumber = new Map<number, TreeLike>();

	if (plot?.id) {
		const existingTreeSnapshot = await db.collection("trees")
			.where("plot_id", "==", plot.id)
			.get();

		existingTreeSnapshot.docs.forEach((treeDoc) => {
			const tree = {...(treeDoc.data() as TreeLike), id: treeDoc.id};
			if (typeof tree.tree_number === "number") {
				existingTreesByNumber.set(tree.tree_number, tree);
			}
		});
	}

	parsed.rows.forEach((row, index) => {
		const species = resolveSpeciesForRow(row, speciesByCode, speciesByThaiName);
		if (species) {
			speciesResolved += 1;
		} else {
			issues.push({
				code: "UNRESOLVED_SPECIES",
				message: "Cannot match species from row",
				severity: "error",
				row_index: index,
				field: "species",
			});
		}

		if (existingTreesByNumber.has(row.tree_number)) {
			treesResolved += 1;
		}
	});

	const invalidIndexes = new Set<number>();
	issues.forEach((issue) => {
		if (issue.severity === "error" && typeof issue.row_index === "number") {
			invalidIndexes.add(issue.row_index);
		}
	});

	const summary: ImportJobSummary = {
		total_rows: parsed.rows.length,
		valid_rows: parsed.rows.length - invalidIndexes.size,
		invalid_rows: invalidIndexes.size,
		plots_resolved: plotsResolved,
		trees_resolved: treesResolved,
		species_resolved: speciesResolved,
	};

	const now = new Date().toISOString();
	const status: ImportJobStatus = issues.some((issue) => issue.severity === "error") ? "failed" : "dry_run_completed";

	const jobPayload: ImportJobDocument = {
		source_file_name: fileName,
		source_plot_code: effectivePlotCode,
		mode: "dry_run",
		parser_version: parsed.parserVersion,
		status,
		summary,
		issues,
		survey_date: parsed.surveyDate,
		parsed_rows: parsed.rows,
		created_by: request.auth?.uid,
		created_at: now,
		updated_at: now,
	};

	const createdJobRef = await db.collection("import_jobs").add(jobPayload);

	logger.info("Dry run import job created", {
		jobId: createdJobRef.id,
		status,
		sourceFileName: fileName,
	});

	return {
		jobId: createdJobRef.id,
		status,
		summary,
		issues,
	};
});

export const commitImportJob = onCall(async (request) => {
	await assertAdmin(request.auth?.uid);

	const data = request.data as CommitImportJobInput;
	const jobId = data.jobId?.trim();

	if (!jobId) {
		throw new HttpsError("invalid-argument", "jobId is required");
	}

	const jobRef = db.collection("import_jobs").doc(jobId);
	const jobSnapshot = await jobRef.get();

	if (!jobSnapshot.exists) {
		throw new HttpsError("not-found", "Import job not found");
	}

	const jobData = jobSnapshot.data() as ImportJobDocument;
	const parsedRows = Array.isArray(jobData.parsed_rows) ? jobData.parsed_rows : [];
	if (parsedRows.length === 0) {
		throw new HttpsError("failed-precondition", "Import job has no parsed rows");
	}

	const surveyDate = parseSurveyDateOrThrow(jobData.survey_date);
	const plotCode = normalizePlotCode(jobData.source_plot_code);
	const plot = await resolvePlotByCode(plotCode);

	if (!plot?.id) {
		throw new HttpsError("failed-precondition", `Plot ${plotCode} not found`);
	}

	const {speciesByCode, speciesByThaiName} = await loadSpeciesLookup();
	const treeSnapshot = await db.collection("trees")
		.where("plot_id", "==", plot.id)
		.get();

	const treeByNumber = new Map<number, TreeLike>();
	treeSnapshot.docs.forEach((treeDoc) => {
		const tree = {...(treeDoc.data() as TreeLike), id: treeDoc.id};
		if (typeof tree.tree_number === "number") {
			treeByNumber.set(tree.tree_number, tree);
		}
	});

	const commitIssues: ImportJobIssue[] = [];
	let committedRows = 0;
	let createdTrees = 0;
	let updatedTrees = 0;
	let upsertedGrowthLogs = 0;
	let upsertedGrowthDbh = 0;

	for (let index = 0; index < parsedRows.length; index += 1) {
		const row = parsedRows[index];
		const species = resolveSpeciesForRow(row, speciesByCode, speciesByThaiName);
		if (!species) {
			commitIssues.push({
				code: "UNRESOLVED_SPECIES",
				message: "Skip row because species cannot be resolved",
				severity: "error",
				row_index: index,
				field: "species",
			});
			continue;
		}

		if (!Number.isFinite(row.tree_number) || row.tree_number <= 0) {
			commitIssues.push({
				code: "INVALID_TREE_NUMBER",
				message: "Skip row because tree_number is invalid",
				severity: "error",
				row_index: index,
				field: "tree_number",
			});
			continue;
		}

		let tree = treeByNumber.get(row.tree_number);
		if (!tree) {
			const createdTreeRef = await db.collection("trees").add({
				tree_code: buildTreeCode(plotCode, row.tree_number),
				plot_id: plot.id,
				species_id: species.id,
				tree_number: row.tree_number,
				tag_label: "",
				row_main: Number.isFinite(row.row_main) ? row.row_main : row.tree_number,
				row_sub: Number.isFinite(row.row_sub) ? row.row_sub : 1,
				utm_x: 0,
				utm_y: 0,
				geom: {
					type: "Point",
					coordinates: [0, 0],
				},
				grid_spacing: 0,
				note: row.note ?? `Imported from ${jobData.source_file_name ?? "PDF"}`,
				created_at: new Date().toISOString(),
			});

			tree = {
				id: createdTreeRef.id,
				tree_number: row.tree_number,
				tree_code: buildTreeCode(plotCode, row.tree_number),
			};
			treeByNumber.set(row.tree_number, tree);
			createdTrees += 1;
		} else {
			await db.collection("trees").doc(tree.id).update({
				species_id: species.id,
				row_main: Number.isFinite(row.row_main) ? row.row_main : row.tree_number,
				row_sub: Number.isFinite(row.row_sub) ? row.row_sub : 1,
				note: row.note ?? `Imported from ${jobData.source_file_name ?? "PDF"}`,
			});
			updatedTrees += 1;
		}

		const importKey = buildGrowthImportKey(jobId, row.tree_number, surveyDate);
		const growthLogSnapshot = await db.collection("growth_logs")
			.where("import_key", "==", importKey)
			.limit(1)
			.get();

		const growthPayload = {
			tree_id: tree.id,
			survey_date: surveyDate,
			recorder_id: request.auth?.uid,
			height_m: row.height_m,
			status: row.status ?? "alive",
			flowering: false,
			note: row.note ?? `Imported from ${jobData.source_file_name ?? "PDF"}`,
			synced_from: "pdf_import",
			import_key: importKey,
			created_at: new Date().toISOString(),
		};

		let growthLogId = "";
		if (growthLogSnapshot.empty) {
			const createdGrowthRef = await db.collection("growth_logs").add(growthPayload);
			growthLogId = createdGrowthRef.id;
		} else {
			growthLogId = growthLogSnapshot.docs[0].id;
			await db.collection("growth_logs").doc(growthLogId).update(growthPayload);
		}
		upsertedGrowthLogs += 1;

		const dbhSnapshot = await db.collection("growth_dbh")
			.where("growth_log_id", "==", growthLogId)
			.limit(1)
			.get();

		const dbhPayload = {
			growth_log_id: growthLogId,
			dbh_cm: row.dbh_cm,
		};

		if (dbhSnapshot.empty) {
			await db.collection("growth_dbh").add(dbhPayload);
		} else {
			await db.collection("growth_dbh").doc(dbhSnapshot.docs[0].id).update(dbhPayload);
		}
		upsertedGrowthDbh += 1;
		committedRows += 1;
	}

	await db.collection("plots").doc(plot.id).update({
		tree_count: treeByNumber.size,
		alive_count: treeByNumber.size,
		latest_survey_date: surveyDate,
	});

	const now = new Date().toISOString();
	const nextStatus: ImportJobStatus = commitIssues.some((issue) => issue.severity === "error") ? "validated" : "committed";

	await jobRef.update({
		status: nextStatus,
		mode: "commit",
		updated_at: now,
		committed_at: now,
		issues: [...(Array.isArray(jobData.issues) ? jobData.issues : []), ...commitIssues],
		commit_result: {
			committed_rows: committedRows,
			created_trees: createdTrees,
			updated_trees: updatedTrees,
			upserted_growth_logs: upsertedGrowthLogs,
			upserted_growth_dbh: upsertedGrowthDbh,
		},
	});

	return {
		jobId,
		accepted: true,
		status: nextStatus,
		committedRows,
		createdTrees,
		updatedTrees,
		upsertedGrowthLogs,
		upsertedGrowthDbh,
		issueCount: commitIssues.length,
	};
});

export const syncProfileFromExtensionUser = onDocumentCreated(
	"users/{userId}",
	async (event) => {
		const userId = event.params.userId;
		const userData = event.data?.data() as ExtensionUserDocument | undefined;
		const profileRef = db.collection("profiles").doc(userId);

		await db.runTransaction(async (transaction) => {
			const profileSnapshot = await transaction.get(profileRef);
			if (profileSnapshot.exists) {
				return;
			}

			const firstProfileQuery = db.collection("profiles").limit(1);
			const firstProfileSnapshot = await transaction.get(firstProfileQuery);
			const isFirstUser = firstProfileSnapshot.empty;
			const role: ProfileRole = isFirstUser ? "admin" : "pending";
			const approved = isFirstUser;

			transaction.set(
				profileRef,
				buildProfileDocument(userId, userData, role, approved),
			);
		});

		logger.info("Synced profile from extension user document", {
			userId,
			sourceCollection: "users",
			targetCollection: "profiles",
		});
	},
);

export const deleteProfileForRemovedExtensionUser = onDocumentDeleted(
	"users/{userId}",
	async (event) => {
		const userId = event.params.userId;
		const profileRef = db.collection("profiles").doc(userId);
		const profileSnapshot = await profileRef.get();

		if (!profileSnapshot.exists) {
			return;
		}

		await profileRef.delete();

		logger.info("Deleted profile after extension user removal", {
			userId,
			sourceCollection: "users",
			targetCollection: "profiles",
		});
	},
);
