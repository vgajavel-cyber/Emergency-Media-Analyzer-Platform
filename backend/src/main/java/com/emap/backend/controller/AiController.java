package com.emap.backend.controller;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.emap.backend.repository.ReportRepository;
import com.twilio.Twilio;
import com.twilio.exception.TwilioException;
import com.twilio.rest.api.v2010.account.Call;
import com.twilio.type.PhoneNumber;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final String geminiApiKey;
    private final String twilioAccountSid;
    private final String twilioAuthToken;
    private final String twilioPhone;

    private final ReportRepository reportRepository;
    private final WebClient webClient = WebClient.create();

    public AiController(ReportRepository reportRepository, Map<String, String> appSecrets) {
        this.reportRepository = reportRepository;
        this.geminiApiKey = appSecrets.get("gemini.api.key");
        this.twilioAccountSid = appSecrets.getOrDefault("twilio.account.sid", "");
        this.twilioAuthToken = appSecrets.getOrDefault("twilio.auth.token", "");
        this.twilioPhone = appSecrets.getOrDefault("twilio.phone.number", "");
    }

    // TwiML endpoint — Twilio calls this to get call instructions
    @GetMapping("/twiml")
    public ResponseEntity<String> twiml(@RequestParam String message) {
        String twiml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                "<Response><Say voice=\"alice\">" + message + "</Say></Response>";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .body(twiml);
    }

    // AI Suggestions — proxies Gemini so you don't expose API key in frontend
    @PostMapping("/suggest")
    public ResponseEntity<?> getSuggestions(@RequestBody Map<String, String> body) {
        String prompt = body.get("prompt");

        String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" + geminiApiKey;

        Map<String, Object> requestBody = Map.of(
            "contents", new Object[]{
                Map.of("parts", new Object[]{ Map.of("text", prompt) })
            },
            "generationConfig", Map.of("responseMimeType", "application/json")
        );

        try {
            String response = webClient.post()
                .uri(geminiUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Object parsed = mapper.readValue(response, Object.class);
            return ResponseEntity.ok(parsed);
        } catch (WebClientResponseException | WebClientRequestException e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // Trigger AI Call via Twilio
    @PostMapping("/call/{reportId}")
    public ResponseEntity<?> triggerAiCall(@PathVariable Long reportId) {
        if (twilioAccountSid.isEmpty()) {
            return ResponseEntity.status(503).body(Map.of("message", "Twilio not configured"));
        }

        return reportRepository.findById(reportId)
                .<ResponseEntity<?>>map(report -> {
                    try {
                        Twilio.init(twilioAccountSid, twilioAuthToken);

                        String message = "Emergency alert. Incident " + report.getIncidentId() +
                                ". Description: " + report.getDescription() +
                                ". Location: " + report.getLocation() + ". Please respond immediately.";

                        String twimlUrl = "http://54.242.178.213:8080/api/ai/twiml?message=" +
                                URLEncoder.encode(message, StandardCharsets.UTF_8);

                        String toNumber = report.getUserPhone();
                        if (toNumber == null || toNumber.isEmpty()) {
                            return ResponseEntity.badRequest().body(Map.of("message", "No phone number on report"));
                        }

                        Call call = Call.creator(
                                new PhoneNumber(toNumber),
                                new PhoneNumber(twilioPhone),
                                new URI(twimlUrl)
                        ).create();

                        report.setAiCallPlaced(true);
                        report.setAiCallSid(call.getSid());
                        reportRepository.save(report);

                        return ResponseEntity.ok(Map.of("callSid", call.getSid(), "status", call.getStatus().toString()));
                    } catch (URISyntaxException | TwilioException e) {
                        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
                    }
                })
                .orElse(ResponseEntity.status(404).body(Map.of("message", "Report not found")));
    }
}