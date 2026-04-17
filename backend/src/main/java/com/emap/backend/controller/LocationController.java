package com.emap.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/location")
public class LocationController {

    @GetMapping
    public ResponseEntity<?> getLocation(@RequestParam(value = "ip", required = false) String ip) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = (ip != null && !ip.isEmpty())
                ? "http://ip-api.com/json/" + ip
                : "http://ip-api.com/json/";
            String response = restTemplate.getForObject(url, String.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}