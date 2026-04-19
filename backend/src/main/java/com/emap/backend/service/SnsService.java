package com.emap.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import software.amazon.awssdk.auth.credentials.InstanceProfileCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import software.amazon.awssdk.services.sns.model.PublishResponse;

@Service
public class SnsService {

    private final SnsClient snsClient;

    public SnsService(@Value("${aws.sns.region}") String region) {
        this.snsClient = SnsClient.builder()
                .region(Region.of(region))
                .credentialsProvider(InstanceProfileCredentialsProvider.create())
                .build();
    }

    public String sendSms(String phoneNumber, String message) {
        try {
            PublishRequest request = PublishRequest.builder()
                    .message(message)
                    .phoneNumber(phoneNumber)
                    .build();
            PublishResponse response = snsClient.publish(request);
            return response.messageId();
        } catch (Exception e) {
            throw new RuntimeException("Failed to send SMS: " + e.getMessage());
        }
    }
}