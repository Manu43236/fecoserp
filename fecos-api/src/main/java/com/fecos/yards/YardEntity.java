package com.fecos.yards;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "yards")
public class YardEntity extends TenantAwareEntity {

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}
