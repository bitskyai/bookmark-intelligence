import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import type PrismaTypes from "@pothos/plugin-prisma/generated";
import { DateResolver, DateTimeResolver } from "graphql-scalars";
import { getPrismaClient } from "../db";
import { GQLContext } from "../types";

export const schemaBuilder = new SchemaBuilder<{
  Scalars: {
    Date: { Input: Date; Output: Date };
    DateTime: { Input: Date; Output: Date };
  };
  PrismaTypes: PrismaTypes;
  Context: GQLContext;
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: getPrismaClient(),
    filterConnectionTotalCount: true,
  },
});

schemaBuilder.addScalarType("Date", DateResolver, {});
schemaBuilder.addScalarType("DateTime", DateTimeResolver, {});

// We create empty root query, mutation, and subscription
// because we'll define individual nodes in other files
// since those nodes can have multiple resolvers and possibly
// can lead to really large and hard to read/navigate files
schemaBuilder.queryType({});
// schemaBuilder.mutationType({});
// schemaBuilder.subscriptionType({});
