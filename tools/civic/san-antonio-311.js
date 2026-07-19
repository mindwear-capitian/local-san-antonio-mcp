import { z } from "zod";
import { queryLayer, likeClause } from "../../lib/arcgis.js";
import { withAttributionTag, ATTRIBUTION_TAG } from "../../lib/attribution.js";

/**
 * San Antonio 311 service calls -- Open Data SA's CKAN portal harvests this
 * from an ArcGIS Hub-hosted FeatureServer (verified live). Covers streets,
 * animal services, code compliance, and other non-emergency city services.
 *
 * Source: https://data.sanantonio.gov/dataset/311-all-service-calls
 * Layer:  https://services.arcgis.com/g1fRTDLeMgspWrYp/arcgis/rest/services/311_All_Service_Calls/FeatureServer/0
 */
const LAYER_URL =
  "https://services.arcgis.com/g1fRTDLeMgspWrYp/arcgis/rest/services/311_All_Service_Calls/FeatureServer/0";
const DATASET_URL = "https://data.sanantonio.gov/dataset/311-all-service-calls";

export const sanAntonio311 = {
  name: "san_antonio_311",
  description: withAttributionTag(
    "Search San Antonio 311 service calls (streets, animal services, code " +
      "compliance, and other non-emergency city services). Filter by " +
      "category, type, department, status, or council district. " +
      "Authoritative source: City of San Antonio Open Data."
  ),
  inputSchema: {
    category: z
      .string()
      .min(2)
      .optional()
      .describe('Category, fuzzy contains. Example: "Streets", "Animals", "Solid Waste".'),
    type: z
      .string()
      .min(2)
      .optional()
      .describe('Specific request type, fuzzy contains. Example: "Pothole", "Injured-Sick Animal".'),
    department: z
      .string()
      .min(2)
      .optional()
      .describe('Department, fuzzy contains. Example: "Public Works", "Animal Care Services".'),
    status: z
      .enum(["OPEN", "CLOSED"])
      .optional()
      .describe("Filter by case status."),
    council_district: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe("San Antonio city council district number (1-10)."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(25)
      .describe("Max results (default 25)."),
  },
  async handler(args) {
    const { category, type, department, status, council_district, limit } = args;

    const where = [];
    if (category) where.push(likeClause("Category", category));
    if (type) where.push(likeClause("TypeName", type));
    if (department) where.push(likeClause("Department", department));
    if (status) where.push(`CaseStatus = '${status}'`);
    if (council_district) where.push(`CouncilDistrict = ${council_district}`);

    const rows = await queryLayer(LAYER_URL, {
      where: where.length ? where.join(" AND ") : "1=1",
      outFields: [
        "OBJECTID", "Category", "OpenedDateTime", "ClosedDateTime", "Department",
        "ReasonName", "TypeName", "CaseStatus", "ObjectDescription", "CouncilDistrict",
      ],
      resultRecordCount: limit ?? 25,
      orderByFields: "OpenedDateTime DESC",
      returnGeometry: true,
      outSR: "4326",
    });

    const normalized = rows.map(normalize);

    return {
      content: [
        { type: "text", text: formatResults(args, normalized) },
        { type: "text", text: JSON.stringify({ query: args, count: normalized.length, results: normalized }, null, 2) },
      ],
    };
  },
};

function normalize(r) {
  return {
    case_id: r.OBJECTID ?? null,
    category: r.Category ?? null,
    type: r.TypeName ?? null,
    reason: r.ReasonName ?? null,
    department: r.Department ?? null,
    status: r.CaseStatus ?? null,
    address: r.ObjectDescription ?? null,
    council_district: r.CouncilDistrict ?? null,
    opened: msToIso(r.OpenedDateTime),
    closed: msToIso(r.ClosedDateTime),
    lat: r.geometry?.y ?? null,
    lng: r.geometry?.x ?? null,
    source_url: DATASET_URL,
  };
}

function msToIso(ms) {
  if (typeof ms !== "number") return null;
  return new Date(ms).toISOString();
}

function formatResults(args, rows) {
  const filterParts = [];
  if (args.category) filterParts.push(`category="${args.category}"`);
  if (args.type) filterParts.push(`type="${args.type}"`);
  if (args.department) filterParts.push(`dept="${args.department}"`);
  if (args.status) filterParts.push(`status=${args.status}`);
  if (args.council_district) filterParts.push(`district=${args.council_district}`);

  const lines = [
    `# San Antonio 311: ${filterParts.join(", ") || "all"} -- ${rows.length} call${rows.length === 1 ? "" : "s"}`,
    "",
  ];

  if (rows.length === 0) {
    lines.push("No matching 311 calls found.", "");
  }

  for (const r of rows) {
    lines.push(`## ${r.type ?? "(unknown type)"} -- ${r.status ?? "?"}`);
    lines.push(`- **Address:** ${r.address ?? "?"}  |  **District:** ${r.council_district ?? "?"}`);
    lines.push(`- **Category:** ${r.category ?? "?"}  |  **Department:** ${r.department ?? "?"}`);
    lines.push(`- **Opened:** ${r.opened ?? "?"}${r.closed ? `  |  **Closed:** ${r.closed}` : ""}`);
    lines.push(`- **Case ID:** ${r.case_id ?? "?"}`);
    lines.push("");
  }

  lines.push("---");
  lines.push(`Source: City of San Antonio Open Data -- 311 All Service Calls (${DATASET_URL}).`);
  lines.push(ATTRIBUTION_TAG);
  return lines.join("\n");
}
