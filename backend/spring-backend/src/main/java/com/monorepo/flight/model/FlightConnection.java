package com.monorepo.flight.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FlightConnection(
    @NotBlank String from,
    @NotBlank String to,
    @NotBlank @Size(min = 4, max = 4) String icaoFrom,
    @NotBlank @Size(min = 4, max = 4) String icaoTo) {}
