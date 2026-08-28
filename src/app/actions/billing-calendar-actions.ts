'use server';

import { prisma } from '@/lib/prisma';
import { SubscriberStatus } from '@prisma/client';

export interface CalendarSubscriberItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  status: SubscriberStatus;
  connectionDate: string;
  expiryDate: string;
  package: {
    id: string;
    name: string;
    speedMbps: number;
    priceBDT: number;
  };
  connection?: {
    ipAddress: string | null;
    macAddress: string | null;
    routerModel: string | null;
    location: string | null;
  } | null;
  currentMonthStatus: {
    isPaid: boolean;
    amount: number;
    date?: string;
    method?: string;
    receiptNo?: string;
    month: number;
    year: number;
  };
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    date: string;
    month: number;
    year: number;
    receiptNo: string | null;
  }>;
}

export interface BillingCalendarSummary {
  month: number;
  year: number;
  totalSubscribers: number;
  totalCollected: number;
  totalPendingAmount: number;
  newCustomersThisMonth: number;
  paidCount: number;
  unpaidCount: number;
  collectionRate: number;
}

export async function getBillingCalendarData(params?: {
  month?: number;
  year?: number;
  search?: string;
  status?: SubscriberStatus;
  packageId?: string;
}) {
  const now = new Date();
  const month = params?.month || now.getMonth() + 1;
  const year = params?.year || now.getFullYear();
  const search = params?.search?.trim();
  const status = params?.status;
  const packageId = params?.packageId;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (packageId) {
    where.packageId = packageId;
  }

  const subscribers = await prisma.subscriber.findMany({
    where,
    include: {
      package: true,
      connection: true,
      payments: {
        orderBy: { date: 'desc' },
      },
    },
    orderBy: { connectionDate: 'desc' },
  });

  let totalCollected = 0;
  let totalPendingAmount = 0;
  let newCustomersThisMonth = 0;
  let paidCount = 0;
  let unpaidCount = 0;

  const formattedSubscribers: CalendarSubscriberItem[] = subscribers.map((sub: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string;
    status: SubscriberStatus;
    connectionDate: Date;
    expiryDate: Date;
    package: { id: string; name: string; speedMbps: number; priceBDT: number };
    connection: { ipAddress: string | null; macAddress: string | null; routerModel: string | null; location: string | null } | null;
    payments: Array<{ id: string; amount: number; method: string; date: Date; month: number; year: number; receiptNo: string | null }>;
  }) => {
    // Check if customer started this month
    const connDate = new Date(sub.connectionDate);
    if (connDate.getMonth() + 1 === month && connDate.getFullYear() === year) {
      newCustomersThisMonth++;
    }

    // Find payment record for selected month and year
    const targetPayment = sub.payments.find(
      (p: { month: number; year: number }) => p.month === month && p.year === year
    );

    const isPaid = !!targetPayment;
    if (isPaid) {
      paidCount++;
      totalCollected += targetPayment.amount;
    } else {
      unpaidCount++;
      if (sub.status === 'ACTIVE' || sub.status === 'EXPIRED') {
        totalPendingAmount += sub.package.priceBDT;
      }
    }

    return {
      id: sub.id,
      name: sub.name,
      phone: sub.phone,
      email: sub.email,
      address: sub.address,
      status: sub.status,
      connectionDate: sub.connectionDate.toISOString(),
      expiryDate: sub.expiryDate.toISOString(),
      package: {
        id: sub.package.id,
        name: sub.package.name,
        speedMbps: sub.package.speedMbps,
        priceBDT: sub.package.priceBDT,
      },
      connection: sub.connection ? {
        ipAddress: sub.connection.ipAddress,
        macAddress: sub.connection.macAddress,
        routerModel: sub.connection.routerModel,
        location: sub.connection.location,
      } : null,
      currentMonthStatus: {
        isPaid,
        amount: targetPayment ? targetPayment.amount : sub.package.priceBDT,
        date: targetPayment ? targetPayment.date.toISOString() : undefined,
        method: targetPayment ? targetPayment.method : undefined,
        receiptNo: targetPayment ? targetPayment.receiptNo || undefined : undefined,
        month,
        year,
      },
      payments: sub.payments.map((p: { id: string; amount: number; method: string; date: Date; month: number; year: number; receiptNo: string | null }) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        date: p.date.toISOString(),
        month: p.month,
        year: p.year,
        receiptNo: p.receiptNo,
      })),
    };
  });

  const totalSubs = formattedSubscribers.length;
  const collectionRate = totalSubs > 0 ? Math.round((paidCount / totalSubs) * 100) : 0;

  const summary: BillingCalendarSummary = {
    month,
    year,
    totalSubscribers: totalSubs,
    totalCollected,
    totalPendingAmount,
    newCustomersThisMonth,
    paidCount,
    unpaidCount,
    collectionRate,
  };

  return {
    subscribers: formattedSubscribers,
    summary,
  };
}
