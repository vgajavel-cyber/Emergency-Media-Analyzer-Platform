package com.emap.backend.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    private final String uploadDir = "uploads/";

    @PostMapping("/upload/{reportId}")
    public ResponseEntity<?> uploadMedia(
            @PathVariable Long reportId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type) {

        try {
            // Create uploads directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir + reportId);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalName = file.getOriginalFilename();
            String extension = originalName != null && originalName.contains(".")
                    ? originalName.substring(originalName.lastIndexOf("."))
                    : ".bin";
            String filename = type + "-" + UUID.randomUUID().toString().substring(0, 8) + extension;

            // Save file
            Path filePath = uploadPath.resolve(filename);
            Files.write(filePath, file.getBytes());

            String fileUrl = "/api/media/file/" + reportId + "/" + filename;

            return ResponseEntity.ok(Map.of(
                    "filename", filename,
                    "url", fileUrl,
                    "type", type,
                    "size", file.getSize(),
                    "originalName", originalName != null ? originalName : filename
            ));

        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }

    @GetMapping("/file/{reportId}/{filename}")
    public ResponseEntity<Resource> serveFile(
            @PathVariable Long reportId,
            @PathVariable String filename) {

        try {
            Path filePath = Paths.get(uploadDir + reportId).resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "application/octet-stream";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (IOException e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/list/{reportId}")
    public ResponseEntity<?> listMedia(@PathVariable Long reportId) {
        try {
            Path uploadPath = Paths.get(uploadDir + reportId);
            if (!Files.exists(uploadPath)) {
                return ResponseEntity.ok(List.of());
            }

            List<Map<String, String>> files = new ArrayList<>();
            Files.list(uploadPath).forEach(path -> {
                String filename = path.getFileName().toString();
                String type = filename.startsWith("video") ? "video" : "audio";
                files.add(Map.of(
                        "filename", filename,
                        "url", "/api/media/file/" + reportId + "/" + filename,
                        "type", type
                ));
            });

            return ResponseEntity.ok(files);

        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}