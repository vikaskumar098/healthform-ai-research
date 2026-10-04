/**
 * Medical Context & Data Normalization Helper
 * 
 * Provides:
 * 1. Normalized presentation model from backend report data
 * 2. Plain-language, non-diagnostic educational descriptions ("Why this matters")
 * 3. Factual, non-prescriptive explanations ("What this means")
 * 4. Human-readable source titles (stripping raw file extensions)
 * 5. Strict adherence to non-diagnostic medical safety policy
 */

// Curated educational descriptions for common laboratory tests
export const TEST_EDUCATIONAL_CONTEXT = {
  // Complete Blood Count (CBC)
  'hemoglobin': 'Hemoglobin is an iron-rich protein in red blood cells that carries oxygen from your lungs to tissues throughout your body.',
  'hematocrit': 'Hematocrit measures the percentage of your blood volume made up of red blood cells.',
  'wbc': 'White blood cells are an essential part of your immune system, defending your body against infections and illness.',
  'white blood cell count': 'White blood cells are an essential part of your immune system, defending your body against infections and illness.',
  'rbc': 'Red blood cells carry oxygen from your lungs to your organs and tissues, and return carbon dioxide back to the lungs.',
  'red blood cell count': 'Red blood cells carry oxygen from your lungs to your organs and tissues, and return carbon dioxide back to the lungs.',
  'platelets': 'Platelets are tiny cell fragments that help your blood clot normally to stop bleeding when you have an injury.',
  'platelet count': 'Platelets are tiny cell fragments that help your blood clot normally to stop bleeding when you have an injury.',
  'mcv': 'Mean Corpuscular Volume (MCV) measures the average size and volume of your red blood cells.',
  'mch': 'Mean Corpuscular Hemoglobin (MCH) measures the average amount of hemoglobin inside each red blood cell.',
  'mchc': 'MCHC measures the average concentration of hemoglobin within a given volume of red blood cells.',
  'rdw': 'Red Cell Distribution Width (RDW) measures the variation in size and shape among your red blood cells.',
  'neutrophils': 'Neutrophils are the most common type of white blood cell, providing first-line defense against bacterial infections.',
  'lymphocytes': 'Lymphocytes are immune cells that help fight viruses and produce protective antibodies.',
  'monocytes': 'Monocytes are immune cells that help clear damaged tissue and fight chronic infections.',
  'eosinophils': 'Eosinophils are immune cells that respond to allergic reactions and parasitic infections.',
  'basophils': 'Basophils are white blood cells involved in inflammatory and allergic responses.',

  // Metabolic & Glucose
  'fasting glucose': 'Glucose is the primary sugar in your blood and provides the main source of energy for your body\'s cells.',
  'glucose': 'Glucose is the primary sugar in your blood and provides the main source of energy for your body\'s cells.',
  'hba1c': 'HbA1c provides an estimate of your average blood sugar levels over the preceding 2 to 3 months.',
  'glycated hemoglobin': 'HbA1c provides an estimate of your average blood sugar levels over the preceding 2 to 3 months.',

  // Kidney / Renal
  'blood urea nitrogen': 'BUN measures the amount of urea nitrogen in your blood, reflecting how well your kidneys and liver are filtering waste.',
  'bun': 'BUN measures the amount of urea nitrogen in your blood, reflecting how well your kidneys and liver are filtering waste.',
  'creatinine': 'Creatinine is a natural waste product of muscle activity that is filtered out of the blood by healthy kidneys.',
  'serum creatinine': 'Creatinine is a natural waste product of muscle activity that is filtered out of the blood by healthy kidneys.',
  'egfr': 'Estimated Glomerular Filtration Rate estimates how efficiently your kidneys are filtering waste from the bloodstream.',
  'uric acid': 'Uric acid is a normal byproduct formed when your body breaks down purines found in certain foods and cells.',

  // Liver
  'alt': 'ALT (Alanine Aminotransferase) is an enzyme found mostly in liver cells that assists in protein metabolism.',
  'alanine aminotransferase': 'ALT is an enzyme found mostly in liver cells that assists in protein metabolism.',
  'ast': 'AST (Aspartate Aminotransferase) is an enzyme found in liver and heart tissues that helps metabolize amino acids.',
  'aspartate aminotransferase': 'AST is an enzyme found in liver and heart tissues that helps metabolize amino acids.',
  'alp': 'Alkaline Phosphatase is an enzyme involved in protein breakdown, found primarily in bile ducts, liver, and bones.',
  'alkaline phosphatase': 'Alkaline Phosphatase is an enzyme involved in protein breakdown, found primarily in bile ducts, liver, and bones.',
  'total bilirubin': 'Bilirubin is a yellowish compound produced during the normal breakdown of old red blood cells.',
  'albumin': 'Albumin is the main protein produced by your liver, helping keep fluid from leaking out of blood vessels.',
  'total protein': 'Total protein measures the combined amount of albumin and globulin proteins in your blood plasma.',

  // Lipids
  'total cholesterol': 'Total cholesterol measures the overall amount of cholesterol lipids circulating in your bloodstream.',
  'hdl cholesterol': 'HDL is often called "good cholesterol" because it helps transport excess cholesterol away from blood vessels.',
  'ldl cholesterol': 'LDL is often called "bad cholesterol" because excess amounts can accumulate along arterial walls.',
  'triglycerides': 'Triglycerides are the most common type of fat in your blood, storing unused calories for future energy.',

  // Thyroid
  'tsh': 'Thyroid Stimulating Hormone (TSH) is produced by the pituitary gland to control how much hormone your thyroid gland makes.',
  'free t4': 'Free T4 is the active thyroid hormone that helps regulate your body\'s metabolism and energy use.',
  'free t3': 'Free T3 is an active thyroid hormone involved in temperature, heart rate, and metabolic regulation.',

  // Electrolytes
  'sodium': 'Sodium is an essential mineral that helps maintain proper fluid balance, blood pressure, and nerve function.',
  'potassium': 'Potassium is a vital mineral and electrolyte that helps regulate heart rhythm, nerve signals, and muscle contractions.',
  'chloride': 'Chloride is an electrolyte that works alongside sodium and potassium to maintain normal fluid balance.',
  'calcium': 'Calcium is essential for healthy bones and teeth, as well as blood clotting, nerve signaling, and muscle contractions.',
};

/**
 * Returns plain-English educational context for a test name.
 */
export function getTestEducationalContext(testName) {
  if (!testName) return 'This test measures a specific biological marker in your sample as part of your laboratory evaluation.';
  const lower = testName.toLowerCase().trim();
  
  // Exact match
  if (TEST_EDUCATIONAL_CONTEXT[lower]) {
    return TEST_EDUCATIONAL_CONTEXT[lower];
  }

  // Partial match
  for (const [key, desc] of Object.entries(TEST_EDUCATIONAL_CONTEXT)) {
    if (lower.includes(key) || key.includes(lower)) {
      return desc;
    }
  }

  return `This test measures the level of ${testName} in your blood or sample as part of your overall laboratory profile.`;
}

/**
 * Generates a clean 1-2 sentence non-diagnostic explanation for a test finding.
 */
export function getTestMeaning(param) {
  const { test_name, value, unit, status, reference_range } = param;
  const refStr = reference_range?.raw || (
    reference_range?.low !== undefined && reference_range?.high !== undefined 
      ? `${reference_range.low} – ${reference_range.high} ${unit || ''}`.trim()
      : null
  );

  switch (status) {
    case 'below_reported_range':
      return `Your reported ${test_name} level (${value} ${unit || ''}) is below the reference range provided by the laboratory (${refStr || 'range not stated'}). This result should be interpreted together with your overall health and other laboratory findings.`.trim();
    
    case 'above_reported_range':
      return `Your reported ${test_name} level (${value} ${unit || ''}) is above the reference range provided by the laboratory (${refStr || 'range not stated'}). This result should be interpreted together with your overall health and other laboratory findings.`.trim();

    case 'within_reported_range':
      return `Your reported ${test_name} level (${value} ${unit || ''}) is within the laboratory's stated reference range (${refStr || 'standard limits'}).`;

    case 'unknown':
    default:
      return `Your reported ${test_name} level is ${value} ${unit || ''}. The executing laboratory did not specify a reference range on this report.`;
  }
}

/**
 * Cleans internal document / knowledge filenames into patient-friendly titles.
 */
export function cleanSourceTitle(source) {
  if (!source) return 'Clinical Laboratory Reference';
  let clean = source.replace(/\.md$/i, '').replace(/_/g, ' ').trim();
  
  const titleMap = {
    'cbc complete blood count': 'Complete Blood Count (CBC) Reference Guide',
    'cmp comprehensive metabolic panel': 'Comprehensive Metabolic Panel (CMP) Guide',
    'lipid panel': 'Lipid & Cholesterol Reference Guide',
    'liver function tests': 'Liver Function Test (LFT) Reference Guide',
    'renal function panel': 'Renal & Kidney Function Reference Guide',
    'thyroid stimulating hormone': 'Thyroid (TSH) Function Reference Guide',
  };

  const lower = clean.toLowerCase();
  for (const [key, friendly] of Object.entries(titleMap)) {
    if (lower.includes(key)) return friendly;
  }

  // Capitalize words
  return clean.replace(/\b\w/g, c => c.toUpperCase()) + ' Reference';
}

/**
 * Strips raw markdown headers, bold tags, and bracketed sources from text.
 */
export function sanitizeText(text) {
  if (!text) return '';
  return text
    .replace(/^#+\s+/gm, '') // Remove # markdown headers
    .replace(/\[Source:\s*[^\]]+\]/gi, '') // Remove [Source: file.md]
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove markdown bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove markdown italics
    .trim();
}

/**
 * Builds the complete normalized presentation model from raw report API data.
 */
export function createReportPresentationModel(report) {
  if (!report) return null;

  const rawParams = report.parameters || [];
  const analysis = report.analysis || {};
  const quality = report.quality_score || {};
  const metadata = report.metadata || {};

  // Status groupings (strictly from backend status)
  const within = rawParams.filter(p => p.status === 'within_reported_range');
  const below  = rawParams.filter(p => p.status === 'below_reported_range');
  const above  = rawParams.filter(p => p.status === 'above_reported_range');
  const unknown = rawParams.filter(p => p.status === 'unknown');

  const total = rawParams.length;
  const needAttention = [...below, ...above];

  // Dynamic natural summary sentence
  let dynamicSummarySentence = '';
  if (total === 0) {
    dynamicSummarySentence = 'No test parameters were identified in this document.';
  } else if (needAttention.length === 0) {
    dynamicSummarySentence = `All ${total} analyzed results are within the laboratory's stated reference ranges.`;
  } else if (needAttention.length === 1) {
    dynamicSummarySentence = `1 result is outside the laboratory's stated reference range. Most of your reported values are within range.`;
  } else {
    dynamicSummarySentence = `${needAttention.length} results are outside the laboratory's stated reference ranges. Most of your reported values are within range.`;
  }

  if (quality.rating === 'POOR') {
    dynamicSummarySentence += ' Some information in this report was difficult to read due to scan quality.';
  }

  // Clean overview text from analysis.summary or fallback
  let cleanOverview = sanitizeText(analysis.summary);
  if (!cleanOverview || cleanOverview.includes('Laboratory analysis parsed')) {
    cleanOverview = `Your report contains ${total} analyzed results. ` + 
      (needAttention.length > 0 
        ? `${needAttention.length} results require attention and are highlighted below.` 
        : 'All results are within the laboratory\'s standard reference intervals.');
  }

  // Clean evidence sources
  const cleanedEvidence = (analysis.evidence || []).map(ev => ({
    ...ev,
    friendlyTitle: cleanSourceTitle(ev.source || ev.title),
    content: sanitizeText(ev.content),
  }));

  // Clean verified claims (filter out unsupported hallucination demos for normal view)
  const verifiedClaims = (analysis.claims || []).filter(c => c.verification_status === 'SUPPORTED');
  const allClaims = analysis.claims || [];

  return {
    id: report.id,
    filename: report.filename,
    reportDate: report.report_date || report.upload_date,
    patientName: report.patient_name && report.patient_name !== 'Anonymous Subject' ? report.patient_name : null,
    documentType: report.document_type || 'laboratory_report',
    qualityRating: quality.rating || 'ACCEPTABLE',
    qualityScore: quality.score || null,
    pageCount: report.page_count || 1,

    // Quantitative metrics
    counts: {
      total,
      within: within.length,
      below: below.length,
      above: above.length,
      unknown: unknown.length,
      needAttention: needAttention.length,
    },

    // Dynamic summaries
    summarySentence: dynamicSummarySentence,
    overview: cleanOverview,
    uncertainty: sanitizeText(analysis.uncertainty),

    // Partitioned parameter lists
    needAttention,
    within,
    unknown,
    allParams: rawParams,

    // Audit & Research data
    evidence: cleanedEvidence,
    verifiedClaims,
    allClaims,
    rawAnalysis: analysis,
    rawMetadata: metadata,
  };
}
