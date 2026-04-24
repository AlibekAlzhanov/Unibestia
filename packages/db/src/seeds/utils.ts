import type {
  DataSource,
  DeepPartial,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from "typeorm";

export async function upsertByWhere<T extends ObjectLiteral>(
  repo: Repository<T>,
  where: FindOptionsWhere<T>,
  payload: DeepPartial<T>
): Promise<T> {
  const existing = await repo.findOne({ where });

  if (existing) {
    repo.merge(existing, payload);
    return await repo.save(existing);
  }

  const created = repo.create({
    ...(where as object),
    ...(payload as object),
  } as DeepPartial<T>);

  return await repo.save(created);
}

export async function logSeedStep(dataSource: DataSource, message: string): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`[seed ${timestamp}] ${message}`);
}