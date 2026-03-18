package com.example.fragrance.recommend.entity;

public enum Age {
    TEN_S("10s"),
    TWENTY_S_EARLY("20s_early"),
    TWENTY_S_MID("20s_mid"),
    TWENTY_S_LATE("20s_late"),
    THIRTY_S("30s"),
    FORTY_S_ABOVE("40s_above");

    private final String value;

    Age(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
