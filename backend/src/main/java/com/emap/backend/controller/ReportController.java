package com.emap.backend.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.emap.backend.entity.Report;
import com.emap.backend.repository.ReportRepository;
import com.emap.backend.security.JwtUtil;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ReportController {

    private final ReportRepository reportRepository;
    private final JwtUtil jwtUtil;

    public ReportController(ReportRepository reportRepository, JwtUtil jwtUtil) {
        this.reportRepository = reportRepository;
        this.jwtUtil = jwtUtil;
    }

    // ─── CREATE REPORT (public - no auth needed) ───────────────────────────────
    @PostMapping
    public ResponseEntity<?> createReport(@RequestBody Report report) {
        if (report.getDescription() == null || report.getDescription().trim().isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Description is required");
            return ResponseEntity.badRequest().body(error);
        }

        String incidentId = "INC-" + LocalDate.now().toString().replace("-", "") +
                "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        report.setIncidentId(incidentId);

        if (report.getStatus() == null || report.getStatus().isBlank()) {
            report.setStatus("Received");
        }
        if (report.getIsVerified() == null) {
            report.setIsVerified(false);
        }
        if (report.getIsAnonymous() == null) {
            report.setIsAnonymous(true);
        }
        if (report.getAiCallPlaced() == null) {
            report.setAiCallPlaced(false);
        }

        Report saved = reportRepository.save(report);
        return ResponseEntity.ok(saved);
    }

    // ─── GET ALL REPORTS (admin) ────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<Report>> getAllReports() {
        List<Report> all = reportRepository.findAll(
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(all);
    }

    // ─── GET VERIFIED REPORTS (public - for danger zone list) ──────────────────
    @GetMapping("/verified")
    public ResponseEntity<List<Report>> getVerifiedReports() {
        List<Report> verified = reportRepository.findByIsVerified(
                true, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(verified);
    }

    // ─── GET MY REPORTS (logged-in user) ───────────────────────────────────────
    @GetMapping("/my")
    public ResponseEntity<?> getMyReports(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtUtil.getUserIdFromToken(token);
            List<Report> mine = reportRepository.findByUserId(
                    userId, Sort.by(Sort.Direction.DESC, "createdAt"));
            return ResponseEntity.ok(mine);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Invalid or expired token");
            return ResponseEntity.status(401).body(error);
        }
    }

    // ─── GET REPORT BY DB ID ────────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getReportById(@PathVariable Long id) {
        return reportRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> {
                    Map<String, String> error = new HashMap<>();
                    error.put("message", "Report not found");
                    return ResponseEntity.status(404).body(error);
                });
    }

    // ─── GET REPORT BY INCIDENT ID (e.g. INC-20260405-AB12CD) ─────────────────
    @GetMapping("/incident/{incidentId}")
    public ResponseEntity<?> getByIncidentId(@PathVariable String incidentId) {
        return reportRepository.findByIncidentId(incidentId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> {
                    Map<String, String> error = new HashMap<>();
                    error.put("message", "Incident not found");
                    return ResponseEntity.status(404).body(error);
                });
    }

    // ─── UPDATE REPORT (patch - admin or system) ───────────────────────────────
    @PatchMapping("/{id}")
    public ResponseEntity<?> updateReport(
            @PathVariable Long id,
            @RequestBody Report updatedReport) {

        return reportRepository.findById(id)
                .<ResponseEntity<?>>map(report -> {
                    if (updatedReport.getDescription() != null)
                        report.setDescription(updatedReport.getDescription());
                    if (updatedReport.getLocation() != null)
                        report.setLocation(updatedReport.getLocation());
                    if (updatedReport.getState() != null)
                        report.setState(updatedReport.getState());
                    if (updatedReport.getIp() != null)
                        report.setIp(updatedReport.getIp());
                    if (updatedReport.getLatitude() != null)
                        report.setLatitude(updatedReport.getLatitude());
                    if (updatedReport.getLongitude() != null)
                        report.setLongitude(updatedReport.getLongitude());
                    if (updatedReport.getStatus() != null)
                        report.setStatus(updatedReport.getStatus());
                    if (updatedReport.getIsVerified() != null)
                        report.setIsVerified(updatedReport.getIsVerified());
                    if (updatedReport.getIsAnonymous() != null)
                        report.setIsAnonymous(updatedReport.getIsAnonymous());
                    if (updatedReport.getUserName() != null)
                        report.setUserName(updatedReport.getUserName());
                    if (updatedReport.getUserEmail() != null)
                        report.setUserEmail(updatedReport.getUserEmail());
                    if (updatedReport.getUserPhone() != null)
                        report.setUserPhone(updatedReport.getUserPhone());
                    if (updatedReport.getUserId() != null)
                        report.setUserId(updatedReport.getUserId());
                    if (updatedReport.getAiCallPlaced() != null)
                        report.setAiCallPlaced(updatedReport.getAiCallPlaced());
                    if (updatedReport.getAiCallSid() != null)
                        report.setAiCallSid(updatedReport.getAiCallSid());

                    Report saved = reportRepository.save(report);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> {
                    Map<String, String> error = new HashMap<>();
                    error.put("message", "Report not found");
                    return ResponseEntity.status(404).body(error);
                });
    }
}