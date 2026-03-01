import {GoogleGenAI} from "@google/genai";
import {PDFParse} from "pdf-parse";

export type ParsedGrowthRow = {
	tree_number: number;
	row_main: number;
	row_sub: number;
	species_code?: string;
	species_name_th?: string;
	height_m: number;
	dbh_cm: number;
	status?: "alive" | "dead" | "missing";
	note?: string;
};

export type ImportParserIssue = {
	code: string;
	message: string;
	severity: "error" | "warning";
	row_index?: number;
	field?: string;
};

export type ParsedPdfResult = {
	rows: ParsedGrowthRow[];
	surveyDate: string;
	plotCode?: string;
	issues: ImportParserIssue[];
	parserVersion: string;
};

type GeminiExtractResult = {
	plot_code?: string;
	survey_date?: string;
	rows?: Array<Partial<ParsedGrowthRow>>;
};

function toIsoDateOrNull(value: string | undefined): string | null {
	if (!value) {
		return null;
	}

	const input = value.trim();
	if (!input) {
		return null;
	}

	const direct = new Date(input);
	if (!Number.isNaN(direct.getTime())) {
		return direct.toISOString().slice(0, 10);
	}

	const slash = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
	if (!slash) {
		return null;
	}

	const day = Number(slash[1]);
	const month = Number(slash[2]);
	let year = Number(slash[3]);
	if (year > 2400) {
		year -= 543;
	}

	const parsed = new Date(Date.UTC(year, month - 1, day));
	if (Number.isNaN(parsed.getTime())) {
		return null;
	}

	return parsed.toISOString().slice(0, 10);
}

function parseNumeric(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}

	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.replace(/,/g, "").trim();
	if (!normalized) {
		return null;
	}

	const parsed = Number(normalized);
	return Number.isFinite(parsed) ? parsed : null;
}

function parseRowsFromText(text: string): ParsedGrowthRow[] {
	const lines = text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	const rows: ParsedGrowthRow[] = [];
	for (const line of lines) {
		const match = line.match(
			/^(\d{1,4})\s+(\d{1,3})[\./](\d{1,3})\s+(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/,
		);
		if (!match) {
			continue;
		}

		rows.push({
			tree_number: Number(match[1]),
			row_main: Number(match[2]),
			row_sub: Number(match[3]),
			species_name_th: match[4].trim(),
			height_m: Number(match[5]),
			dbh_cm: Number(match[6]),
			status: "alive",
		});
	}

	return rows;
}

async function extractTextFromPdf(fileBytes: Buffer): Promise<string> {
	const parser = new PDFParse({data: fileBytes});
	try {
		const result = await parser.getText();
		return (result.text ?? "").trim();
	} finally {
		await parser.destroy();
	}
}

async function extractWithGemini(fileBase64: string, apiKey: string | undefined): Promise<GeminiExtractResult> {
	if (!apiKey) {
		return {};
	}

	const ai = new GoogleGenAI({apiKey});
	const prompt = [
		"You are parsing a Thai forestry survey PDF for plot P5.",
		"Extract rows into strict JSON with this shape:",
		"{ plot_code?: string, survey_date?: string, rows: ParsedGrowthRow[] }",
		"ParsedGrowthRow = { tree_number:number, row_main:number, row_sub:number, species_code?:string, species_name_th?:string, height_m:number, dbh_cm:number, status?:'alive'|'dead'|'missing', note?:string }",
		"Rules:",
		"- Return ONLY JSON. No markdown.",
		"- survey_date must be a date from the document.",
		"- Convert Thai Buddhist year to Gregorian if needed.",
		"- Keep unknown values absent (do not hallucinate).",
	].join("\n");

	const response = await ai.models.generateContent({
		model: "gemini-2.0-flash",
		contents: [{
			role: "user",
			parts: [
				{text: prompt},
				{
					inlineData: {
						mimeType: "application/pdf",
						data: fileBase64,
					},
				},
			],
		}],
		config: {
			responseMimeType: "application/json",
			temperature: 0,
		},
	});

	const text = response.text ?? "";
	if (!text.trim()) {
		return {};
	}

	return JSON.parse(text) as GeminiExtractResult;
}

function normalizeGeminiRows(rawRows: Array<Partial<ParsedGrowthRow>> | undefined): ParsedGrowthRow[] {
	if (!Array.isArray(rawRows)) {
		return [];
	}

	const rows: ParsedGrowthRow[] = [];
	for (const row of rawRows) {
		const treeNumber = parseNumeric(row.tree_number);
		const rowMain = parseNumeric(row.row_main);
		const rowSub = parseNumeric(row.row_sub);
		const heightM = parseNumeric(row.height_m);
		const dbhCm = parseNumeric(row.dbh_cm);

		if (
			treeNumber === null ||
			rowMain === null ||
			rowSub === null ||
			heightM === null ||
			dbhCm === null
		) {
			continue;
		}

		rows.push({
			tree_number: treeNumber,
			row_main: rowMain,
			row_sub: rowSub,
			species_code: row.species_code?.trim(),
			species_name_th: row.species_name_th?.trim(),
			height_m: heightM,
			dbh_cm: dbhCm,
			status: row.status === "dead" || row.status === "missing" ? row.status : "alive",
			note: row.note?.trim(),
		});
	}

	return rows;
}

function extractSurveyDate(text: string): string | null {
	const dateCandidates = [
		...text.matchAll(/(\d{1,2}\/\d{1,2}\/\d{2,4})/g),
		...text.matchAll(/(\d{4}-\d{2}-\d{2})/g),
	];

	for (const match of dateCandidates) {
		const isoDate = toIsoDateOrNull(match[1]);
		if (isoDate) {
			return isoDate;
		}
	}

	return null;
}

export async function parseForestP5Pdf(input: {
	fileBase64: string;
	fileBytes: Buffer;
	sourcePlotCode: string;
	apiKey?: string;
}): Promise<ParsedPdfResult> {
	const issues: ImportParserIssue[] = [];
	let parserVersion = "forest-p5-v1-text";

	const text = await extractTextFromPdf(input.fileBytes);
	let rows = parseRowsFromText(text);
	let surveyDate = extractSurveyDate(text);
	let plotCode: string | undefined = input.sourcePlotCode;

	if (rows.length === 0) {
		parserVersion = "forest-p5-v1-gemini";
		const geminiResult = await extractWithGemini(input.fileBase64, input.apiKey);
		if (geminiResult.rows) {
			rows = normalizeGeminiRows(geminiResult.rows);
		}

		if (geminiResult.survey_date) {
			surveyDate = toIsoDateOrNull(geminiResult.survey_date) ?? surveyDate;
		}

		if (geminiResult.plot_code?.trim()) {
			plotCode = geminiResult.plot_code.trim().toUpperCase();
		}

		if (rows.length === 0) {
			issues.push({
				code: "NO_PARSEABLE_ROWS",
				message: "Cannot parse rows from PDF. Ensure GOOGLE_GENAI_API_KEY is configured for OCR fallback.",
				severity: "error",
			});
		}
	}

	if (!surveyDate) {
		issues.push({
			code: "MISSING_SURVEY_DATE",
			message: "Survey date not found in PDF. Defaulting to today.",
			severity: "warning",
			field: "survey_date",
		});
		surveyDate = new Date().toISOString().slice(0, 10);
	}

	return {
		rows,
		surveyDate,
		plotCode,
		issues,
		parserVersion,
	};
}
