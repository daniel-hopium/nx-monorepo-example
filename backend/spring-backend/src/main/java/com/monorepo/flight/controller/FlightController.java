package com.monorepo.flight.controller;

import com.monorepo.flight.dto.CreateFlightDto;
import com.monorepo.flight.dto.FlightInfoDto;
import com.monorepo.flight.model.Flight;
import com.monorepo.flight.service.FlightService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller-Schicht (das "C" in MVC): nimmt HTTP-Requests entgegen,
 * validiert die Eingabe und delegiert an den Service. Keine Fachlogik hier.
 * Die Endpunkte entsprechen 1:1 dem Express-Mock-Backend.
 */
@RestController
@RequestMapping("/api")
public class FlightController {

  private final FlightService flightService;

  public FlightController(FlightService flightService) {
    this.flightService = flightService;
  }

  @GetMapping("/flight-infos")
  public List<FlightInfoDto> findFlightInfos(
      @RequestParam(required = false) String from,
      @RequestParam(required = false) String to,
      @RequestParam(required = false) String date) {
    return flightService.findFlightInfos(from, to, date);
  }

  @GetMapping("/flights/{id}")
  public Flight getById(@PathVariable int id) {
    return flightService.getById(id);
  }

  @PostMapping("/flights")
  @ResponseStatus(HttpStatus.CREATED)
  public Flight create(@Valid @RequestBody CreateFlightDto dto) {
    return flightService.create(dto);
  }

  @PutMapping("/flights/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void update(@PathVariable int id, @Valid @RequestBody CreateFlightDto dto) {
    flightService.update(id, dto);
  }

  @DeleteMapping("/flights/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable int id) {
    flightService.delete(id);
  }
}
