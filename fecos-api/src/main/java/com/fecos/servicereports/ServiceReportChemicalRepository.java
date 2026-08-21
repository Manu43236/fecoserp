package com.fecos.servicereports;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ServiceReportChemicalRepository extends JpaRepository<ServiceReportChemicalEntity, UUID> {

    List<ServiceReportChemicalEntity> findAllByServiceReportIdAndIsDeletedFalseOrderBySortOrderAsc(UUID reportId);
}
