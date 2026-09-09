package com.monorepo.flight.exception;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Zentrale Fehlerbehandlung für alle Controller (Cross-Cutting Concern).
 * Im Express-Backend steht dieselbe Logik in jedem Handler einzeln
 * (`res.status(404).json(...)`), hier nur an einer Stelle.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(ResourceNotFoundException.class)
  @ResponseStatus(HttpStatus.NOT_FOUND)
  public Map<String, String> handleNotFound(ResourceNotFoundException ex) {
    return Map.of("message", ex.getMessage());
  }
}
