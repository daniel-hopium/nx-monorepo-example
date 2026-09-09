package com.monorepo.flight.model;

import jakarta.validation.constraints.NotBlank;

/** Zeiten als ISO-String (yyyy-MM-ddTHH:mm), passend zum Mock-Backend. */
public record FlightTimes(@NotBlank String takeOff, @NotBlank String landing, Integer delay) {}
