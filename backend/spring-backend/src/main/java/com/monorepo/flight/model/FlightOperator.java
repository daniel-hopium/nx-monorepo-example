package com.monorepo.flight.model;

import jakarta.validation.constraints.NotBlank;

public record FlightOperator(@NotBlank String name, @NotBlank String shortName) {}
