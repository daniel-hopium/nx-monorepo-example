package com.monorepo.flight.controller;

import com.monorepo.flight.model.AircraftInfo;
import com.monorepo.flight.service.AircraftService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/aircraft-infos")
public class AircraftController {

  private final AircraftService aircraftService;

  public AircraftController(AircraftService aircraftService) {
    this.aircraftService = aircraftService;
  }

  @GetMapping
  public List<AircraftInfo> findAll() {
    return aircraftService.findAll();
  }

  @GetMapping("/{id}")
  public AircraftInfo getById(@PathVariable int id) {
    return aircraftService.getById(id);
  }
}
