package com.emap.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import com.emap.backend.entity.Report;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByUserId(Long userId, Sort sort);
    List<Report> findByIsVerified(Boolean isVerified, Sort sort);
    Optional<Report> findByIncidentId(String incidentId);
}