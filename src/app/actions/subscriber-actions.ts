'use server';

import { prisma } from '@/lib/prisma';
import { SubscriberStatus } from '@prisma/client';

export async function getSubscribers(params?: {
  search?: string;
  status?: SubscriberStatus;
  packageId?: string;
  page?: number;
  perPage?: number;
}) {
  const { search, status, packageId, page = 1, perPage = 20 } = params || {};

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (packageId) {
    where.packageId = packageId;
  }

  const [subscribers, total] = await Promise.all([
    prisma.subscriber.findMany({
      where,
      include: { package: true, connection: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.subscriber.count({ where }),
  ]);

  return {
    subscribers: JSON.parse(JSON.stringify(subscribers)),
    total,
    pages: Math.ceil(total / perPage),
    page,
  };
}

export async function getSubscriber(id: string) {
  const subscriber = await prisma.subscriber.findUnique({
    where: { id },
    include: {
      package: true,
      connection: true,
      payments: {
        orderBy: { date: 'desc' },
        take: 20,
      },
    },
  });

  return subscriber ? JSON.parse(JSON.stringify(subscriber)) : null;
}

export async function createSubscriber(data: {
  name: string;
  phone: string;
  email?: string;
  address: string;
  nid?: string;
  packageId: string;
  expiryDate: string;
  notes?: string;
  connection?: {
    ipAddress?: string;
    macAddress?: string;
    routerModel?: string;
    location?: string;
    oltPort?: string;
    onuSerial?: string;
  };
}) {
  const subscriber = await prisma.subscriber.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      address: data.address,
      nid: data.nid || null,
      packageId: data.packageId,
      expiryDate: new Date(data.expiryDate),
      notes: data.notes || null,
      connection: data.connection
        ? { create: data.connection }
        : undefined,
    },
    include: { package: true, connection: true },
  });

  return JSON.parse(JSON.stringify(subscriber));
}

export async function updateSubscriber(
  id: string,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    nid?: string;
    packageId?: string;
    expiryDate?: string;
    status?: SubscriberStatus;
    notes?: string;
    connection?: {
      ipAddress?: string;
      macAddress?: string;
      routerModel?: string;
      location?: string;
      oltPort?: string;
      onuSerial?: string;
    };
  }
) {
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.nid !== undefined) updateData.nid = data.nid || null;
  if (data.packageId !== undefined) updateData.packageId = data.packageId;
  if (data.expiryDate !== undefined) updateData.expiryDate = new Date(data.expiryDate);
  if (data.status !== undefined) updateData.status = data.status;
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  if (data.connection) {
    const existing = await prisma.connection.findUnique({
      where: { subscriberId: id },
    });
    if (existing) {
      await prisma.connection.update({
        where: { subscriberId: id },
        data: data.connection,
      });
    } else {
      await prisma.connection.create({
        data: { ...data.connection, subscriberId: id },
      });
    }
  }

  const subscriber = await prisma.subscriber.update({
    where: { id },
    data: updateData,
    include: { package: true, connection: true },
  });

  return JSON.parse(JSON.stringify(subscriber));
}

export async function deleteSubscriber(id: string) {
  await prisma.subscriber.delete({ where: { id } });
  return { success: true };
}

export async function toggleSubscriberStatus(id: string) {
  const subscriber = await prisma.subscriber.findUnique({ where: { id } });
  if (!subscriber) throw new Error('Subscriber not found');

  const newStatus: SubscriberStatus =
    subscriber.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

  const updated = await prisma.subscriber.update({
    where: { id },
    data: { status: newStatus },
    include: { package: true },
  });

  return JSON.parse(JSON.stringify(updated));
}

export async function getSubscriberStatusByPhone(phoneQuery: string) {
  const cleanPhone = phoneQuery.replace(/[\s\-\+\(\)]/g, '').replace(/^88/, '');
  if (!cleanPhone || cleanPhone.length < 4) {
    return { success: false, error: 'Please enter a valid mobile number.' };
  }

  const subscriber = await prisma.subscriber.findFirst({
    where: {
      OR: [
        { phone: { contains: cleanPhone } },
        { phone: { equals: phoneQuery } },
      ],
    },
    include: {
      package: true,
      connection: true,
      payments: {
        orderBy: { date: 'desc' },
        take: 5,
      },
    },
  });

  if (!subscriber) {
    return { success: false, error: 'No registered subscriber account found with this phone number.' };
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const expiry = new Date(subscriber.expiryDate);
  const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = expiry < now;

  const currentMonthPayment = subscriber.payments.find(
    (p) => p.month === currentMonth && p.year === currentYear
  );

  const isPaymentPending = isExpired || !currentMonthPayment || subscriber.status === 'EXPIRED';
  const dueAmount = isPaymentPending ? subscriber.package.priceBDT : 0;

  return {
    success: true,
    subscriber: JSON.parse(JSON.stringify(subscriber)),
    isPaymentPending,
    dueAmount,
    daysRemaining,
    currentMonthPaid: !!currentMonthPayment,
    lastPayment: subscriber.payments[0] ? JSON.parse(JSON.stringify(subscriber.payments[0])) : null,
  };
}

