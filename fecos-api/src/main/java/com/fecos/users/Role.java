package com.fecos.users;

public enum Role {
    SUPER_ADMIN,
    ADMIN,
    MANAGER,
    LAB_TECH,
    ACCOUNT_REP,
    TRUCK_DRIVER,
    SERVICE_TECH;

    public boolean isWebRole() {
        return this == SUPER_ADMIN || this == ADMIN || this == MANAGER
                || this == LAB_TECH || this == ACCOUNT_REP;
    }

    public boolean isMobileRole() {
        return this == TRUCK_DRIVER || this == SERVICE_TECH || this == ACCOUNT_REP;
    }
}
