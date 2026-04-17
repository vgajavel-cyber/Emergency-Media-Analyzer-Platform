package com.emap.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

//import com.emap.backend.entity.Report;
import com.emap.backend.repository.ReportRepository;
import com.emap.backend.service.S3Service;

import jakarta.transaction.Transactional;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    private final S3Service s3Service;
    private final ReportRepository reportRepository;

    public MediaController(S3Service s3Service, ReportRepository reportRepository) {
        this.s3Service = s3Service;
        this.reportRepository = reportRepository;
    }

    @PostMapping("/upload")
    @Transactional
    public synchronized ResponseEntity<?> uploadMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "reportId", required = false) Long reportId) {
        try {
            String url = s3Service.uploadFile(file);

            if (reportId != null) {
                reportRepository.findById(reportId).ifPresent(report -> {
                    String existing = report.getMediaUrls();
                    String updated = (existing == null || existing.isEmpty())
                            ? url
                            : existing + "," + url;
                    report.setMediaUrls(updated);
                    reportRepository.save(report);
                });
            }

            return ResponseEntity.ok(Map.of("url", url));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }
}