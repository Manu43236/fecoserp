package com.fecos.dashboard;

public record DashboardResponse(
        // ── ADMIN + MANAGER ─────────────────────────────
        long totalClients,
        long activeClients,
        long totalWells,
        long totalTanks,
        long scheduledVisitsToday,
        long activeVisitsToday,
        long completedVisitsToday,
        long activeRoutesToday,
        long completedRoutesToday,
        long labPending,
        long labCompleted,
        long pendingApprovals,
        long criticalLabResults,

        // ── ALL ROLES ────────────────────────────────────
        long tankCritical,
        long tankWarning,
        long tankHealthy,
        long soarFlagsUnacknowledged,

        // ── LAB_TECH only ────────────────────────────────
        long samplesReceived,
        long samplesInProgress,
        long samplesCompletedToday,
        long samplesOverdue,

        // ── ACCOUNT_REP only ─────────────────────────────
        long myClients,
        long myActiveClients,
        long myWells,
        long myTankCritical,
        long myTankWarning,
        long myTankHealthy,
        long myLabPending,
        long mySoarFlags
) {}
