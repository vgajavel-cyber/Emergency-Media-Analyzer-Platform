package com.emap.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.emap.backend.entity.User;
import com.emap.backend.repository.UserRepository;
import com.emap.backend.security.JwtUtil;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.secret.key}")
    private String adminSecretKey;

    public AuthController(UserRepository userRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String name = body.get("name");

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered"));
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);
        user.setRole("user");
        User saved = userRepository.save(user);

        String token = jwtUtil.generateToken(saved.getEmail(), saved.getRole(), saved.getId());
        return ResponseEntity.ok(buildAuthResponse(saved, token));
    }

    @PostMapping("/register-admin")
    public ResponseEntity<?> registerAdmin(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String name = body.get("name");
        String secretKey = body.get("secretKey");

        // Validate secret key
        if (!adminSecretKey.equals(secretKey)) {
            return ResponseEntity.status(403).body(Map.of("message", "Invalid admin secret key"));
        }

        if (email == null || password == null || name == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name, email and password are required"));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered"));
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);
        user.setRole("admin");
        User saved = userRepository.save(user);

        String token = jwtUtil.generateToken(saved.getEmail(), saved.getRole(), saved.getId());
        return ResponseEntity.ok(buildAuthResponse(saved, token));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        return userRepository.findByEmail(email)
                .filter(u -> passwordEncoder.matches(password, u.getPassword()))
                .<ResponseEntity<?>>map(u -> {
                    String token = jwtUtil.generateToken(u.getEmail(), u.getRole(), u.getId());
                    return ResponseEntity.ok(buildAuthResponse(u, token));
                })
                .orElse(ResponseEntity.status(401).body(Map.of("message", "Invalid credentials")));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid token"));
        }
        String email = jwtUtil.getEmailFromToken(token);
        return userRepository.findByEmail(email)
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(buildUserResponse(u)))
                .orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }

    @PatchMapping("/me")
    public ResponseEntity<?> updateMe(@RequestHeader("Authorization") String authHeader,
                                      @RequestBody Map<String, String> body) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.getEmailFromToken(token);
        return userRepository.findByEmail(email)
                .<ResponseEntity<?>>map(u -> {
                    if (body.containsKey("phone")) u.setPhone(body.get("phone"));
                    if (body.containsKey("name")) u.setName(body.get("name"));
                    userRepository.save(u);
                    return ResponseEntity.ok(buildUserResponse(u));
                })
                .orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }

    private Map<String, Object> buildAuthResponse(User user, String token) {
        Map<String, Object> resp = new HashMap<>();
        resp.put("token", token);
        resp.put("user", buildUserResponse(user));
        return resp;
    }

    private Map<String, Object> buildUserResponse(User user) {
        Map<String, Object> u = new HashMap<>();
        u.put("id", user.getId());
        u.put("email", user.getEmail());
        u.put("name", user.getName());
        u.put("phone", user.getPhone());
        u.put("role", user.getRole());
        return u;
    }
}