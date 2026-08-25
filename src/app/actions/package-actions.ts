'use server';

import { prisma } from '@/lib/prisma';

export async function getPackages(includeInactive = false) {
  const where = includeInactive ? {} : { isActive: true };

  const packages = await prisma.package.findMany({
    where,
    include: {
      _count: { select: { subscribers: true } },
    },
    orderBy: { speedMbps: 'asc' },
  });

  return JSON.parse(JSON.stringify(packages));
}

export async function getPackage(id: string) {
  const pkg = await prisma.package.findUnique({
    where: { id },
    include: {
      _count: { select: { subscribers: true } },
    },
  });

  return pkg ? JSON.parse(JSON.stringify(pkg)) : null;
}

export async function createPackage(data: {
  name: string;
  speedMbps: number;
  priceBDT: number;
  durationDays?: number;
  description?: string;
}) {
  const pkg = await prisma.package.create({
    data: {
      name: data.name,
      speedMbps: data.speedMbps,
      priceBDT: data.priceBDT,
      durationDays: data.durationDays || 30,
      description: data.description || null,
    },
  });

  return JSON.parse(JSON.stringify(pkg));
}

export async function updatePackage(
  id: string,
  data: {
    name?: string;
    speedMbps?: number;
    priceBDT?: number;
    durationDays?: number;
    description?: string;
    isActive?: boolean;
  }
) {
  const pkg = await prisma.package.update({
    where: { id },
    data,
  });

  return JSON.parse(JSON.stringify(pkg));
}

export async function deletePackage(id: string) {
  // Check if any subscribers are using this package
  const count = await prisma.subscriber.count({
    where: { packageId: id },
  });

  if (count > 0) {
    throw new Error(`Cannot delete package: ${count} subscribers are using it`);
  }

  await prisma.package.delete({ where: { id } });
  return { success: true };
}

export async function togglePackageStatus(id: string) {
  const pkg = await prisma.package.findUnique({ where: { id } });
  if (!pkg) throw new Error('Package not found');

  const updated = await prisma.package.update({
    where: { id },
    data: { isActive: !pkg.isActive },
  });

  return JSON.parse(JSON.stringify(updated));
}
