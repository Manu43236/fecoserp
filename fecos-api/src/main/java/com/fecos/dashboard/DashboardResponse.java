package com.fecos.dashboard;

public record DashboardResponse(
        long totalClients,
        long activeVisitsToday,
        long completedVisitsToday,
        long activeRoutesToday,
        long completedRoutesToday,
        long labPending,
        long labCompleted,
        long soarFlagsUnacknowledged,
        long totalWells,
        long totalTanks
) {}
