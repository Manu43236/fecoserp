package com.fecos.servicereports;

import java.time.LocalDate;

public record DashboardResponse(
        boolean preTripDone,
        int visitsTotal,
        int stopsCompleted,
        int stopsTotal,
        LocalDate visitDate,
        int weekVisitsTotal,
        int weekStopsTotal
) {}
