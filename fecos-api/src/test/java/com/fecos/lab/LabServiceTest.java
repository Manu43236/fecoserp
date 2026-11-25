package com.fecos.lab;

import com.fecos.clients.ClientRepository;
import com.fecos.common.RefNumberService;
import com.fecos.leases.LeaseRepository;
import com.fecos.programs.TreatmentPlanRepository;
import com.fecos.users.UserRepository;
import com.fecos.wells.WellRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LabServiceTest {

    @Mock LabSampleRepository sampleRepository;
    @Mock LabResultRepository resultRepository;
    @Mock UserRepository userRepository;
    @Mock WellRepository wellRepository;
    @Mock LeaseRepository leaseRepository;
    @Mock ClientRepository clientRepository;
    @Mock TreatmentPlanRepository treatmentPlanRepository;
    @Mock RefNumberService refNumberService;

    private LabService service() {
        return new LabService(sampleRepository, resultRepository, userRepository,
                wellRepository, leaseRepository, clientRepository, treatmentPlanRepository,
                refNumberService);
    }

    @Test
    @DisplayName("createFromField lands a COLLECTED sample with no receipt time and the custody code")
    void createFromField_newCustodyCode_savesCollected() {
        var tenant = UUID.randomUUID();
        var tech = UUID.randomUUID();
        var well = UUID.randomUUID();
        when(sampleRepository.findByTenantIdAndCustodyCodeAndIsDeletedFalse(tenant, "LS-WELX1-PW-18/01"))
                .thenReturn(Optional.empty());

        service().createFromField(tenant, tech, well, SampleType.PRODUCED_WATER,
                Instant.parse("2026-11-18T10:15:30Z"), "LS-WELX1-PW-18/01", "heavy scale");

        var captor = ArgumentCaptor.forClass(LabSampleEntity.class);
        verify(sampleRepository).save(captor.capture());
        var saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(LabSampleStatus.COLLECTED);
        assertThat(saved.getReceivedAt()).isNull();
        assertThat(saved.getCustodyCode()).isEqualTo("LS-WELX1-PW-18/01");
        assertThat(saved.getSampleType()).isEqualTo(SampleType.PRODUCED_WATER);
        assertThat(saved.getWellId()).isEqualTo(well);
        assertThat(saved.getCollectedById()).isEqualTo(tech);
        assertThat(saved.getCollectedAt()).isNotNull();
        assertThat(saved.getSampleNumber()).startsWith("SMP-");
    }

    @Test
    @DisplayName("createFromField is idempotent — a duplicate custody code creates no second row")
    void createFromField_duplicateCustodyCode_doesNotCreateSecondRow() {
        var tenant = UUID.randomUUID();
        when(sampleRepository.findByTenantIdAndCustodyCodeAndIsDeletedFalse(tenant, "LS-WELX1-PW-18/01"))
                .thenReturn(Optional.of(new LabSampleEntity()));

        service().createFromField(tenant, UUID.randomUUID(), UUID.randomUUID(),
                SampleType.PRODUCED_WATER, Instant.now(), "LS-WELX1-PW-18/01", null);

        verify(sampleRepository, never()).save(any());
    }
}
