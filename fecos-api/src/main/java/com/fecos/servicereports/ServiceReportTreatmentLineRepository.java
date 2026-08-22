package com.fecos.servicereports;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ServiceReportTreatmentLineRepository extends JpaRepository<ServiceReportTreatmentLineEntity, UUID> {

    List<ServiceReportTreatmentLineEntity> findAllByServiceReportIdAndIsDeletedFalseOrderBySortOrderAsc(UUID serviceReportId);
}
