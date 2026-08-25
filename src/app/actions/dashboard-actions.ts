'use server';

import { prisma } from '@/lib/prisma';

export async function getDashboardStats() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Subscriber counts
  const [total, active, expired, suspended, inactive] = await Promise.all([
    prisma.subscriber.count(),
    prisma.subscriber.count({ where: { status: 'ACTIVE' } }),
    prisma.subscriber.count({ where: { status: 'EXPIRED' } }),
    prisma.subscriber.count({ where: { status: 'SUSPENDED' } }),
    prisma.subscriber.count({ where: { status: 'INACTIVE' } }),
  ]);

  // Monthly revenue
  const monthlyPayments = await prisma.payment.aggregate({
    where: { month: currentMonth, year: currentYear },
    _sum: { amount: true },
  });

  // Recent payments
  const recentPayments = await prisma.payment.findMany({
    take: 5,
    orderBy: { date: 'desc' },
    include: {
      subscriber: {
        select: { name: true, phone: true },
      },
    },
  });

  // Expiring in next 7 days
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  const expiringSoon = await prisma.subscriber.findMany({
    where: {
      status: 'ACTIVE',
      expiryDate: {
        gte: now,
        lte: sevenDaysLater,
      },
    },
    include: { package: true },
    orderBy: { expiryDate: 'asc' },
    take: 10,
  });

  return {
    counts: { total, active, expired, suspended, inactive },
    monthlyRevenue: monthlyPayments._sum.amount || 0,
    recentPayments: JSON.parse(JSON.stringify(recentPayments)),
    expiringSoon: JSON.parse(JSON.stringify(expiringSoon)),
  };
}

export async function getRevenueChartData() {
  const now = new Date();
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const payments = await prisma.payment.aggregate({
      where: { month, year },
      _sum: { amount: true },
    });

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    months.push({
      month: monthNames[date.getMonth()],
      revenue: payments._sum.amount || 0,
    });
  }

  return months;
}

export async function getPackageDistribution() {
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { subscribers: true } },
    },
  });

  return packages.map((pkg: { name: string; _count: { subscribers: number }; speedMbps: number }) => ({
    name: pkg.name,
    value: pkg._count.subscribers,
    speed: pkg.speedMbps,
  }));
}

export async function getSubscriberGrowth() {
  const now = new Date();
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const count = await prisma.subscriber.count({
      where: {
        connectionDate: {
          lte: endDate,
        },
      },
    });

    const newCount = await prisma.subscriber.count({
      where: {
        connectionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    months.push({
      month: monthNames[startDate.getMonth()],
      total: count,
      new: newCount,
    });
  }

  return months;
}
