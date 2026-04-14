package com.emap.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.emap.backend.entity.EmergencyContact;

public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, Long> {
    List<EmergencyContact> findByUserId(Long userId);
}