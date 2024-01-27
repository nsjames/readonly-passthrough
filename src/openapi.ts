import pkg from "../package.json" assert { type: "json" };
import { OpenApiBuilder, ParameterLocation, ParameterObject } from "openapi3-ts/oas31";

const TAGS = {
    USAGE: "Usage",
    DOCS: "Documentation",
} as const;

const parameters: ParameterObject[] = [
  {
      in: "path",
      name: "contract",
      schema: {type: "string", example: "actions.eosn"},
      required: true,
      description: "Contract Name",
  },
  {
      in: "path",
      name: "action",
      schema: {type: "string", example: "stringvalue"},
      required: true,
      description: "Action Name",
  },
]

function network(location: ParameterLocation = "query", name = "network"): ParameterObject {
  return {
    in: location,
    name,
    schema: { type: "string", example: "mainnet", default: "mainnet" },
    required: false,
    description: "Network (mainnet or testnet)",
  }
}

export async function openapi() {
  return new OpenApiBuilder()
    .addInfo({
      title: pkg.name,
      version: pkg.version,
      description: pkg.description
    })
    .addExternalDocs({ url: pkg.homepage, description: "Extra documentation" })
    .addPath("/{contract}/{action}", {
      get: {
        tags: [TAGS.USAGE],
        summary: "Get Action Return Value",
        parameters: [
          ...parameters,
          network(),
          {
            in: "query",
            name: "data",
            schema: { type: "string", example: `{"message":"hello world"}` },
            required: false,
            description: "Action Data (JSON encoded data)",
          },
        ],
        responses: {
          200: {
            description: "Action Return Value",
            content: {"application/json": {}},
          },
        },
      },
      post: {
        tags: [TAGS.USAGE],
        summary: "Get Action Return Value",
        parameters: [
          ...parameters,
          network("header", "x-network"),
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "string" },
              example: `{"message":"hello world"}`,
            }
          },
        },
        responses: {
          200: {
            description: "Action Return Value",
            content: {"application/json": {}},
          },
        },
      },
    })
    .addPath("/openapi", {
      get: {
        tags: [TAGS.DOCS],
        summary: "OpenAPI specification",
        responses: {
          200: { description: "OpenAPI specification JSON", content: { "application/json": {} } },
        },
      },
    })
    .getSpecAsJson();
}