package com.monorepo.flight.exception;

/** Fachliche Exception; der GlobalExceptionHandler übersetzt sie in HTTP 404. */
public class ResourceNotFoundException extends RuntimeException {

  public ResourceNotFoundException(String message) {
    super(message);
  }
}
