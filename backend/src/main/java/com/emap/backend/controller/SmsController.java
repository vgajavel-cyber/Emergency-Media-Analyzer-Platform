package com.emap.backend.controller;

import com.emap.backend.entity.Report;
import com.emap.backend.repository.EmergencyContactRepository;
import com.emap.backend.repository.ReportRepository;
import com.emap.backend.service.SnsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sms")
public class SmsController {

    private final SnsService snsService;
    private final ReportRepository reportRepository;
    private final EmergencyContactRepository emergencyContactRepository;

    public SmsController(SnsService snsService,
                         ReportRepository reportRepository,
                         EmergencyContactRepository emergencyContactRepository) {
        this.snsService = snsService;
        this.reportRepository = reportRepository;
        this.emergencyContactRepository = emergencyContactRepository;
    }

    @PostMapping("/send/{reportId}")
    public ResponseEntity<?> sendSms(@PathVariable Long reportId) {
        try {
            Report report = reportRepository.findById(reportId)
                    .orElseThrow(() -> new RuntimeException("Report not found"));

            String trackingUrl = "https://emapnow.me/track/" + report.getIncidentId();
            List<String> sentTo = new ArrayList<>();

            if (report.getUserPhone() != null && !report.getUserPhone().isEmpty()) {
                String userMessage = "EMAP Alert: Your emergency report #" + report.getIncidentId() +
                        " has been verified by authorities. Help is on the way.\n" +
                        "Track emergency vehicle: " + trackingUrl + "\nStay safe.";
                snsService.sendSms(report.getUserPhone(), userMessage);
                sentTo.add(report.getUserPhone());
            }

            if (report.getUserId() != null) {
                emergencyContactRepository.findByUserId(report.getUserId())
                        .forEach(contact -> {
                            if (contact.getPhone() != null && !contact.getPhone().isEmpty()) {
                                String contactMessage = "EMAP Emergency Alert: " +
                                        (report.getUserName() != null ? report.getUserName() : "Someone") +
                                        " has submitted an emergency report (#" + report.getIncidentId() + ").\n\n" +
                                        "Emergency: " + report.getDescription() + "\n" +
                                        "Location: " + (report.getLocation() != null ? report.getLocation() : "") +
                                        (report.getState() != null ? ", " + report.getState() : "") + "\n" +
                                        "Track emergency vehicle: " + trackingUrl + "\n\n" +
                                        "Please check on them immediately.";
                                snsService.sendSms(contact.getPhone(), contactMessage);
                                sentTo.add(contact.getPhone());
                            }
                        });
            }

            return ResponseEntity.ok(Map.of(
                    "message", "SMS sent successfully",
                    "sentTo", sentTo
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}