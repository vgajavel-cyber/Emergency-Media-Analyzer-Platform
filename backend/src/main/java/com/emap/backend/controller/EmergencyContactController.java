package com.emap.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.emap.backend.entity.EmergencyContact;
import com.emap.backend.repository.EmergencyContactRepository;
import com.emap.backend.security.JwtUtil;

@RestController
@RequestMapping("/api/contacts")
public class EmergencyContactController {

    private final EmergencyContactRepository contactRepository;
    private final JwtUtil jwtUtil;

    public EmergencyContactController(EmergencyContactRepository contactRepository, JwtUtil jwtUtil) {
        this.contactRepository = contactRepository;
        this.jwtUtil = jwtUtil;
    }

    private Long extractUserId(String authHeader) {
        return jwtUtil.getUserIdFromToken(authHeader.replace("Bearer ", ""));
    }

    @GetMapping
    public ResponseEntity<?> getMyContacts(@RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(contactRepository.findByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<?> createContact(@RequestHeader("Authorization") String authHeader,
                                           @RequestBody EmergencyContact contact) {
        contact.setUserId(extractUserId(authHeader));
        return ResponseEntity.ok(contactRepository.save(contact));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateContact(@PathVariable Long id,
                                           @RequestBody EmergencyContact updated) {
        return contactRepository.findById(id)
                .<ResponseEntity<?>>map(c -> {
                    if (updated.getName() != null) c.setName(updated.getName());
                    if (updated.getPhone() != null) c.setPhone(updated.getPhone());
                    return ResponseEntity.ok(contactRepository.save(c));
                })
                .orElse(ResponseEntity.status(404).body(Map.of("message", "Contact not found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteContact(@PathVariable Long id) {
        contactRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}
