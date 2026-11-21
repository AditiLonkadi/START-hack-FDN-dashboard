import { z } from "zod";

export const paginationSchema = z.object({
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  total_pages: z.number().int().positive(),
});

const matrixItemSchema = z.object({
  team_name: z.string().min(1),
  cells: z.array(z.number().finite()),
  total: z.number().finite(),
});

export const matrixSchema = paginationSchema.extend({
  game_ids: z.array(z.number().int().positive()),
  items: z.array(matrixItemSchema),
}).superRefine((response, ctx) => {
    response.items.forEach((item, index) => {
      if (item.cells.length !== response.game_ids.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["items", index, "cells"], message: "Each score row must match game_ids." });
      }
    });
});

export const performanceSchema = z.object({
  team_name: z.string().min(1),
  income: z.number().finite(),
  costs: z.number().finite(),
  net: z.number().finite(),
  issued_count: z.number().int().nonnegative(),
  issued_accepted: z.number().int().nonnegative(),
  reviewed_count: z.number().int().nonnegative(),
  reviewed_accepted: z.number().int().nonnegative(),
  reviewed_accepted_right: z.number().int().nonnegative(),
  reviewed_accepted_wrong: z.number().int().nonnegative(),
  reviewed_correct_rejections: z.number().int().nonnegative(),
  reviewed_penalties: z.number().int().nonnegative(),
});

export const gamesSchema = paginationSchema.extend({
  items: z.array(z.object({
    id: z.number().int().positive(),
    start_time: z.string().datetime(),
    status: z.enum(["scheduled", "completed"]),
  })),
});

export const matchupSchema = paginationSchema.extend({
  game_ids: z.array(z.number().int().positive()),
  items: z.array(z.object({
    team: z.string().min(1),
    opponent: z.string().min(1),
    cells: z.array(z.number().finite()),
    total: z.number().finite(),
  })),
});

export const transactionSchema = z.object({
  issuer: z.string().min(1),
  reviewer: z.string().min(1),
  line_item_index: z.number().int().nonnegative(),
  accepted: z.boolean(),
  amount: z.number().finite(),
});

export const transactionsSchema = paginationSchema.extend({ items: z.array(transactionSchema) });

export type Matrix = z.infer<typeof matrixSchema>;
export type Performance = z.infer<typeof performanceSchema>;
export type Game = z.infer<typeof gamesSchema>["items"][number];
export type Matchup = z.infer<typeof matchupSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
