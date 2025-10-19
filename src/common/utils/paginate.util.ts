import { Model, Document } from 'mongoose';

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sort?: Record<string, 1 | -1>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CursorPaginationOptions {
  limit: number;
  after?: string;
}

export interface CursorPaginationMeta {
  endCursor: string | null;
  hasNextPage: boolean;
}

export interface CursorPaginatedResult<T> {
  items: T[];
  pageInfo: CursorPaginationMeta;
}

export async function paginate<T extends Document>(
  model: Model<T>,
  filter: any = {},
  projection: any = {},
  options: PaginationOptions
): Promise<PaginatedResult<T>> {
  const { page, pageSize, sort = { createdAt: -1 } } = options;
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    model.find(filter, projection).sort(sort).skip(skip).limit(pageSize).exec(),
    model.countDocuments(filter).exec()
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    meta: {
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

export async function paginateCursor<T extends Document>(
  model: Model<T>,
  filter: any = {},
  projection: any = {},
  options: CursorPaginationOptions
): Promise<CursorPaginatedResult<T>> {
  const { limit, after } = options;
  
  let query = model.find(filter, projection).sort({ _id: 1 }).limit(limit + 1);
  
  if (after) {
    query = query.where('_id').gt(after as any);
  }

  const items = await query.exec();
  const hasNextPage = items.length > limit;
  
  if (hasNextPage) {
    items.pop(); // Remove the extra item
  }

  const endCursor = items.length > 0 ? (items[items.length - 1] as any)._id.toString() : null;

  return {
    items,
    pageInfo: {
      endCursor,
      hasNextPage
    }
  };
}
