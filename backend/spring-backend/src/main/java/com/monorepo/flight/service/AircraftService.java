package com.monorepo.flight.service;

import com.monorepo.flight.exception.ResourceNotFoundException;
import com.monorepo.flight.model.AircraftInfo;
import com.monorepo.flight.repository.AircraftRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AircraftService {

  private final AircraftRepository aircraftRepository;

  public AircraftService(AircraftRepository aircraftRepository) {
    this.aircraftRepository = aircraftRepository;
  }

  public List<AircraftInfo> findAll() {
    return aircraftRepository.findAll();
  }

  public AircraftInfo getById(int id) {
    return aircraftRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Aircraft not found"));
  }
}
