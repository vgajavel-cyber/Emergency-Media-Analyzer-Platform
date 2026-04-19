package com.emap.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;

import java.util.Map;

@Configuration
public class SecretsManagerConfig {

    private static final String REGION = "us-east-1";

    @Bean
    public Map<String, String> appSecrets() {
        return getSecret("emap/app-secrets");
    }

    @Bean
    public Map<String, String> dbSecrets() {
        return getSecret("emap/database");
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> getSecret(String secretName) {
        SecretsManagerClient client = SecretsManagerClient.builder()
                .region(Region.of(REGION))
                .build();

        String secretValue = client.getSecretValue(
                GetSecretValueRequest.builder()
                        .secretId(secretName)
                        .build()
        ).secretString();

        try {
            return new ObjectMapper().readValue(secretValue, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse secret: " + secretName, e);
        }
    }
}