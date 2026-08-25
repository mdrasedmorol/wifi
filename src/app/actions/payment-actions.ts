'use server';

import { prisma } from '@/lib/prisma';
import { PaymentMethod } from '@prisma/client';

export async function getPayments(params?: {
  subscriberId?: string;
  month?: number;
  year?: number;
  method?: PaymentMethod;
  page?: number;
  perPage?: number;
}) {
  const { subscriberId, month, year, method, page = 1, perPage = 20 } = params || {};

  const where: Record<string, unknown> = {};

  if (subscriberId) where.subscriberId = subscriberId;
  if (month) where.month = month;
  if (year) where.year = year;
  if (method) where.method = method;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        subscriber: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments: JSON.parse(JSON.stringify(payments)),
    total,
    pages: Math.ceil(total / perPage),
    page,
  };
}

export async function createPayment(data: {
  subscriberId: string;
  amount: number;
  method: PaymentMethod;
  month: number;
  year: number;
  note?: string;
  receiptNo?: string;
}) {
  const payment = await prisma.payment.create({
    data: {
      subscriberId: data.subscriberId,
      amount: data.amount,
      method: data.method,
      month: data.month,
      year: data.year,
      note: data.note || null,
      receiptNo: data.receiptNo || null,
    },
    include: {
      subscriber: {
        select: { id: true, name: true, phone: true },
      },
    },
  });

  return JSON.parse(JSON.stringify(payment));
}

export async function deletePayment(id: string) {
  await prisma.payment.delete({ where: { id } });
  return { success: true };
}

export async function getMonthlyBillingSummary(month: number, year: number) {
  // Total collected this month
  const payments = await prisma.payment.aggregate({
    where: { month, year },
    _sum: { amount: true },
    _count: true,
  });

  // Total active subscribers and expected revenue
  const activeSubscribers = await prisma.subscriber.findMany({
    where: { status: 'ACTIVE' },
    include: { package: true },
  });

  const expectedRevenue = activeSubscribers.reduce(
    (sum, sub) => sum + sub.package.priceBDT,
    0
  );

  // Who paid this month
  const paidSubscriberIds = await prisma.payment.findMany({
    where: { month, year },
    select: { subscriberId: true },
    distinct: ['subscriberId'],
  });

  const paidIds = new Set(paidSubscriberIds.map((p) => p.subscriberId));

  // Who hasn't paid
  const unpaid = activeSubscribers.filter((s) => !paidIds.has(s.id));

  return {
    collected: payments._sum.amount || 0,
    paymentCount: payments._count,
    expectedRevenue,
    totalActive: activeSubscribers.length,
    paidCount: paidIds.size,
    unpaidCount: unpaid.length,
    unpaidSubscribers: JSON.parse(JSON.stringify(
      unpaid.map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        packageName: s.package.name,
        amount: s.package.priceBDT,
      }))
    )),
    due: expectedRevenue - (payments._sum.amount || 0),
  };
}
