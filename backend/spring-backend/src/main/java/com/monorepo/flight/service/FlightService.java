package com.monorepo.flight.service;

import com.monorepo.flight.dto.CreateFlightDto;
import com.monorepo.flight.dto.FlightInfoDto;
import com.monorepo.flight.exception.ResourceNotFoundException;
import com.monorepo.flight.model.Flight;
import com.monorepo.flight.repository.FlightRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;

/**
 * Service-Schicht: enthält die Fachlogik (Filtern, Limitieren, Regeln).
 * Der Controller bleibt dünn und kümmert sich nur um HTTP.
 */
@Service
public class FlightService {

  private static final int MAX_RESULTS = 30;

  private final FlightRepository flightRepository;

  public FlightService(FlightRepository flightRepository) {
    this.flightRepository = flightRepository;
  }

  public List<FlightInfoDto> findFlightInfos(String from, String to, String date) {
    Stream<Flight> stream = flightRepository.findAll().stream();

    if (from != null && !from.isBlank()) {
      stream = stream.filter(f -> f.connection().from().equalsIgnoreCase(from));
    }
    if (to != null && !to.isBlank()) {
      stream = stream.filter(f -> f.connection().to().equalsIgnoreCase(to));
    }
    if (date != null && !date.isBlank()) {
      LocalDateTime notBefore = parseDate(date);
      stream = stream.filter(f -> !LocalDateTime.parse(f.times().takeOff()).isBefore(notBefore));
    }

    return stream.limit(MAX_RESULTS).map(FlightInfoDto::from).toList();
  }

  public Flight getById(int id) {
    return flightRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Flight not found"));
  }

  public Flight create(CreateFlightDto dto) {
    return flightRepository.save(dto.toFlight(0));
  }

  public void update(int id, CreateFlightDto dto) {
    getById(id); // wirft 404, falls es den Flug nicht gibt
    flightRepository.save(dto.toFlight(id));
  }

  public void delete(int id) {
    if (!flightRepository.deleteById(id)) {
      throw new ResourceNotFoundException("Flight not found");
    }
  }

  /** Akzeptiert sowohl "2026-09-09T08:00" als auch volle ISO-Strings mit Zone. */
  private static LocalDateTime parseDate(String date) {
    String trimmed = date.length() > 16 ? date.substring(0, 16) : date;
    return LocalDateTime.parse(trimmed);
  }
}
