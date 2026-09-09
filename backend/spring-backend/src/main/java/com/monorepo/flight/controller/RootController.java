package com.monorepo.flight.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RootController {

  @GetMapping
  public Map<String, String> welcome() {
    return Map.of("message", "Welcome to spring-backend!");
  }
}
